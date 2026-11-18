import type { FermentationPhase, StarterActivity, YeastType } from "./types.js";

/**
 * Relative Gäraktivität bezogen auf 24 °C.
 *
 * Die Werte für kalte Temperaturen liegen bewusst höher als die reine
 * Hefe-Stoffwechselrate: Ein Teig, der warm in den Kühlschrank kommt, braucht
 * mehrere Stunden, bis er durchgekühlt ist, und gärt in dieser Zeit weiter.
 * Kalibriert auf: 42 h bei 4,5 °C + 5,5 h bei 22 °C ≈ 0,15 % Frischhefe,
 * außerdem auf den AVPN-Bereich (0,1–0,3 % Frischhefe bei 8–24 h Raumtemperatur).
 */
export const TEMPERATURE_TABLE: ReadonlyArray<readonly [number, number]> = [
  [0, 0.13],
  [2, 0.17],
  [4, 0.21],
  [6, 0.26],
  [8, 0.31],
  [10, 0.36],
  [12, 0.42],
  [14, 0.48],
  [16, 0.55],
  [18, 0.64],
  [20, 0.74],
  [22, 0.86],
  [24, 1.0],
  [26, 1.16],
  [28, 1.33],
  [30, 1.5],
  [32, 1.65],
  [35, 1.85],
];

/** Modell Frischhefe-% = YEAST_C / Heq^YEAST_N */
export const YEAST_C = 7.93;
export const YEAST_N = 1.5;

/** Modell Anstellgut-% = STARTER_C / Heq^STARTER_N (Anstellgut mit 100 % Hydration, normale Triebkraft) */
export const STARTER_C = 206;
export const STARTER_N = 1.0;

export const FRESH_YEAST_LIMITS = { min: 0.02, max: 3 } as const;
export const STARTER_LIMITS = { min: 2, max: 30 } as const;

/** Umrechnung von Frischhefe auf andere Hefetypen (Gewichtsfaktor) */
export const YEAST_CONVERSION: Record<Exclude<YeastType, "sourdough">, number> = {
  fresh: 1,
  active_dry: 0.4,
  instant: 0.33,
};

export const STARTER_ACTIVITY_FACTOR: Record<StarterActivity, number> = {
  weak: 1.3,
  normal: 1,
  strong: 0.75,
};

/** Relative Aktivität bei Temperatur tempC (lineare Interpolation, Ränder geklemmt). */
export function temperatureFactor(tempC: number): number {
  const t = TEMPERATURE_TABLE;
  if (tempC <= t[0][0]) return t[0][1];
  const last = t[t.length - 1];
  if (tempC >= last[0]) return last[1];
  for (let i = 1; i < t.length; i++) {
    const [t1, f1] = t[i];
    if (tempC <= t1) {
      const [t0, f0] = t[i - 1];
      return f0 + ((f1 - f0) * (tempC - t0)) / (t1 - t0);
    }
  }
  return last[1];
}

/** Äquivalente Gärstunden bei 24 °C über alle Phasen. */
export function equivalentHours(phases: FermentationPhase[]): number {
  return phases.reduce((sum, p) => sum + Math.max(0, p.hours) * temperatureFactor(p.tempC), 0);
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Frischhefe in % bezogen auf Mehl (ungeklemmt bei Heq = 0 → Maximum). */
export function freshYeastPercent(phases: FermentationPhase[], correction = 1): number {
  const heq = equivalentHours(phases);
  if (heq <= 0) return FRESH_YEAST_LIMITS.max;
  const raw = (YEAST_C / Math.pow(heq, YEAST_N)) * correction;
  return clamp(raw, FRESH_YEAST_LIMITS.min, FRESH_YEAST_LIMITS.max);
}

/** Hefe in % für den gewünschten Hefetyp. */
export function yeastPercent(
  type: Exclude<YeastType, "sourdough">,
  phases: FermentationPhase[],
  correction = 1,
): number {
  return freshYeastPercent(phases, correction) * YEAST_CONVERSION[type];
}

/** Anstellgut in % bezogen auf Gesamtmehl. */
export function starterPercent(
  phases: FermentationPhase[],
  activity: StarterActivity = "normal",
  correction = 1,
): number {
  const heq = equivalentHours(phases);
  if (heq <= 0) return STARTER_LIMITS.max;
  const raw = (STARTER_C / Math.pow(heq, STARTER_N)) * STARTER_ACTIVITY_FACTOR[activity] * correction;
  return clamp(raw, STARTER_LIMITS.min, STARTER_LIMITS.max);
}
