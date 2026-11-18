"""Kalender mit allen Schritten des aktiven Plans."""

from __future__ import annotations

from datetime import datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .entity import PizzaDoughEntity


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([PizzaDoughCalendar(entry.runtime_data)])


class PizzaDoughCalendar(PizzaDoughEntity, CalendarEntity):
    _attr_icon = "mdi:calendar-clock"

    def __init__(self, manager) -> None:
        super().__init__(manager, "schedule")

    def _events(self) -> list[CalendarEvent]:
        steps = self.manager.steps
        events = []
        for i, step in enumerate(steps):
            start = dt_util.parse_datetime(step["at"])
            nxt = dt_util.parse_datetime(steps[i + 1]["at"]) if i + 1 < len(steps) else None
            end = nxt if nxt and nxt > start else start + timedelta(minutes=15)
            events.append(
                CalendarEvent(
                    start=start,
                    end=end,
                    summary=f"🍕 {step['title']}",
                    description=step["description"],
                    uid=step["id"],
                )
            )
        return events

    @property
    def event(self) -> CalendarEvent | None:
        now = dt_util.utcnow()
        events = self._events()
        current = [e for e in events if e.start <= now < e.end]
        if current:
            return current[0]
        upcoming = [e for e in events if e.start > now]
        return upcoming[0] if upcoming else None

    async def async_get_events(self, hass: HomeAssistant, start_date: datetime, end_date: datetime) -> list[CalendarEvent]:
        return [e for e in self._events() if e.end > start_date and e.start < end_date]
