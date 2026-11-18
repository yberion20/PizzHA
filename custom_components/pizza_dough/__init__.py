"""Pizzateig-Planer: Zeitplan und Erinnerungen für Pizzateig."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import Event, HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    CARD_FILENAME,
    CARD_URL,
    DOMAIN,
    SERVICE_CANCEL_PLAN,
    SERVICE_COMPLETE_STEP,
    SERVICE_START_PLAN,
)
from .manager import PlanManager

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SENSOR, Platform.CALENDAR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

STEP_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        vol.Required("title"): cv.string,
        vol.Required("at"): cv.string,
        vol.Optional("description", default=""): cv.string,
        vol.Optional("type", default="step"): cv.string,
    },
    extra=vol.ALLOW_EXTRA,
)

START_PLAN_SCHEMA = vol.Schema(
    {
        vol.Optional("name"): cv.string,
        vol.Optional("eat_at"): cv.string,
        vol.Required("steps"): vol.All(cv.ensure_list, [STEP_SCHEMA], vol.Length(min=1)),
        vol.Optional("recipe"): dict,
        vol.Optional("amounts"): dict,
    }
)

COMPLETE_STEP_SCHEMA = vol.Schema({vol.Required("step_id"): cv.string})

type PizzaConfigEntry = ConfigEntry[PlanManager]


def _manager(hass: HomeAssistant) -> PlanManager:
    manager: PlanManager | None = hass.data.get(DOMAIN)
    if manager is None:
        raise ServiceValidationError("Der Pizzateig-Planer ist nicht eingerichtet.")
    return manager


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Dienste registrieren und die Lovelace-Karte bereitstellen."""

    async def start_plan(call: ServiceCall) -> None:
        try:
            await _manager(hass).async_start(dict(call.data))
        except ValueError as err:
            raise ServiceValidationError(str(err)) from err

    async def cancel_plan(call: ServiceCall) -> None:
        await _manager(hass).async_cancel()

    async def complete_step(call: ServiceCall) -> None:
        try:
            await _manager(hass).async_complete_step(call.data["step_id"])
        except ValueError as err:
            raise ServiceValidationError(str(err)) from err

    hass.services.async_register(DOMAIN, SERVICE_START_PLAN, start_plan, schema=START_PLAN_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_CANCEL_PLAN, cancel_plan)
    hass.services.async_register(DOMAIN, SERVICE_COMPLETE_STEP, complete_step, schema=COMPLETE_STEP_SCHEMA)

    await _async_register_card(hass)
    return True


def _card_path() -> Path:
    return Path(__file__).parent / "www" / CARD_FILENAME


def _file_hash(path: Path) -> str:
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]


async def _async_register_card(hass: HomeAssistant) -> None:
    """Liefert www/pizza-dough-card.js aus und sorgt dafür, dass das Frontend sie lädt."""
    card = _card_path()
    if not await hass.async_add_executor_job(card.is_file):
        _LOGGER.error(
            "Lovelace-Karte fehlt (%s). Die Installation ist unvollständig, bitte die Integration "
            "in HACS neu herunterladen",
            card,
        )
        return
    if getattr(hass, "http", None) is None:
        _LOGGER.warning("HTTP-Komponente nicht geladen, Lovelace-Karte wird nicht bereitgestellt")
        return

    from homeassistant.components.http import StaticPathConfig

    try:
        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(card), False)])
    except RuntimeError:
        _LOGGER.debug("Statischer Pfad %s ist bereits registriert", CARD_URL)

    url = f"{CARD_URL}?v={await hass.async_add_executor_job(_file_hash, card)}"

    # Rückfallebene: Modul direkt in jede Frontend-Seite einbinden
    try:
        from homeassistant.components.frontend import add_extra_js_url

        add_extra_js_url(hass, url)
    except (ImportError, KeyError) as err:
        _LOGGER.debug("add_extra_js_url nicht verfügbar: %s", err)

    async def _register(_event: Event | None = None) -> None:
        try:
            await _async_register_lovelace_resource(hass, url)
        except Exception:  # noqa: BLE001 - die Integration soll trotzdem laufen
            _LOGGER.exception("Lovelace-Ressource konnte nicht registriert werden")

    if _lovelace_data(hass) is not None:
        await _register()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register)


def _lovelace_data(hass: HomeAssistant) -> Any:
    try:
        from homeassistant.components.lovelace.const import LOVELACE_DATA
    except ImportError:
        return None
    return hass.data.get(LOVELACE_DATA)


async def _async_resources(hass: HomeAssistant) -> Any:
    """Die Ressourcen-Sammlung im Storage-Modus, sonst None."""
    data = _lovelace_data(hass)
    if data is None:
        return None
    if getattr(data, "resource_mode", None) != "storage":
        return None
    resources = data.resources
    if not getattr(resources, "loaded", True):
        await resources.async_load()
        resources.loaded = True
    return resources


async def _async_register_lovelace_resource(hass: HomeAssistant, url: str) -> None:
    """Trägt die Karte unter Einstellungen → Dashboards → Ressourcen ein (wie HACS für Plugins)."""
    data = _lovelace_data(hass)
    if data is None:
        _LOGGER.warning("Lovelace ist nicht geladen, Karte nur über extra_module_url eingebunden")
        return
    resources = await _async_resources(hass)
    if resources is None:
        _LOGGER.warning(
            "Lovelace läuft im YAML-Modus. Bitte unter lovelace: resources: eintragen: "
            "- url: %s  type: module",
            CARD_URL,
        )
        return
    existing = [item for item in resources.async_items() if str(item.get("url", "")).split("?")[0] == CARD_URL]
    if existing:
        first, *duplicates = existing
        if first.get("url") != url or first.get("type") != "module":
            await resources.async_update_item(first["id"], {"res_type": "module", "url": url})
            _LOGGER.info("Lovelace-Ressource aktualisiert: %s", url)
        for item in duplicates:
            await resources.async_delete_item(item["id"])
        return
    await resources.async_create_item({"res_type": "module", "url": url})
    _LOGGER.info("Lovelace-Karte als Ressource registriert: %s", url)


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Beim Entfernen der Integration auch die Lovelace-Ressource entfernen."""
    resources = await _async_resources(hass)
    if resources is None:
        return
    for item in list(resources.async_items()):
        if str(item.get("url", "")).split("?")[0] == CARD_URL:
            await resources.async_delete_item(item["id"])


async def async_setup_entry(hass: HomeAssistant, entry: PizzaConfigEntry) -> bool:
    manager = PlanManager(hass, entry)
    await manager.async_load()
    entry.runtime_data = manager
    hass.data[DOMAIN] = manager
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: PizzaConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: PizzaConfigEntry) -> bool:
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await entry.runtime_data.async_unload()
        hass.data.pop(DOMAIN, None)
    return unloaded
