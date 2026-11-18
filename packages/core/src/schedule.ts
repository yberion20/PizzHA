import type { FermentationPhase, Warning } from "./types.js";

export type StepType =
  | "mix"
  | "bulk_start"
  | "to_fridge"
  | "from_fridge"
  | "temp_change"
  | "shape"
  | "preheat"
  | "bake";

export interface ScheduleStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  /** Zeitpunkt als ISO-8601-String (UTC) */
  at: string;
}

export interface ScheduleOptions {
  /** Kneten + Teigruhe vor der ersten Gärphase in Minuten (Standard 35) */
  mixMinutes?: number;
  /** Backbeginn vor dem Essen in Minuten (Standard 30) */
  bakeLeadMinutes?: number;
  /** Ofen vorheizen vor dem Backen in Minuten (Standard 60, 0 = kein Schritt) */
  preheatMinutes?: number;
  /** Temperatur, unter der eine Phase als „Kühlschrank“ gilt (Standard 10 °C) */
  fridgeThresholdC?: number;
  /** Aktuelle Zeit, für die Warnung „Start liegt in der Vergangenheit“ */
  now?: Date;
}

export interface Schedule {
  eatAt: string;
  start: string;
  steps: ScheduleStep[];
  warnings: Warning[];
}

const PHASE_NAME = { bulk: "Stockgare", balls: "Stückgare" } as const;

const H = 3_600_000;
const M = 60_000;

const fmtTemp = (t: number) => `${String(Math.round(t * 10) / 10).replace(".", ",")} °C`;
const fmtHours = (h: number) => `${String(Math.round(h * 10) / 10).replace(".", ",")} h`;

function placeDescription(p: FermentationPhase, threshold: number): string {
  if (p.label) return `${p.label} (${fmtTemp(p.tempC)})`;
  return p.tempC < threshold ? `Kühlschrank (${fmtTemp(p.tempC)})` : `bei ${fmtTemp(p.tempC)}`;
}

/**
 * Erstellt den Zeitplan rückwärts ab dem Essenszeitpunkt.
 * Alle Zeiten werden als absolute Zeitpunkte gerechnet, Zeitumstellungen sind damit automatisch korrekt.
 */
export function buildSchedule(phases: FermentationPhase[], eatAt: Date, opts: ScheduleOptions = {}): Schedule {
  if (phases.length === 0) throw new Error("Mindestens eine Gärphase ist Pflicht.");
  const mixMin = opts.mixMinutes ?? 35;
  const bakeLead = opts.bakeLeadMinutes ?? 30;
  const preheat = opts.preheatMinutes ?? 60;
  const threshold = opts.fridgeThresholdC ?? 10;

  const bakeAt = eatAt.getTime() - bakeLead * M;
  const totalPhaseMs = phases.reduce((s, p) => s + p.hours * H, 0);
  const firstPhaseStart = bakeAt - totalPhaseMs;
  const mixAt = firstPhaseStart - mixMin * M;

  const steps: ScheduleStep[] = [];
  const add = (type: StepType, at: number, title: string, description: string) =>
    steps.push({ id: `${steps.length + 1}_${type}`, type, title, description, at: new Date(at).toISOString() });

  const first = phases[0];
  add(
    "mix",
    mixAt,
    "Teig ansetzen",
    `Zutaten abwiegen, Teig kneten und kurz ruhen lassen. Danach ${PHASE_NAME[first.kind]} ${fmtHours(first.hours)} ${placeDescription(first, threshold)}.`,
  );
  if (first.kind === "balls") {
    add("shape", firstPhaseStart, "Teiglinge formen", `Teig teilen, Teiglinge schleifen und abgedeckt ${fmtHours(first.hours)} ${placeDescription(first, threshold)} gehen lassen.`);
  } else if (first.tempC < threshold) {
    add("to_fridge", firstPhaseStart, "Teig in den Kühlschrank", `Stockgare ${fmtHours(first.hours)} ${placeDescription(first, threshold)}.`);
  } else {
    add("bulk_start", firstPhaseStart, "Stockgare beginnt", `Teig abgedeckt ${fmtHours(first.hours)} ${placeDescription(first, threshold)} gehen lassen.`);
  }

  let t = firstPhaseStart + first.hours * H;
  for (let i = 1; i < phases.length; i++) {
    const prev = phases[i - 1];
    const p = phases[i];
    const place = placeDescription(p, threshold);
    const wasCold = prev.tempC < threshold;
    const isCold = p.tempC < threshold;
    if (prev.kind === "bulk" && p.kind === "balls") {
      let extra = "";
      if (wasCold && !isCold) extra = " Teig vorher aus dem Kühlschrank nehmen.";
      if (!wasCold && isCold) extra = " Teiglinge danach in den Kühlschrank stellen.";
      add("shape", t, "Teiglinge formen", `Teig teilen, Teiglinge schleifen und ${fmtHours(p.hours)} ${place} gehen lassen.${extra}`);
    } else if (!wasCold && isCold) {
      add("to_fridge", t, p.kind === "balls" ? "Teiglinge in den Kühlschrank" : "Teig in den Kühlschrank", `${PHASE_NAME[p.kind]} ${fmtHours(p.hours)} ${place}.`);
    } else if (wasCold && !isCold) {
      add("from_fridge", t, p.kind === "balls" ? "Teiglinge aus dem Kühlschrank" : "Teig aus dem Kühlschrank", `${PHASE_NAME[p.kind]} ${fmtHours(p.hours)} ${place}.`);
    } else {
      add("temp_change", t, `${PHASE_NAME[p.kind]}: Ort wechseln`, `${PHASE_NAME[p.kind]} ${fmtHours(p.hours)} ${place}.`);
    }
    t += p.hours * H;
  }

  if (preheat > 0) add("preheat", bakeAt - preheat * M, "Ofen vorheizen", "Ofen bzw. Pizzastein auf volle Temperatur bringen.");
  const last = phases[phases.length - 1];
  add(
    "bake",
    bakeAt,
    "Pizza backen",
    last.tempC < threshold
      ? "Teiglinge sind kalt. Ggf. 1–2 h vorher aus dem Kühlschrank nehmen. Ausziehen, belegen, backen."
      : "Teiglinge ausziehen, belegen und backen. Guten Appetit!",
  );

  steps.sort((a, b) => a.at.localeCompare(b.at));
  steps.forEach((s, i) => (s.id = `${i + 1}_${s.type}`));

  const warnings: Warning[] = [];
  const now = opts.now ?? new Date();
  if (mixAt < now.getTime()) {
    warnings.push({ code: "start_in_past", message: "Der Teig hätte schon angesetzt werden müssen. Bitte Essenszeit oder Gärzeiten anpassen." });
  }
  return { eatAt: eatAt.toISOString(), start: new Date(mixAt).toISOString(), steps, warnings };
}
