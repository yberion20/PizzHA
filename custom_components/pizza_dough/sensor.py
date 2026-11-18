"""Sensoren: Status, nächster Schritt, Zeitpunkt des nächsten Schritts."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import STATUS_ACTIVE, STATUS_DONE, STATUS_IDLE
from .entity import PizzaDoughEntity


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities: AddEntitiesCallback) -> None:
    manager = entry.runtime_data
    async_add_entities([StatusSensor(manager), NextStepSensor(manager), NextStepTimeSensor(manager)])


class StatusSensor(PizzaDoughEntity, SensorEntity):
    """Status des Plans. Die Attribute enthalten alles, was die Lovelace-Karte braucht."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = [STATUS_IDLE, STATUS_ACTIVE, STATUS_DONE]
    _attr_icon = "mdi:pizza"

    def __init__(self, manager) -> None:
        super().__init__(manager, "status")

    @property
    def native_value(self) -> str:
        return self.manager.status

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        plan = self.manager.plan or {}
        nxt = self.manager.next_step
        cur = self.manager.current_step
        return {
            "pizza_dough": True,
            "name": plan.get("name"),
            "eat_at": plan.get("eat_at"),
            "amounts": plan.get("amounts"),
            "recipe": plan.get("recipe"),
            "steps": plan.get("steps", []),
            "next_step_id": nxt["id"] if nxt else None,
            "current_step_id": cur["id"] if cur else None,
        }


class NextStepSensor(PizzaDoughEntity, SensorEntity):
    _attr_icon = "mdi:chef-hat"

    def __init__(self, manager) -> None:
        super().__init__(manager, "next_step")

    @property
    def native_value(self) -> str | None:
        nxt = self.manager.next_step
        return nxt["title"][:255] if nxt else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        nxt = self.manager.next_step
        return {"description": nxt["description"], "at": nxt["at"], "step_id": nxt["id"]} if nxt else {}


class NextStepTimeSensor(PizzaDoughEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, manager) -> None:
        super().__init__(manager, "next_step_time")

    @property
    def native_value(self) -> datetime | None:
        nxt = self.manager.next_step
        return dt_util.parse_datetime(nxt["at"]) if nxt else None
