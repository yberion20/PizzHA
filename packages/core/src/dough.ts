import type { DoughResult, Recipe, Warning } from "./types.js";
import {
  YEAST_CONVERSION,
  equivalentHours,
  freshYeastPercent,
  starterPercent,
  temperatureFactor,
} from "./yeast.js";

export const MAX_PHASES = 4;

export const YEAST_TYPE_LABELS = {
  fresh: "Frischhefe",
  active_dry: "Trockenhefe",
  instant: "Instant-Trockenhefe",
  sourdough: "Sauerteig (Anstellgut)",
} as const;

export const PHASE_KIND_LABELS = { bulk: "Stockgare", balls: "Stückgare" } as const;

export const DEFAULT_RECIPE: Recipe = {
  balls: 6,
  ballWeight: 270,
  hydration: 65,
  salt: 3,
  yeastType: "fresh",
  correction: 1,
  starterHydration: 100,
  starterActivity: "normal",
  phases: [
    { kind: "bulk", hours: 2, tempC: 22, label: "Raumtemperatur" },
    { kind: "bulk", hours: 42, tempC: 4.5, label: "Kühlschrank" },
    { kind: "balls", hours: 4, tempC: 22, label: "Raumtemperatur" },
  ],
};

export class RecipeError extends Error {}

/** Prüft das Rezept. Wirft RecipeError bei harten Fehlern, gibt Warnungen zurück. */
export function validateRecipe(r: Recipe): Warning[] {
  const w: Warning[] = [];
  if (!(r.balls >= 1)) throw new RecipeError("Mindestens ein Teigballen ist nötig.");
  if (!(r.ballWeight > 0)) throw new RecipeError("Das Ballengewicht muss größer als 0 sein.");
  if (!(r.hydration >= 0)) throw new RecipeError("Die Hydration darf nicht negativ sein.");
  if (!(r.salt >= 0)) throw new RecipeError("Der Salzanteil darf nicht negativ sein.");
  if (r.phases.length < 1) throw new RecipeError("Mindestens eine Gärphase ist Pflicht.");
  if (r.phases.length > MAX_PHASES) throw new RecipeError(`Höchstens ${MAX_PHASES} Gärphasen.`);
  for (const p of r.phases) {
    if (!(p.hours > 0)) throw new RecipeError("Jede Gärphase braucht eine Dauer über 0 Stunden.");
    if (!Number.isFinite(p.tempC)) throw new RecipeError("Jede Gärphase braucht eine Temperatur.");
  }
  const firstBalls = r.phases.findIndex((p) => p.kind === "balls");
  if (firstBalls >= 0 && r.phases.slice(firstBalls).some((p) => p.kind === "bulk")) {
    throw new RecipeError("Die Stockgare muss vor der Stückgare liegen.");
  }
  if (firstBalls < 0) {
    w.push({ code: "no_balls_phase", message: "Keine Stückgare angegeben. Teiglinge brauchen meist noch einige Stunden nach dem Formen." });
  }
  if (r.hydration < 55 || r.hydration > 85) {
    w.push({ code: "hydration_range", message: "Die Hydration liegt außerhalb des üblichen Bereichs für Pizza (55–85 %)." });
  }
  if (r.salt < 1 || r.salt > 4) {
    w.push({ code: "salt_range", message: "Der Salzanteil liegt außerhalb des üblichen Bereichs (1–4 %)." });
  }
  if (r.phases.some((p) => p.tempC > 35)) {
    w.push({ code: "too_warm", message: "Über 35 °C wird die Hefe geschwächt. Das Modell ist dort ungenau." });
  }
  if (r.phases.some((p) => p.tempC < 0)) {
    w.push({ code: "too_cold", message: "Unter 0 °C ruht die Gärung praktisch vollständig." });
  }
  return w;
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Berechnet alle Zutatenmengen in Gramm. */
export function calculateDough(r: Recipe): DoughResult {
  const warnings = validateRecipe(r);
  const correction = r.correction && r.correction > 0 ? r.correction : 1;
  const H = r.hydration / 100;
  const S = r.salt / 100;
  const totalDough = r.balls * r.ballWeight;
  const heq = equivalentHours(r.phases);

  if (r.yeastType === "sourdough") {
    const starterPct = r.yeastPercentOverride ?? starterPercent(r.phases, r.starterActivity ?? "normal", correction);
    const hs = (r.starterHydration ?? 100) / 100;
    // Das Anstellgut ist Teil von Mehl und Wasser: Gesamtteig = Mehl · (1 + H + S)
    const flourTotal = totalDough / (1 + H + S);
    const starter = (flourTotal * starterPct) / 100;
    const starterFlour = starter / (1 + hs);
    const starterWater = starter - starterFlour;
    const water = flourTotal * H - starterWater;
    if (water < 0) {
      warnings.push({ code: "starter_too_wet", message: "Das Anstellgut bringt mehr Wasser mit, als die Hydration erlaubt." });
    }
    const perKg = 1000 / flourTotal;
    return {
      totalDough: round1(totalDough),
      flourTotal: round1(flourTotal),
      flour: round1(flourTotal - starterFlour),
      water: round1(Math.max(0, water)),
      salt: round1(flourTotal * S),
      yeast: 0,
      starter: round1(starter),
      yeastPercent: round2(starterPct),
      freshYeastPercent: 0,
      equivalentHours: round1(heq),
      perKgFlour: {
        water: round1(Math.max(0, water) * perKg),
        salt: round1(flourTotal * S * perKg),
        yeast: 0,
        starter: round1(starter * perKg),
      },
      warnings,
    };
  }

  const fresh =
    r.yeastPercentOverride !== undefined
      ? r.yeastPercentOverride / YEAST_CONVERSION[r.yeastType]
      : freshYeastPercent(r.phases, correction);
  const Y = (fresh * YEAST_CONVERSION[r.yeastType]) / 100;
  const flour = totalDough / (1 + H + S + Y);
  if (heq > 0 && heq < 4) {
    warnings.push({ code: "short_fermentation", message: "Sehr kurze Gärzeit. Für neapolitanische Pizza sind 8 h und mehr üblich." });
  }
  return {
    totalDough: round1(totalDough),
    flourTotal: round1(flour),
    flour: round1(flour),
    water: round1(flour * H),
    salt: round1(flour * S),
    yeast: round2(flour * Y),
    starter: 0,
    yeastPercent: Math.round(Y * 100 * 1000) / 1000,
    freshYeastPercent: Math.round(fresh * 1000) / 1000,
    equivalentHours: round1(heq),
    perKgFlour: {
      water: round1(1000 * H),
      salt: round1(1000 * S),
      yeast: round2(1000 * Y),
      starter: 0,
    },
    warnings,
  };
}

export { temperatureFactor };
