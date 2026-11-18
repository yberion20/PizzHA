# 🍕 PizzHA – Pizzateig-Planer

Teigrechner und Gärzeitplan für neapolitanische Pizza. Es gibt ihn als **Home-Assistant-Integration mit Lovelace-Karte** (inklusive Push-Erinnerungen aufs Handy) und als **eigenständige Web-App**.

## Was die App kann

- **Eingaben:** Anzahl und Gewicht der Teigballen, Hydration (%), Salz (%), Hefetyp (Frischhefe, Trockenhefe, Instant-Trockenhefe, Sauerteig) und 1–4 Gärphasen. Jede Phase ist eine Stockgare oder Stückgare mit eigener Dauer und Temperatur.
- **Ausgabe:** Mehl, Wasser, Salz und Hefe bzw. Anstellgut in Gramm, jeweils auch „pro kg Mehl“. Alle Prozentwerte beziehen sich auf das Mehl (Bäckerprozente).
- **Zeitplan:** Du gibst ein, wann gegessen wird. Die App rechnet rückwärts, wann du den Teig ansetzt, ihn in den Kühlschrank stellst, wieder herausnimmst, die Teiglinge schleifst, den Ofen vorheizt und backst.
- **Erinnerungen:**
  - In Home Assistant kommt bei jedem Schritt eine Push-Nachricht über die Companion-App, mit „Erledigt“-Knopf und optional mit einer Vorab-Erinnerung.
  - Die Web-App kann den Zeitplan als `.ics`-Kalenderdatei exportieren.

## Wie die Hefemenge berechnet wird

Jede Gärphase wird in **äquivalente Stunden bei 24 °C** umgerechnet. Grundlage ist ein Temperaturfaktor, zum Beispiel 4 °C ≈ 0,21, 16 °C ≈ 0,55 und 22 °C ≈ 0,86. Aus der Summe ergibt sich die Hefemenge:

```
Frischhefe-% = 7,93 / Heq^1,5        (begrenzt auf 0,02–3 %)
Trockenhefe  = Frischhefe × 0,4
Instant      = Frischhefe × 0,33
Anstellgut-% = 206 / Heq             (begrenzt auf 2–30 %, ×1,3 schwach / ×0,75 stark)
```

Die Kältefaktoren liegen bewusst etwas höher als die reine Hefeaktivität. Ein Teig kühlt im Kühlschrank erst über mehrere Stunden durch und gärt in dieser Zeit weiter.

**Kalibriert auf:**
- 42 h Kühlschrank (4,5 °C) + 5,5 h Raumtemperatur → ≈ 1,5 g Frischhefe pro kg Mehl (Referenzrezept)
- 24 h bei 22 °C → ≈ 0,09 %, 8 h bei 23 °C → ≈ 0,4 % Frischhefe (übliche neapolitanische Bereiche)

Online-Rechner weichen untereinander teils um den Faktor 2 ab. Jede Küche, jede Hefe und jedes Mehl verhält sich anders. Nutze darum unter **Feineinstellungen** den **Korrekturfaktor**:
- War der Teig zu träge, nimm einen Wert größer als 1.
- War er übergärig, nimm einen Wert kleiner als 1.

Dort kannst du die Hefe- oder Anstellgut-Menge auch direkt in Prozent vorgeben.

**Sauerteig:** Mehl und Wasser im Anstellgut werden von den Zugaben abgezogen. Hydration und Salz stimmen so weiterhin bezogen auf das Gesamtmehl. Die Kurve für das Anstellgut ist eine grobe Schätzung und sollte beim ersten Backen geprüft werden.

## Installation in Home Assistant

1. HACS → Integrationen → ⋮ → *Benutzerdefinierte Repositories* → dieses Repository als *Integration* hinzufügen. Danach „Pizzateig-Planer“ installieren und Home Assistant neu starten.
   Manuell geht es auch: den Ordner `custom_components/pizza_dough` nach `config/custom_components/` kopieren.
