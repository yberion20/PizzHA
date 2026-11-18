import { LitElement, css, html, nothing } from "lit";
import "@pizza-dough/ui";
import { loadRaw, save, type ActivePlan, type PlanBackend } from "@pizza-dough/ui";
import type { PlanPayload } from "@pizza-dough/core";

const STORAGE_ACTIVE = "pizza-dough:active-plan";
const STORAGE_HA = "pizza-dough:ha";

interface HaSettings {
  url: string;
  token: string;
}

/** Eigenständige Web-App: Plan lokal speichern, Browser-Benachrichtigungen, optional an HA senden. */
class PizzaDoughApp extends LitElement {
  static properties = { _plan: { state: true }, _ha: { state: true }, _notifyState: { state: true } };
  declare _plan: ActivePlan | null;
  declare _ha: HaSettings;
  declare _notifyState: string;
  private _timers: number[] = [];
  private _backend: PlanBackend;

  constructor() {
    super();
    this._plan = loadRaw<ActivePlan>(STORAGE_ACTIVE);
    this._ha = loadRaw<HaSettings>(STORAGE_HA) ?? { url: "", token: "" };
    this._notifyState = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
    this._backend = {
      label: "den Browser (solange die App geöffnet ist) – für zuverlässige Erinnerungen den Kalender-Export nutzen",
      startPlan: async (p) => this._setPlan(this._fromPayload(p)),
      cancelPlan: async () => this._setPlan(null),
      completeStep: async (id) => {
        if (!this._plan) return;
        this._setPlan({ ...this._plan, steps: this._plan.steps.map((s) => (s.id === id ? { ...s, done: true, notified: true } : s)) });
      },
    };
    this._refreshNotified();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._schedule();
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js").catch(() => undefined);
    }
  }

  private _fromPayload(p: PlanPayload): ActivePlan {
    const now = Date.now();
    return {
      name: p.name,
      eat_at: p.eat_at,
      amounts: p.amounts,
      steps: p.steps.map((s) => ({ ...s, done: false, notified: new Date(s.at).getTime() < now - 60_000 })),
    };
  }

  private _setPlan(plan: ActivePlan | null) {
    this._plan = plan;
    save(STORAGE_ACTIVE, plan);
    this._schedule();
  }

  private _refreshNotified() {
    if (!this._plan) return;
    const now = Date.now();
    const steps = this._plan.steps.map((s) => (!s.notified && new Date(s.at).getTime() <= now ? { ...s, notified: true } : s));
    if (steps.some((s, i) => s.notified !== this._plan!.steps[i].notified)) {
      this._plan = { ...this._plan, steps };
      save(STORAGE_ACTIVE, this._plan);
    }
  }

  private _schedule() {
    this._timers.forEach((t) => clearTimeout(t));
    this._timers = [];
    if (!this._plan) return;
    const now = Date.now();
    for (const step of this._plan.steps) {
      const ms = new Date(step.at).getTime() - now;
      if (step.notified || step.done || ms < 0 || ms > 2 ** 31 - 1) continue;
      this._timers.push(
        window.setTimeout(() => {
          this._showNotification(`🍕 ${step.title}`, step.description, step.id);
          this._refreshNotified();
          this.requestUpdate();
        }, ms),
      );
    }
  }

  private async _showNotification(title: string, body: string, tag: string) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.showNotification(title, { body, tag, icon: "./icon.svg" });
      else new Notification(title, { body, tag });
    } catch {
      /* ignorieren */
    }
  }

  private async _askPermission() {
    if (typeof Notification === "undefined") return;
    this._notifyState = await Notification.requestPermission();
  }

  private _sendToHa = async (plan: PlanPayload): Promise<string> => {
    const { url, token } = this._ha;
    if (!url || !token) throw new Error("Bitte zuerst unten Home-Assistant-URL und Token eintragen.");
    const res = await fetch(`${url.replace(/\/$/, "")}/api/services/pizza_dough/start_plan`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    if (!res.ok) throw new Error(`Home Assistant antwortet mit ${res.status} ${res.statusText}`);
    return "Plan an Home Assistant gesendet. Die Erinnerungen kommen jetzt über die Companion-App.";
  };

  private _saveHa(patch: Partial<HaSettings>) {
    this._ha = { ...this._ha, ...patch };
    save(STORAGE_HA, this._ha);
  }

  render() {
    return html`
      <header>
        <img src="./icon.svg" alt="" width="36" height="36" />
        <div>
          <h1>Pizzateig-Planer</h1>
          <p>Teigrechner und Gärzeitplan für neapolitanische Pizza</p>
        </div>
      </header>
      <main>
        <section class="card">
          <pizza-dough-planner
            .backend=${this._backend}
            .activePlan=${this._plan}
            .extraActions=${[{ label: "An Home Assistant senden", run: this._sendToHa }]}
          ></pizza-dough-planner>
        </section>

        <details class="card">
          <summary>Erinnerungen &amp; Home Assistant</summary>
          <p>
            Browser-Benachrichtigungen funktionieren nur, solange die App geöffnet ist. Für zuverlässige Erinnerungen
            gibt es zwei Wege: den Zeitplan als Kalenderdatei (.ics) ins Handy importieren, oder den Plan an Home Assistant
            senden, das die Erinnerungen dann über die Companion-App schickt.
          </p>
          ${this._notifyState === "default"
            ? html`<button @click=${this._askPermission}>Browser-Benachrichtigungen erlauben</button>`
            : html`<p class="muted">Browser-Benachrichtigungen: ${
                { granted: "erlaubt", denied: "blockiert", unsupported: "nicht unterstützt" }[this._notifyState] ?? this._notifyState
              }</p>`}
          <div class="ha">
            <label>Home-Assistant-URL<input type="url" placeholder="https://homeassistant.local:8123" .value=${this._ha.url}
              @change=${(e: Event) => this._saveHa({ url: (e.target as HTMLInputElement).value.trim() })} /></label>
            <label>Long-Lived Access Token<input type="password" autocomplete="off" .value=${this._ha.token}
              @change=${(e: Event) => this._saveHa({ token: (e.target as HTMLInputElement).value.trim() })} /></label>
          </div>
          <p class="muted">
            Den Token erstellst du in Home Assistant unter Profil → Sicherheit. Er wird nur in diesem Browser gespeichert.
            Damit der Browser Home Assistant erreichen darf, muss die Adresse dieser App in <code>http: cors_allowed_origins</code> eingetragen sein.
          </p>
          ${this._ha.token ? html`<button @click=${() => this._saveHa({ token: "" })}>Token löschen</button>` : nothing}
        </details>
      </main>
    `;
  }

  static styles = css`
    :host { display: block; max-width: 760px; margin: 0 auto; padding: 16px 16px 40px; }
    header { display: flex; gap: 12px; align-items: center; margin: 8px 0 16px; }
    h1 { font-size: 22px; margin: 0; }
    header p { margin: 2px 0 0; color: var(--secondary-text-color); font-size: 13px; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 14px; padding: 8px 16px 16px; margin-bottom: 16px; }
    details.card { padding: 14px 16px; font-size: 14px; }
    summary { font-weight: 600; cursor: pointer; }
    .ha { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin: 12px 0; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); }
    input { font: inherit; font-size: 15px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--secondary-background-color); color: var(--primary-text-color); }
    button { font: inherit; font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--secondary-background-color); color: var(--primary-text-color); cursor: pointer; }
    .muted { color: var(--secondary-text-color); font-size: 12px; }
    code { font-size: 12px; }
  `;
}

customElements.define("pizza-dough-app", PizzaDoughApp);
