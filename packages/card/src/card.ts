import { LitElement, css, html, nothing } from "lit";
import "@pizza-dough/ui";
import type { ActivePlan, PlanBackend } from "@pizza-dough/ui";
import type { PlanPayload } from "@pizza-dough/core";

interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}

interface Hass {
  states: Record<string, HassEntity>;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
}

interface CardConfig {
  type: string;
  title?: string;
  entity?: string;
}

const DOMAIN = "pizza_dough";

class PizzaDoughCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  declare hass: Hass | undefined;
  declare _config: CardConfig;
  private _backend: PlanBackend;
  private _lastPlanKey = "";
  private _plan: ActivePlan | null = null;

  constructor() {
    super();
    this._config = { type: "custom:pizza-dough-card" };
    this._backend = {
      label: "Home Assistant",
      startPlan: async (plan: PlanPayload) => {
        await this.hass!.callService(DOMAIN, "start_plan", plan as unknown as Record<string, unknown>);
      },
      cancelPlan: async () => {
        await this.hass!.callService(DOMAIN, "cancel_plan", {});
      },
      completeStep: async (id: string) => {
        await this.hass!.callService(DOMAIN, "complete_step", { step_id: id });
      },
    };
  }

  setConfig(config: CardConfig) {
    this._config = { ...config };
  }

  static getConfigElement() {
    return document.createElement("pizza-dough-card-editor");
  }

  static getStubConfig() {
    return { title: "Pizzateig" };
  }

  getCardSize() {
    return 8;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  private get _entity(): HassEntity | undefined {
    if (!this.hass) return undefined;
    if (this._config.entity) return this.hass.states[this._config.entity];
    return Object.values(this.hass.states).find((s) => s.entity_id.startsWith("sensor.") && s.attributes?.pizza_dough === true);
  }

  private _activePlan(): ActivePlan | null {
    const e = this._entity;
    if (!e || e.state === "idle" || !Array.isArray(e.attributes.steps) || e.attributes.steps.length === 0) {
      this._plan = null;
      this._lastPlanKey = "";
      return null;
    }
    // Neues Objekt nur, wenn sich der Plan wirklich geändert hat (vermeidet unnötiges Neuzeichnen)
    const key = JSON.stringify([e.state, e.attributes.steps, e.attributes.name]);
    if (key !== this._lastPlanKey) {
      this._lastPlanKey = key;
      this._plan = {
        name: e.attributes.name ?? "Pizzateig",
        eat_at: e.attributes.eat_at,
        amounts: e.attributes.amounts ?? {},
        steps: e.attributes.steps,
      };
    }
    return this._plan;
  }

  render() {
    const entity = this._entity;
    return html`
      <ha-card .header=${this._config.title ?? "Pizzateig"}>
        <div class="card-content">
          ${this.hass && !entity
            ? html`<p class="hint">Die Integration „Pizzateig-Planer“ ist noch nicht eingerichtet. Der Rechner funktioniert trotzdem, Erinnerungen gibt es aber erst nach der Einrichtung unter Einstellungen → Geräte &amp; Dienste.</p>`
            : nothing}
          <pizza-dough-planner .backend=${entity ? this._backend : undefined} .activePlan=${this._activePlan()}></pizza-dough-planner>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    .card-content { padding: 0 16px 16px; }
    .hint { color: var(--warning-color, #b26a00); font-size: 13px; }
  `;
}

class PizzaDoughCardEditor extends LitElement {
  static properties = { hass: { attribute: false }, _config: { state: true } };
  declare hass: Hass | undefined;
  declare _config: CardConfig;

  setConfig(config: CardConfig) {
    this._config = config;
  }

  private _schema = [
    { name: "title", selector: { text: {} } },
    { name: "entity", selector: { entity: { domain: "sensor", integration: DOMAIN } } },
  ];

  private _label = (s: { name: string }) => (s.name === "title" ? "Titel" : "Status-Sensor (optional, sonst automatisch)");

  render() {
    if (!this.hass || !this._config) return nothing;
    return html`<ha-form .hass=${this.hass} .data=${this._config} .schema=${this._schema} .computeLabel=${this._label}
      @value-changed=${(e: CustomEvent) => {
        this._config = e.detail.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
      }}></ha-form>`;
  }
}

if (!customElements.get("pizza-dough-card")) customElements.define("pizza-dough-card", PizzaDoughCard);
if (!customElements.get("pizza-dough-card-editor")) customElements.define("pizza-dough-card-editor", PizzaDoughCardEditor);

(window as any).customCards = (window as any).customCards || [];
if (!(window as any).customCards.some((c: { type: string }) => c.type === "pizza-dough-card")) {
  (window as any).customCards.push({
    type: "pizza-dough-card",
    name: "Pizzateig-Planer",
    description: "Teigrechner, Gärzeitplan und Erinnerungen für Pizzateig",
    preview: true,
  });
}
