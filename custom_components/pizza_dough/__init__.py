"""Pizzateig-Planer: Zeitplan und Erinnerungen für Pizzateig."""

from __future__ import annotations

import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    CARD_FILENAME,
    CARD_URL,
    DOMAIN,
    SERVICE_CANCEL_PLAN,
    SERVICE_COMPLETE_STEP,
    SERVICE_START_PLAN,
    VERSION,
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


async def _async_register_card(hass: HomeAssistant) -> None:
    """Liefert www/pizza-dough-card.js aus und lädt sie automatisch im Frontend."""
    card = Path(__file__).parent / "www" / CARD_FILENAME
    if not card.is_file() or getattr(hass, "http", None) is None:
        _LOGGER.debug("Lovelace-Karte wird nicht registriert (Datei oder HTTP fehlt)")
        return
    try:
        from homeassistant.components.frontend import add_extra_js_url
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(card), True)])
        add_extra_js_url(hass, f"{CARD_URL}?v={VERSION}")
    except (KeyError, RuntimeError, HomeAssistantError) as err:  # Frontend nicht geladen
        _LOGGER.warning("Lovelace-Karte konnte nicht registriert werden: %s", err)


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
