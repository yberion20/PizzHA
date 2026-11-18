"""Verwaltung des aktiven Teigplans: Speichern, Erinnerungen planen, Benachrichtigen."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_utc_time
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    ACTION_PREFIX,
    CONF_NOTIFY_SERVICES,
    CONF_PERSISTENT,
    CONF_REMIND_BEFORE,
    DEFAULT_REMIND_BEFORE,
    DOMAIN,
    EVENT_STEP,
    MISSED_GRACE_MINUTES,
    STATUS_ACTIVE,
    STATUS_DONE,
    STATUS_IDLE,
)

_LOGGER = logging.getLogger(__name__)
STORAGE_VERSION = 1


def _parse(at: str | datetime) -> datetime:
    if isinstance(at, datetime):
        value = at
    else:
        value = dt_util.parse_datetime(at)
        if value is None:
            raise ValueError(f"Ungültiger Zeitpunkt: {at}")
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt_util.get_default_time_zone())
    return dt_util.as_utc(value)


class PlanManager:
    """Hält den aktuellen Plan und plant die Erinnerungen."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.plan")
        self.plan: dict[str, Any] | None = None
        self._unsubs: list[CALLBACK_TYPE] = []
        self._listeners: list[Callable[[], None]] = []
        self._unsub_action: CALLBACK_TYPE | None = None

    # ------------------------------------------------------------------ setup
    async def async_load(self) -> None:
        data = await self._store.async_load()
        self.plan = (data or {}).get("plan")
        self._unsub_action = self.hass.bus.async_listen(
            "mobile_app_notification_action", self._handle_notification_action
        )
        await self._async_reschedule()

    async def async_unload(self) -> None:
        self._cancel_timers()
        if self._unsub_action:
            self._unsub_action()
            self._unsub_action = None

    @property
    def options(self) -> dict[str, Any]:
        return {**self.entry.data, **self.entry.options}

    # -------------------------------------------------------------- listeners
    @callback
    def async_add_listener(self, update: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(update)

        def remove() -> None:
            self._listeners.remove(update)

        return remove

    @callback
    def _notify_listeners(self) -> None:
        for update in list(self._listeners):
            update()

    # ---------------------------------------------------------------- state
    @property
    def steps(self) -> list[dict[str, Any]]:
        return (self.plan or {}).get("steps", [])

    @property
    def status(self) -> str:
        if not self.plan:
            return STATUS_IDLE
        if all(s["done"] or s["notified"] for s in self.steps):
            return STATUS_DONE
        return STATUS_ACTIVE

    @property
    def next_step(self) -> dict[str, Any] | None:
        for step in self.steps:
            if not step["done"] and not step["notified"]:
                return step
        return None

    @property
    def current_step(self) -> dict[str, Any] | None:
        """Der zuletzt fällige, noch nicht abgehakte Schritt."""
        current = None
        for step in self.steps:
            if step["notified"] and not step["done"]:
                current = step
        return current

    # ---------------------------------------------------------------- actions
    async def async_start(self, plan: dict[str, Any]) -> None:
        steps = []
        for raw in plan["steps"]:
            steps.append(
                {
                    "id": str(raw["id"]),
                    "type": raw.get("type", "step"),
                    "title": raw["title"],
                    "description": raw.get("description", ""),
                    "at": _parse(raw["at"]).isoformat(),
                    "done": False,
                    "notified": False,
                }
            )
        if not steps:
            raise ValueError("Der Plan enthält keine Schritte.")
        steps.sort(key=lambda s: s["at"])
        self.plan = {
            "name": plan.get("name") or "Pizzateig",
            "eat_at": _parse(plan["eat_at"]).isoformat() if plan.get("eat_at") else steps[-1]["at"],
            "created": dt_util.utcnow().isoformat(),
            "recipe": plan.get("recipe") or {},
            "amounts": plan.get("amounts") or {},
            "steps": steps,
        }
        # Bereits vergangene Schritte gelten bei einem neuen Plan nicht als offen.
        now = dt_util.utcnow()
        for step in steps:
            if _parse(step["at"]) < now - timedelta(minutes=1):
                step["notified"] = True
        await self._async_save()
        await self._async_reschedule()
        self._notify_listeners()

    async def async_cancel(self) -> None:
        self._cancel_timers()
        self.plan = None
        await self._async_save()
        self._notify_listeners()

    async def async_complete_step(self, step_id: str) -> None:
        if not self.plan:
            return
        found = False
        for step in self.steps:
            if step["id"] == step_id:
                step["done"] = True
                step["notified"] = True
                found = True
        if not found:
            raise ValueError(f"Unbekannter Schritt: {step_id}")
        await self._async_save()
        await self._async_reschedule()
        self._notify_listeners()

    # ---------------------------------------------------------------- timers
    def _cancel_timers(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()

    async def _async_reschedule(self) -> None:
        self._cancel_timers()
        if not self.plan:
            return
        now = dt_util.utcnow()
        remind_before = int(self.options.get(CONF_REMIND_BEFORE, DEFAULT_REMIND_BEFORE) or 0)
        changed = False
        for step in self.steps:
            if step["done"] or step["notified"]:
                continue
            at = _parse(step["at"])
            if at <= now:
                if now - at <= timedelta(minutes=MISSED_GRACE_MINUTES):
                    await self._async_fire(step["id"], late=True)
                else:
                    step["notified"] = True
                    changed = True
                continue
            self._unsubs.append(
                async_track_point_in_utc_time(self.hass, self._make_cb(step["id"], False), at)
            )
            if remind_before > 0 and at - timedelta(minutes=remind_before) > now:
                self._unsubs.append(
                    async_track_point_in_utc_time(
                        self.hass,
                        self._make_cb(step["id"], True),
                        at - timedelta(minutes=remind_before),
                    )
                )
        if changed:
            await self._async_save()

    def _make_cb(self, step_id: str, pre: bool):
        async def _cb(_now: datetime) -> None:
            if pre:
                await self._async_send_pre_reminder(step_id)
            else:
                await self._async_fire(step_id)

        return _cb

    def _get(self, step_id: str) -> dict[str, Any] | None:
        return next((s for s in self.steps if s["id"] == step_id), None)

    async def _async_send_pre_reminder(self, step_id: str) -> None:
        step = self._get(step_id)
        if not step or step["done"]:
            return
        minutes = int(self.options.get(CONF_REMIND_BEFORE, 0) or 0)
        await self._async_notify(
            f"🍕 In {minutes} min: {step['title']}",
            step["description"],
            step_id,
            with_action=False,
        )

    async def _async_fire(self, step_id: str, late: bool = False) -> None:
        step = self._get(step_id)
        if not step or step["done"] or step["notified"]:
            return
        step["notified"] = True
        await self._async_save()
        index = self.steps.index(step)
        self.hass.bus.async_fire(
            EVENT_STEP,
            {
                "step_id": step["id"],
                "type": step["type"],
                "title": step["title"],
                "description": step["description"],
                "at": step["at"],
                "index": index,
                "is_last": index == len(self.steps) - 1,
                "plan_name": self.plan["name"] if self.plan else None,
            },
        )
        title = f"🍕 {step['title']}" + (" (verspätet)" if late else "")
        await self._async_notify(title, step["description"], step_id, with_action=True)
        self._notify_listeners()

    async def _async_notify(self, title: str, message: str, step_id: str, with_action: bool) -> None:
        services: list[str] = list(self.options.get(CONF_NOTIFY_SERVICES) or [])
        data: dict[str, Any] = {"tag": f"pizza_dough_{step_id}", "group": "pizza_dough"}
        if with_action:
            data["actions"] = [{"action": f"{ACTION_PREFIX}{step_id}", "title": "Erledigt"}]
        for service in services:
            service = service.removeprefix("notify.")
            if not self.hass.services.has_service("notify", service):
                _LOGGER.warning("Benachrichtigungsdienst notify.%s nicht gefunden", service)
                continue
            try:
                await self.hass.services.async_call(
                    "notify",
                    service,
                    {"title": title, "message": message or title, "data": data},
                    blocking=True,
                )
            except Exception:  # noqa: BLE001 - ein defekter Dienst soll die anderen nicht blockieren
                _LOGGER.exception("Benachrichtigung über notify.%s fehlgeschlagen", service)
        if self.options.get(CONF_PERSISTENT, False):
            await self.hass.services.async_call(
                "persistent_notification",
                "create",
                {"title": title, "message": message or title, "notification_id": f"pizza_dough_{step_id}"},
                blocking=True,
            )

    async def _handle_notification_action(self, event: Event) -> None:
        action = event.data.get("action", "")
        if not isinstance(action, str) or not action.startswith(ACTION_PREFIX):
            return
        step_id = action.removeprefix(ACTION_PREFIX)
        if self._get(step_id):
            await self.async_complete_step(step_id)

    async def _async_save(self) -> None:
        await self._store.async_save({"plan": self.plan})
