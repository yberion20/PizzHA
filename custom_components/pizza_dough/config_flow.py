"""Einrichtung über die Oberfläche."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import selector

from .const import CONF_NOTIFY_SERVICES, CONF_PERSISTENT, CONF_REMIND_BEFORE, DEFAULT_REMIND_BEFORE, DOMAIN


def _schema(hass: HomeAssistant, current: dict[str, Any]) -> vol.Schema:
    services = sorted(hass.services.async_services_for_domain("notify"))
    preferred = [s for s in services if s.startswith("mobile_app_")] + [
        s for s in services if not s.startswith("mobile_app_") and s not in ("notify", "persistent_notification")
    ]
    return vol.Schema(
        {
            vol.Optional(CONF_NOTIFY_SERVICES, default=current.get(CONF_NOTIFY_SERVICES, [])): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=preferred,
                    multiple=True,
                    custom_value=True,
                    mode=selector.SelectSelectorMode.DROPDOWN,
                )
            ),
            vol.Optional(
                CONF_REMIND_BEFORE, default=current.get(CONF_REMIND_BEFORE, DEFAULT_REMIND_BEFORE)
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(min=0, max=180, step=5, unit_of_measurement="min", mode=selector.NumberSelectorMode.BOX)
            ),
            vol.Optional(CONF_PERSISTENT, default=current.get(CONF_PERSISTENT, False)): selector.BooleanSelector(),
        }
    )


def _clean(data: dict[str, Any]) -> dict[str, Any]:
    return {
        CONF_NOTIFY_SERVICES: [s.removeprefix("notify.") for s in data.get(CONF_NOTIFY_SERVICES, [])],
        CONF_REMIND_BEFORE: int(data.get(CONF_REMIND_BEFORE, 0) or 0),
        CONF_PERSISTENT: bool(data.get(CONF_PERSISTENT, False)),
    }


class PizzaDoughConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="Pizzateig", data=_clean(user_input))
        return self.async_show_form(step_id="user", data_schema=_schema(self.hass, {}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return PizzaDoughOptionsFlow()


class PizzaDoughOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=_clean(user_input))
        current = {**self.config_entry.data, **self.config_entry.options}
        return self.async_show_form(step_id="init", data_schema=_schema(self.hass, current))
