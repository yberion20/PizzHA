import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import {
  DEFAULT_RECIPE,
  MAX_PHASES,
  PHASE_KIND_LABELS,
  YEAST_TYPE_LABELS,
  buildPlanPayload,
  buildSchedule,
  calculateDough,
  fmtDateTime,
  fmtDuration,
  fmtNumber,
  scheduleToIcs,
  toLocalInputValue,
  type DoughResult,
  type FermentationPhase,
  type Recipe,
  type Schedule,
  type YeastType,
} from "@pizza-dough/core";
import { baseStyles } from "./styles.js";
import { load, save } from "./storage.js";
import type { ActivePlan, PlanBackend } from "./types.js";

type Tab = "calc" | "plan" | "active";
type Computed = { dough?: DoughResult; schedule?: Schedule; error?: string };

interface PlanSettings {
  name: string;
  eatAt: string;
  mixMinutes: number;
  preheatMinutes: number;
  bakeLeadMinutes: number;
}

const PRESETS: FermentationPhase[] = [
  { kind: "bulk", hours: 24, tempC: 4, label: "Kühlschrank" },
  { kind: "bulk", hours: 2, tempC: 22, label: "Raumtemperatur" },
  { kind: "bulk", hours: 12, tempC: 16, label: "Keller" },
];

const STORAGE_RECIPE = "pizza-dough:recipe";
const STORAGE_PLAN = "pizza-dough:plan-settings";

function defaultEatAt(): string {
  const d = new Date(Date.now() + 2 * 86400e3);
  d.setHours(19, 0, 0, 0);
  return toLocalInputValue(d);
}

/**
 * Komplette Oberfläche: Rechner, Zeitplan und aktiver Plan.
 * Wird von der Lovelace-Karte und der Web-App gleichermaßen verwendet.
 */
export class PizzaDoughPlanner extends LitElement {
  static properties = {
    backend: { attribute: false },
    activePlan: { attribute: false },
    extraActions: { attribute: false },
    tab: { type: String },
    _recipe: { state: true },
    _settings: { state: true },
    _busy: { state: true },
    _message: { state: true },
    _now: { state: true },
    _showAdvanced: { state: true },
  };

  declare backend: PlanBackend | undefined;
  declare activePlan: ActivePlan | null;
  /** Zusätzliche Knöpfe im Zeitplan (z. B. „An Home Assistant senden“ in der Web-App) */
  declare extraActions: Array<{ label: string; run: (p: ReturnType<typeof buildPlanPayload>) => Promise<string | void> }>;
  declare tab: Tab;
  declare _recipe: Recipe;
  declare _settings: PlanSettings;
  declare _busy: boolean;
  declare _message: string;
  declare _now: number;
  declare _showAdvanced: boolean;
  private _timer?: number;
  private _userPickedTab = false;

