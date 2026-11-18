"""Tests für die Home-Assistant-Integration pizza_dough."""

from datetime import timedelta

from freezegun.api import FrozenDateTimeFactory
import pytest

from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.pizza_dough.const import DOMAIN, EVENT_STEP

NOW = dt_util.parse_datetime("2026-11-19T12:00:00+00:00")


def _plan(base):
    return {
        "name": "Testpizza",
        "eat_at": (base + timedelta(hours=3)).isoformat(),
        "amounts": {"flour": 975.6, "water": 634.1, "salt": 29.3, "yeast": 1.46},
        "steps": [
            {"id": "1_mix", "type": "mix", "title": "Teig ansetzen", "at": (base + timedelta(hours=1)).isoformat(), "description": "Kneten"},
            {"id": "2_shape", "type": "shape", "title": "Teiglinge formen", "at": (base + timedelta(hours=2)).isoformat(), "description": "Schleifen"},
            {"id": "3_bake", "type": "bake", "title": "Pizza backen", "at": (base + timedelta(hours=2, minutes=30)).isoformat()},
        ],
    }


def _status(hass):
    return next(s for s in hass.states.async_all("sensor") if s.attributes.get("pizza_dough"))


@pytest.fixture
async def setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory):
    freezer.move_to(NOW)
    notify_calls = async_mock_service(hass, "notify", "mobile_app_handy")
    entry = MockConfigEntry(domain=DOMAIN, data={"notify_services": ["mobile_app_handy"], "remind_before": 15, "persistent_notification": False})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry, notify_calls


async def test_config_flow(hass: HomeAssistant) -> None:
    async_mock_service(hass, "notify", "mobile_app_handy")
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"notify_services": ["notify.mobile_app_handy"], "remind_before": 10}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"]["notify_services"] == ["mobile_app_handy"]
    assert result["data"]["remind_before"] == 10
    # nur eine Instanz erlaubt
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT


async def test_plan_notifications(hass: HomeAssistant, setup, freezer: FrozenDateTimeFactory) -> None:
    _entry, calls = setup
    events = async_capture_events(hass, EVENT_STEP)
    assert _status(hass).state == "idle"

    await hass.services.async_call(DOMAIN, "start_plan", _plan(NOW), blocking=True)
    await hass.async_block_till_done()
    st = _status(hass)
    assert st.state == "active"
    assert st.attributes["next_step_id"] == "1_mix"
    assert len(st.attributes["steps"]) == 3
    assert hass.states.get("sensor.pizzateig_next_step").state == "Teig ansetzen"

    # Vorab-Erinnerung 15 min vorher
    freezer.tick(timedelta(minutes=45, seconds=1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(calls) == 1
    assert calls[0].data["title"].startswith("🍕 In 15 min")

    # Schritt fällig
    freezer.tick(timedelta(minutes=15))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(calls) == 2
    assert calls[1].data["title"] == "🍕 Teig ansetzen"
    assert calls[1].data["data"]["actions"][0]["action"] == "PIZZA_DOUGH_DONE_1_mix"
    assert len(events) == 1 and events[0].data["step_id"] == "1_mix"
    assert _status(hass).attributes["next_step_id"] == "2_shape"

    # "Erledigt" aus der Handy-Benachrichtigung
    hass.bus.async_fire("mobile_app_notification_action", {"action": "PIZZA_DOUGH_DONE_1_mix"})
    await hass.async_block_till_done()
    step = next(s for s in _status(hass).attributes["steps"] if s["id"] == "1_mix")
    assert step["done"] is True

    # Kalender
    cal = hass.states.get("calendar.pizzateig_schedule")
    assert cal is not None

    # Rest durchlaufen
    freezer.tick(timedelta(hours=2))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert _status(hass).state == "done"
    assert [e.data["step_id"] for e in events] == ["1_mix", "2_shape", "3_bake"]


async def test_complete_and_cancel(hass: HomeAssistant, setup) -> None:
    _entry, calls = setup
    await hass.services.async_call(DOMAIN, "start_plan", _plan(NOW), blocking=True)
    await hass.services.async_call(DOMAIN, "complete_step", {"step_id": "1_mix"}, blocking=True)
    await hass.async_block_till_done()
    assert _status(hass).attributes["next_step_id"] == "2_shape"
    await hass.services.async_call(DOMAIN, "cancel_plan", {}, blocking=True)
    await hass.async_block_till_done()
    assert _status(hass).state == "idle"
    assert hass.states.get("sensor.pizzateig_next_step_time").state == "unknown"


async def test_plan_survives_restart(hass: HomeAssistant, setup, freezer: FrozenDateTimeFactory) -> None:
    entry, calls = setup
    await hass.services.async_call(DOMAIN, "start_plan", _plan(NOW), blocking=True)
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert _status(hass).state == "active"
    freezer.tick(timedelta(hours=1, seconds=1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert any(c.data["title"] == "🍕 Teig ansetzen" for c in calls)


async def test_invalid_plan(hass: HomeAssistant, setup) -> None:
    from homeassistant.exceptions import ServiceValidationError
    import voluptuous as vol

    with pytest.raises(vol.Invalid):
        await hass.services.async_call(DOMAIN, "start_plan", {"steps": []}, blocking=True)
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, "start_plan", {"steps": [{"id": "x", "title": "t", "at": "kein datum"}]}, blocking=True)


async def _lovelace_resources(hass):
    from homeassistant.components.lovelace.const import LOVELACE_DATA

    res = hass.data[LOVELACE_DATA].resources
    if not res.loaded:
        await res.async_load()
        res.loaded = True
    return [i for i in res.async_items() if i["url"].startswith("/pizza_dough/")]


async def test_card_resource_registered(hass: HomeAssistant, hass_client) -> None:
    from homeassistant.components.lovelace.const import LOVELACE_DATA
    from homeassistant.setup import async_setup_component

    assert await async_setup_component(hass, "http", {})
    assert await async_setup_component(hass, "lovelace", {})
    res = hass.data[LOVELACE_DATA].resources
    await res.async_load()
    res.loaded = True
    # veraltete Ressource aus einer früheren Version
    await res.async_create_item({"res_type": "module", "url": "/pizza_dough/pizza-dough-card.js?v=0.1.0"})

    entry = MockConfigEntry(domain=DOMAIN, data={"notify_services": []})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    items = await _lovelace_resources(hass)
    assert len(items) == 1
    assert items[0]["type"] == "module"
    assert items[0]["url"].startswith("/pizza_dough/pizza-dough-card.js?v=")
    assert items[0]["url"] != "/pizza_dough/pizza-dough-card.js?v=0.1.0"

    # Reload erzeugt kein Duplikat
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert len(await _lovelace_resources(hass)) == 1

    # Datei wird ausgeliefert
    client = await hass_client()
    resp = await client.get(items[0]["url"])
    assert resp.status == 200
    assert "pizza-dough-card" in await resp.text()

    # Entfernen der Integration räumt die Ressource auf
    assert await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert await _lovelace_resources(hass) == []
