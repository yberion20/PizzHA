"""Konstanten für den Pizzateig-Planer."""

from __future__ import annotations

DOMAIN = "pizza_dough"
VERSION = "0.1.0"

CONF_NOTIFY_SERVICES = "notify_services"
CONF_REMIND_BEFORE = "remind_before"
CONF_PERSISTENT = "persistent_notification"

DEFAULT_REMIND_BEFORE = 0

SERVICE_START_PLAN = "start_plan"
SERVICE_CANCEL_PLAN = "cancel_plan"
SERVICE_COMPLETE_STEP = "complete_step"

EVENT_STEP = f"{DOMAIN}_step"
ACTION_PREFIX = "PIZZA_DOUGH_DONE_"

STATUS_IDLE = "idle"
STATUS_ACTIVE = "active"
STATUS_DONE = "done"

# Schritte, die mehr als so viele Minuten verpasst wurden (z. B. weil HA aus war),
# werden nach einem Neustart nicht mehr nachträglich gemeldet.
MISSED_GRACE_MINUTES = 30

CARD_URL = f"/{DOMAIN}/pizza-dough-card.js"
CARD_FILENAME = "pizza-dough-card.js"