  constructor() {
    super();
    this.activePlan = null;
    this.extraActions = [];
    this.tab = "calc";
    this._recipe = load<Recipe>(STORAGE_RECIPE, structuredClone(DEFAULT_RECIPE));
    this._settings = load<PlanSettings>(STORAGE_PLAN, {
      name: "Pizzaabend",
      eatAt: defaultEatAt(),
      mixMinutes: 35,
      preheatMinutes: 60,
      bakeLeadMinutes: 30,
    });
    if (new Date(this._settings.eatAt).getTime() < Date.now()) this._settings.eatAt = defaultEatAt();
    this._busy = false;
    this._message = "";
    this._now = Date.now();
    this._showAdvanced = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => (this._now = Date.now()), 30_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
  }

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has("activePlan") && !this._userPickedTab) {
      const hadPlan = !!changed.get("activePlan");
      if (this.activePlan && !hadPlan) this.tab = "active";
    }
    if (this.tab === "active" && !this.activePlan) this.tab = "calc";
  }

  // --------------------------------------------------------------- Rechnen
  private get _computed(): Computed {
    try {
      const dough = calculateDough(this._recipe);
      const eat = new Date(this._settings.eatAt);
      const schedule = Number.isNaN(eat.getTime())
        ? undefined
        : buildSchedule(this._recipe.phases, eat, {
            mixMinutes: this._settings.mixMinutes,
            preheatMinutes: this._settings.preheatMinutes,
            bakeLeadMinutes: this._settings.bakeLeadMinutes,
            now: new Date(this._now),
          });
      if (schedule) {
        schedule.steps[0].description += ` Mengen: ${fmtNumber(dough.flour)} g Mehl, ${fmtNumber(dough.water)} g Wasser, ${fmtNumber(dough.salt)} g Salz, ${
          dough.starter ? `${fmtNumber(dough.starter)} g Anstellgut` : `${fmtNumber(dough.yeast, 2)} g ${YEAST_TYPE_LABELS[this._recipe.yeastType]}`
        }.`;
      }
      return { dough, schedule };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  private _update(patch: Partial<Recipe>) {
    this._recipe = { ...this._recipe, ...patch };
    save(STORAGE_RECIPE, this._recipe);
  }

  private _updatePhase(i: number, patch: Partial<FermentationPhase>) {
    const phases = this._recipe.phases.map((p, j) => (j === i ? { ...p, ...patch } : p));
    this._update({ phases });
  }

  private _updateSettings(patch: Partial<PlanSettings>) {
    this._settings = { ...this._settings, ...patch };
    save(STORAGE_PLAN, this._settings);
  }

  private _num(e: Event): number {
    const v = parseFloat((e.target as HTMLInputElement).value.replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  }

  // ---------------------------------------------------------------- Render
  render() {
    const c = this._computed;
    return html`
      <nav role="tablist">
        ${this._tabButton("calc", "Rechner")}
        ${this._tabButton("plan", "Zeitplan")}
        ${this.activePlan ? this._tabButton("active", "Aktiv") : nothing}
      </nav>
      <div class="content">
        ${this.tab === "calc" ? this._renderCalc(c) : nothing}
        ${this.tab === "plan" ? this._renderPlan(c) : nothing}
        ${this.tab === "active" && this.activePlan ? this._renderActive(this.activePlan) : nothing}
        ${this._message ? html`<p class="message" role="status">${this._message}</p>` : nothing}
      </div>
    `;
  }

  private _tabButton(id: Tab, label: string) {
    return html`<button role="tab" aria-selected=${this.tab === id} class=${this.tab === id ? "tab sel" : "tab"}
      @click=${() => { this.tab = id; this._userPickedTab = true; this._message = ""; }}>${label}</button>`;
  }

  private _renderCalc(c: Computed) {
    const r = this._recipe;
    return html`
      <div class="grid">
        <label>Teigballen<input type="number" inputmode="numeric" min="1" step="1" .value=${String(r.balls)} @change=${(e: Event) => this._update({ balls: Math.max(1, Math.round(this._num(e))) })} /></label>
        <label>Gewicht je Ballen (g)<input type="number" inputmode="decimal" min="1" .value=${String(r.ballWeight)} @change=${(e: Event) => this._update({ ballWeight: this._num(e) })} /></label>
        <label>Hydration (%)<input type="number" inputmode="decimal" step="0.5" .value=${String(r.hydration)} @change=${(e: Event) => this._update({ hydration: this._num(e) })} /></label>
        <label>Salz (%)<input type="number" inputmode="decimal" step="0.1" .value=${String(r.salt)} @change=${(e: Event) => this._update({ salt: this._num(e) })} /></label>
      </div>

      <h3>Triebmittel</h3>
      <div class="grid">
        <label>Hefetyp
          <select @change=${(e: Event) => this._update({ yeastType: (e.target as HTMLSelectElement).value as YeastType, yeastPercentOverride: undefined })}>
            ${(Object.keys(YEAST_TYPE_LABELS) as YeastType[]).map((k) => html`<option value=${k} ?selected=${r.yeastType === k}>${YEAST_TYPE_LABELS[k]}</option>`)}
          </select>
        </label>
        ${r.yeastType === "sourdough"
          ? html`
              <label>Hydration Anstellgut (%)<input type="number" inputmode="decimal" .value=${String(r.starterHydration ?? 100)} @change=${(e: Event) => this._update({ starterHydration: this._num(e) })} /></label>
              <label>Triebkraft
                <select @change=${(e: Event) => this._update({ starterActivity: (e.target as HTMLSelectElement).value as Recipe["starterActivity"] })}>
                  <option value="weak" ?selected=${r.starterActivity === "weak"}>schwach</option>
                  <option value="normal" ?selected=${(r.starterActivity ?? "normal") === "normal"}>normal</option>
                  <option value="strong" ?selected=${r.starterActivity === "strong"}>stark</option>
                </select>
              </label>`
          : nothing}
      </div>

      <h3>Gärphasen</h3>
      ${r.phases.map((p, i) => this._renderPhase(p, i))}
      <div class="row">
        ${r.phases.length < MAX_PHASES
          ? html`<span class="muted">Hinzufügen:</span>
              ${PRESETS.map((p) => html`<button class="ghost" @click=${() => this._addPhase(p)}>+ ${p.label}</button>`)}`
          : html`<span class="muted">Maximal ${MAX_PHASES} Phasen.</span>`}
      </div>

      <h3>Ergebnis</h3>
      ${c.error ? html`<p class="warn">⚠ ${c.error}</p>` : nothing}
      ${c.dough ? this._renderResult(c.dough) : nothing}

      <button class="ghost" @click=${() => (this._showAdvanced = !this._showAdvanced)}>${this._showAdvanced ? "▾" : "▸"} Feineinstellungen</button>
      ${this._showAdvanced
        ? html`<div class="grid">
            <label>Korrekturfaktor<input type="number" inputmode="decimal" step="0.05" min="0.1" .value=${String(r.correction ?? 1)} @change=${(e: Event) => this._update({ correction: this._num(e) || 1 })} /></label>
            <label>${r.yeastType === "sourdough" ? "Anstellgut" : "Hefe"} manuell (%)
              <input type="number" inputmode="decimal" step="0.01" placeholder="automatisch" .value=${r.yeastPercentOverride === undefined ? "" : String(r.yeastPercentOverride)}
                @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; this._update({ yeastPercentOverride: v === "" ? undefined : this._num(e) }); }} /></label>
          </div>
          <p class="muted">Korrekturfaktor über 1 bedeutet mehr Hefe. Passe ihn an, wenn dein Teig nach dem ersten Versuch zu träge (größer) oder übergärig (kleiner) war.</p>`
        : nothing}
    `;
  }

  private _addPhase(p: FermentationPhase) {
    const phases = [...this._recipe.phases];
    const firstBalls = phases.findIndex((x) => x.kind === "balls");
    phases.splice(firstBalls < 0 ? phases.length : firstBalls, 0, { ...p });
    this._update({ phases });
  }

  private _renderPhase(p: FermentationPhase, i: number) {
    const phases = this._recipe.phases;
    return html`
      <div class="phase">
        <span class="idx">${i + 1}</span>
        <label class="kind">Art
          <select @change=${(e: Event) => this._updatePhase(i, { kind: (e.target as HTMLSelectElement).value as FermentationPhase["kind"] })}>
            <option value="bulk" ?selected=${p.kind === "bulk"}>${PHASE_KIND_LABELS.bulk}</option>
            <option value="balls" ?selected=${p.kind === "balls"}>${PHASE_KIND_LABELS.balls}</option>
          </select>
        </label>
        <label class="hours">Dauer (h)<input type="number" inputmode="decimal" step="0.5" min="0.5" .value=${String(p.hours)} @change=${(e: Event) => this._updatePhase(i, { hours: this._num(e) })} /></label>
        <label class="temp">Temp. (°C)<input type="number" inputmode="decimal" step="0.5" .value=${String(p.tempC)} @change=${(e: Event) => this._updatePhase(i, { tempC: this._num(e) })} /></label>
        <label class="place">Ort<input type="text" .value=${p.label ?? ""} placeholder="z. B. Kühlschrank" @change=${(e: Event) => this._updatePhase(i, { label: (e.target as HTMLInputElement).value || undefined })} /></label>
        <button class="ghost icon" title="Phase entfernen" aria-label="Phase entfernen" ?disabled=${phases.length <= 1}
          @click=${() => this._update({ phases: phases.filter((_, j) => j !== i) })}>✕</button>
      </div>`;
  }

  private _renderResult(d: DoughResult) {
    const r = this._recipe;
    const sour = r.yeastType === "sourdough";
    const rows: Array<[string, number, number, number]> = [
      [sour ? "Mehl (zugeben)" : "Mehl", d.flour, 1, 1000],
      [sour ? "Wasser (zugeben)" : "Wasser", d.water, 1, d.perKgFlour.water],
      ["Salz", d.salt, 1, d.perKgFlour.salt],
      sour ? ["Anstellgut", d.starter, 1, d.perKgFlour.starter] : [YEAST_TYPE_LABELS[r.yeastType], d.yeast, 2, d.perKgFlour.yeast],
    ];
    if (sour) rows[0][3] = (d.flour / d.flourTotal) * 1000;
    return html`
      <table class="result">
        <thead><tr><th></th><th>Menge</th><th>pro kg Mehl</th></tr></thead>
        <tbody>
          ${rows.map(([name, g, digits, perKg]) => html`<tr><td>${name}</td><td class="num big">${fmtNumber(g, digits)} g</td><td class="num muted">${fmtNumber(perKg, digits)} g</td></tr>`)}
        </tbody>
      </table>
      <p class="muted">
        Teig gesamt ${fmtNumber(d.totalDough, 0)} g · ${sour ? `Gesamtmehl ${fmtNumber(d.flourTotal)} g · Anstellgut ${fmtNumber(d.yeastPercent, 1)} %` : `Hefe ${fmtNumber(d.yeastPercent, 3)} %`}
        · Gärzeit ${fmtNumber(r.phases.reduce((s, p) => s + p.hours, 0), 1)} h (entspricht ${fmtNumber(d.equivalentHours, 1)} h bei 24 °C)
      </p>
      ${d.warnings.map((w) => html`<p class="warn">⚠ ${w.message}</p>`)}`;
  }

  private _renderPlan(c: Computed) {
    const s = this._settings;
    const sched = c.schedule;
    return html`
      <div class="grid">
        <label class="wide">Pizza essen am<input type="datetime-local" .value=${s.eatAt} @change=${(e: Event) => this._updateSettings({ eatAt: (e.target as HTMLInputElement).value })} /></label>
        <label>Name<input type="text" .value=${s.name} @change=${(e: Event) => this._updateSettings({ name: (e.target as HTMLInputElement).value })} /></label>
      </div>
      <div class="grid" style="margin-top:10px">
        <label>Kneten + Ruhe (min)<input type="number" min="0" step="5" .value=${String(s.mixMinutes)} @change=${(e: Event) => this._updateSettings({ mixMinutes: this._num(e) })} /></label>
        <label>Backen vor Essen (min)<input type="number" min="0" step="5" .value=${String(s.bakeLeadMinutes)} @change=${(e: Event) => this._updateSettings({ bakeLeadMinutes: this._num(e) })} /></label>
        <label>Ofen vorheizen (min)<input type="number" min="0" step="5" .value=${String(s.preheatMinutes)} @change=${(e: Event) => this._updateSettings({ preheatMinutes: this._num(e) })} /></label>
      </div>
      ${c.error ? html`<p class="warn">⚠ ${c.error}</p>` : nothing}
      ${sched
        ? html`
            <h3>Ablauf</h3>
            <ol class="timeline">
              ${sched.steps.map((st) => html`<li class=${new Date(st.at).getTime() < this._now ? "past" : ""}>
                <div class="when num">${fmtDateTime(st.at)}</div>
                <div><strong>${st.title}</strong><div class="muted">${st.description}</div></div></li>`)}
            </ol>
            ${sched.warnings.map((w) => html`<p class="warn">⚠ ${w.message}</p>`)}
            <div class="row actions">
              ${this.backend
                ? html`<button class="primary" ?disabled=${this._busy} @click=${() => this._start(c)}>${this.activePlan ? "Neuen Plan starten" : "Plan starten"}</button>`
                : nothing}
              <button @click=${() => this._downloadIcs(sched)}>Kalender (.ics)</button>
              ${this.extraActions.map((a) => html`<button ?disabled=${this._busy} @click=${() => this._runExtra(a, c)}>${a.label}</button>`)}
            </div>
            ${this.activePlan ? html`<p class="muted">Ein neuer Plan ersetzt den aktiven Plan „${this.activePlan.name}“.</p>` : nothing}`
        : nothing}
    `;
  }

  private _payload(c: Computed) {
    return buildPlanPayload(this._settings.name || "Pizzateig", this._recipe, c.dough!, c.schedule!);
  }

  private async _start(c: Computed) {
    if (!this.backend || !c.dough || !c.schedule) return;
    this._busy = true;
    this._message = "";
    try {
      await this.backend.startPlan(this._payload(c));
      this._message = `Plan gestartet. Erinnerungen kommen über ${this.backend.label}.`;
      this.tab = "active";
      this._userPickedTab = false;
    } catch (e) {
      this._message = `Fehler: ${(e as Error).message}`;
    } finally {
      this._busy = false;
    }
  }

  private async _runExtra(a: PizzaDoughPlanner["extraActions"][number], c: Computed) {
    if (!c.dough || !c.schedule) return;
    this._busy = true;
    try {
      this._message = (await a.run(this._payload(c))) || "";
    } catch (e) {
      this._message = `Fehler: ${(e as Error).message}`;
    } finally {
      this._busy = false;
    }
  }

  private _downloadIcs(s: Schedule) {
    const blob = new Blob([scheduleToIcs(s, this._settings.name || "Pizzateig")], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pizzateig.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  private _renderActive(plan: ActivePlan) {
    const next = plan.steps.find((s) => !s.done && !s.notified);
    const a = plan.amounts ?? {};
    const yeastLabel = a.yeast_type ? YEAST_TYPE_LABELS[a.yeast_type] : "Hefe";
    return html`
      <div class="hero">
        <div>
          <div class="muted">${plan.name} · Essen ${fmtDateTime(plan.eat_at)}</div>
          ${next
            ? html`<div class="next-title">${next.title}</div>
                <div class="muted num">${fmtDateTime(next.at)} · in ${fmtDuration(new Date(next.at).getTime() - this._now)}</div>`
            : html`<div class="next-title">Alle Schritte erledigt 🍕</div>`}
        </div>
      </div>
      ${a.flour !== undefined
        ? html`<div class="chips num">
            <span>Mehl <b>${fmtNumber(a.flour!)} g</b></span><span>Wasser <b>${fmtNumber(a.water ?? 0)} g</b></span><span>Salz <b>${fmtNumber(a.salt ?? 0)} g</b></span>
            ${a.starter ? html`<span>Anstellgut <b>${fmtNumber(a.starter)} g</b></span>` : html`<span>${yeastLabel} <b>${fmtNumber(a.yeast ?? 0, 2)} g</b></span>`}
          </div>`
        : nothing}
      <ol class="timeline">
        ${plan.steps.map((st) => {
          const state = st.done ? "done" : st.notified ? "due" : st.id === next?.id ? "next" : "";
          return html`<li class=${state}>
            <div class="when num">${fmtDateTime(st.at)}</div>
            <div class="grow"><strong>${st.done ? "✓ " : ""}${st.title}</strong><div class="muted">${st.description}</div></div>
            ${!st.done && this.backend ? html`<button class="ghost" @click=${() => this._complete(st.id)}>Erledigt</button>` : nothing}
          </li>`;
        })}
      </ol>
      ${this.backend ? html`<div class="row actions"><button @click=${this._cancel}>Plan abbrechen</button></div>` : nothing}
    `;
  }

  private async _complete(id: string) {
    try {
      await this.backend?.completeStep(id);
    } catch (e) {
      this._message = `Fehler: ${(e as Error).message}`;
    }
  }

  private _cancel = async () => {
    if (!confirm("Plan wirklich abbrechen? Alle Erinnerungen werden gelöscht.")) return;
    try {
      await this.backend?.cancelPlan();
      this.tab = "calc";
      this._message = "Plan abgebrochen.";
    } catch (e) {
      this._message = `Fehler: ${(e as Error).message}`;
    }
  };

  static styles = [
    baseStyles,
    css`
      nav { display: flex; gap: 4px; border-bottom: 1px solid var(--pd-border); margin-bottom: 14px; }
      .tab { background: none; border: none; border-bottom: 2px solid transparent; border-radius: 0; padding: 10px 12px; color: var(--pd-muted); }
      .tab.sel { color: var(--pd-primary); border-bottom-color: var(--pd-primary); }
      .phase { display: grid; grid-template-columns: 22px 1.3fr 1fr 1fr 1.5fr 32px; gap: 8px; align-items: end; padding: 8px 0; border-bottom: 1px dashed var(--pd-border); }
      .phase .idx { align-self: center; font-weight: 700; color: var(--pd-muted); }
      .icon { padding: 8px; }
      @media (max-width: 520px) {
        .phase { grid-template-columns: 22px 1fr 1fr 32px; grid-template-areas: "idx kind kind del" ". hours temp ." ". place place ."; }
        .phase .idx { grid-area: idx; } .phase .kind { grid-area: kind; } .phase .hours { grid-area: hours; }
        .phase .temp { grid-area: temp; } .phase .place { grid-area: place; } .phase .icon { grid-area: del; }
      }
      .wide { grid-column: span 2; }
      table.result { width: 100%; border-collapse: collapse; }
      .result th { text-align: right; font-size: 12px; font-weight: 500; color: var(--pd-muted); padding: 4px 0; }
      .result td { padding: 8px 0; border-bottom: 1px solid var(--pd-border); }
      .result td:not(:first-child) { text-align: right; }
      .result .big { font-size: 18px; font-weight: 700; }
      .timeline { list-style: none; padding: 0; margin: 0; }
      .timeline li { display: flex; gap: 12px; padding: 10px 0 10px 14px; border-left: 3px solid var(--pd-border); margin-left: 4px; align-items: flex-start; }
      .timeline li.past, .timeline li.done { opacity: .55; }
      .timeline li.next { border-left-color: var(--pd-primary); }
      .timeline li.due { border-left-color: var(--pd-warn); }
      .timeline .when { min-width: 118px; font-size: 13px; font-weight: 600; }
      .grow { flex: 1; min-width: 0; }
      @media (max-width: 420px) { .timeline li { flex-wrap: wrap; } .timeline .when { min-width: 0; width: 100%; } }
      .actions { margin-top: 14px; }
      .hero { background: var(--pd-surface); border-radius: var(--pd-radius); padding: 14px; margin-bottom: 12px; }
      .next-title { font-size: 20px; font-weight: 700; margin: 2px 0; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
      .chips span { background: var(--pd-surface); border-radius: 999px; padding: 4px 10px; font-size: 13px; }
      .message { margin-top: 12px; font-weight: 600; }
    `,
  ];
}

if (!customElements.get("pizza-dough-planner")) customElements.define("pizza-dough-planner", PizzaDoughPlanner);

declare global {
  interface HTMLElementTagNameMap {
    "pizza-dough-planner": PizzaDoughPlanner;
  }
}