2. Einstellungen → Geräte & Dienste → *Integration hinzufügen* → **Pizzateig-Planer**.
3. Den Benachrichtigungsdienst deines Handys wählen, z. B. `mobile_app_mein_handy`. Optional eine Vorab-Erinnerung in Minuten einstellen.
4. Dashboard bearbeiten → *Karte hinzufügen* → **Pizzateig-Planer**. Oder per YAML:

   ```yaml
   type: custom:pizza-dough-card
   title: Pizzateig
   ```

   Die Karte wird von der Integration automatisch geladen. Eine eigene Lovelace-Ressource ist nicht nötig. Falls die Karte nach einem Update nicht erscheint, leere den Browser-Cache.

### Entitäten

| Entität | Inhalt |
|---|---|
| `sensor.pizzateig_status` | `idle` / `active` / `done`. Attribute: Plan, Mengen, alle Schritte |
| `sensor.pizzateig_next_step` | Titel des nächsten Schritts |
| `sensor.pizzateig_next_step_time` | Zeitpunkt des nächsten Schritts (Zeitstempel) |
| `calendar.pizzateig_schedule` | Alle Schritte als Kalendertermine |

Die Entity-IDs können je nach Sprache bei der Einrichtung abweichen. Die Karte findet den Status-Sensor automatisch.

### Dienste

- `pizza_dough.start_plan`: startet einen Plan. Wird von der Karte aufgerufen, Format siehe `services.yaml`.
- `pizza_dough.cancel_plan`: bricht den Plan ab.
- `pizza_dough.complete_step`: hakt einen Schritt ab (`step_id`).

### Eigene Automationen

Bei jedem Schritt feuert das Event `pizza_dough_step`. Es enthält `step_id`, `type`, `title`, `description`, `is_last` und weitere Felder. Beispiel: Ofen-Steckdose beim Schritt „Ofen vorheizen“ einschalten.

```yaml
automation:
  - alias: Pizzaofen vorheizen
    triggers:
      - trigger: event
        event_type: pizza_dough_step
        event_data:
          type: preheat
    actions:
      - action: switch.turn_on
        target:
          entity_id: switch.pizzaofen
```

Schritt-Typen: `mix`, `bulk_start`, `to_fridge`, `from_fridge`, `temp_change`, `shape`, `preheat`, `bake`.

## Web-App

```bash
npm install
npm -w @pizza-dough/web run dev
```

`npm run build` erzeugt die statische App in `packages/web/dist/`. Die lässt sich auf jedem Webserver ablegen und auf dem Handy als App installieren („Zum Startbildschirm hinzufügen“).

In der Web-App:
- Rezept und Plan werden im Browser gespeichert.
- Browser-Benachrichtigungen kommen nur, solange die App geöffnet ist. Zuverlässiger sind der Kalender-Export oder **„An Home Assistant senden“**. Dafür trägst du HA-URL und Long-Lived Token ein und ergänzt in der HA-Konfiguration:

  ```yaml
  http:
    cors_allowed_origins:
      - https://adresse-der-web-app
  ```

## Projektaufbau

```
packages/core   Rechenlogik: Teig, Hefemodell, Zeitplan, ICS (TypeScript, getestet mit vitest)
packages/ui     Gemeinsame Oberfläche (Lit-Web-Component <pizza-dough-planner>)
packages/card   Lovelace-Karte → custom_components/pizza_dough/www/pizza-dough-card.js
packages/web    Eigenständige Web-App (Vite, PWA)
custom_components/pizza_dough   Home-Assistant-Integration (Python)
tests/          Tests der Integration (pytest-homeassistant-custom-component)
```

Die gesamte Rechenlogik liegt nur in `core`. Die Karte berechnet den Plan im Browser und übergibt die fertigen Schritte an Home Assistant. Home Assistant speichert sie, übersteht Neustarts und verschickt die Erinnerungen.

## Entwicklung

```bash
npm install
npm test                  # Rechenlogik
npm run typecheck
npm run build             # Karte + Web-App
python3 -m venv .venv && .venv/bin/pip install pytest-homeassistant-custom-component
.venv/bin/python -m pytest   # Integration
```

Nach Änderungen an `packages/ui` oder `packages/card` muss `npm run build` laufen. Danach wird die gebaute Karte in `custom_components/pizza_dough/www/` mit eingecheckt, damit HACS sie mitliefert.
