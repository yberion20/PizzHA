"""Gemeinsame Basis der Entitäten."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOMAIN, VERSION
from .manager import PlanManager


class PizzaDoughEntity(Entity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, manager: PlanManager, key: str) -> None:
        self.manager = manager
        self._attr_unique_id = f"{manager.entry.entry_id}_{key}"
        self._attr_translation_key = key
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, manager.entry.entry_id)},
            name="Pizzateig",
            entry_type=DeviceEntryType.SERVICE,
            sw_version=VERSION,
        )

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.manager.async_add_listener(self.async_write_ha_state))
