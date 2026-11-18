import { describe, expect, it } from "vitest";
import { calculateDough, freshYeastPercent, starterPercent, temperatureFactor, yeastPercent, type FermentationPhase, type Recipe } from "../src/index.js";

const userPhases: FermentationPhase[] = [
  { kind: "bulk", hours: 42, tempC: 4.5 },
  { kind: "balls", hours: 5.5, tempC: 22 },
];

describe("Kalibrierung auf das Rezept des Nutzers", () => {
  it("42 h Kühlschrank + 5,5 h Raumtemperatur ≈ 1,5 g Frischhefe pro kg Mehl", () => {
    const pct = freshYeastPercent(userPhases);
    expect(pct).toBeGreaterThan(0.135);
    expect(pct).toBeLessThan(0.165);
    const r = calculateDough({ balls: 6, ballWeight: 270, hydration: 65, salt: 3, yeastType: "fresh", phases: userPhases });
    expect(r.perKgFlour.yeast).toBeGreaterThan(1.35);
    expect(r.perKgFlour.yeast).toBeLessThan(1.65);
  });
});

describe("Plausibilität", () => {
  it("AVPN: 8–24 h Raumtemperatur liegt im Bereich 0,1–0,5 % Frischhefe", () => {
    const p24 = freshYeastPercent([{ kind: "bulk", hours: 24, tempC: 22 }]);
    const p8 = freshYeastPercent([{ kind: "bulk", hours: 8, tempC: 23 }]);
    expect(p24).toBeGreaterThan(0.06);
    expect(p24).toBeLessThan(0.15);
    expect(p8).toBeGreaterThan(0.25);
    expect(p8).toBeLessThan(0.6);
  });

  it("mehr Zeit bzw. wärmer → weniger Hefe", () => {
    let prev = Infinity;
    for (const h of [6, 12, 24, 48, 72]) {
      const v = freshYeastPercent([{ kind: "bulk", hours: h, tempC: 20 }]);
      expect(v).toBeLessThan(prev);
      prev = v;
    }
    prev = Infinity;
    for (const t of [4, 10, 16, 22, 28]) {
      const v = freshYeastPercent([{ kind: "bulk", hours: 10, tempC: t }]);
      expect(v).toBeLessThan(prev);
      prev = v;
    }
  });

  it("Temperaturfaktor ist monoton und 1 bei 24 °C", () => {
    expect(temperatureFactor(24)).toBe(1);
    for (let t = -5; t < 40; t += 0.5) expect(temperatureFactor(t + 0.5)).toBeGreaterThanOrEqual(temperatureFactor(t));
  });

  it("Umrechnung der Hefetypen", () => {
    const fresh = freshYeastPercent(userPhases);
    expect(yeastPercent("active_dry", userPhases)).toBeCloseTo(fresh * 0.4, 6);
    expect(yeastPercent("instant", userPhases)).toBeCloseTo(fresh * 0.33, 6);
  });

  it("Korrekturfaktor skaliert linear", () => {
    expect(freshYeastPercent(userPhases, 1.2)).toBeCloseTo(freshYeastPercent(userPhases) * 1.2, 6);
  });
});

describe("Teigmengen", () => {
  const base: Recipe = { balls: 6, ballWeight: 270, hydration: 65, salt: 3, yeastType: "fresh", phases: userPhases };

  it("Summe der Zutaten = Zielgewicht", () => {
    const r = calculateDough(base);
    expect(r.flour + r.water + r.salt + r.yeast).toBeCloseTo(1620, 0);
    expect(r.water / r.flour).toBeCloseTo(0.65, 2);
    expect(r.salt / r.flour).toBeCloseTo(0.03, 2);
  });

  it("Sauerteig: Massenbilanz und Gesamt-Hydration stimmen", () => {
    const r = calculateDough({ ...base, yeastType: "sourdough", starterHydration: 100 });
    expect(r.yeast).toBe(0);
    expect(r.flour + r.water + r.salt + r.starter).toBeCloseTo(1620, 0);
    const starterFlour = r.starter / 2;
    expect((r.water + r.starter - starterFlour) / (r.flour + starterFlour)).toBeCloseTo(0.65, 2);
    expect(r.flourTotal).toBeCloseTo(r.flour + starterFlour, 0);
  });

  it("Sauerteig: ~10 % Anstellgut bei 24 h Raumtemperatur, mehr bei kurzer Gare", () => {
    const p24 = starterPercent([{ kind: "bulk", hours: 24, tempC: 22 }]);
    expect(p24).toBeGreaterThan(8);
    expect(p24).toBeLessThan(12);
    expect(starterPercent([{ kind: "bulk", hours: 8, tempC: 24 }])).toBeGreaterThan(20);
    expect(starterPercent(userPhases, "strong")).toBeLessThan(starterPercent(userPhases, "weak"));
  });

  it("manuelle Vorgabe überschreibt das Modell", () => {
    const r = calculateDough({ ...base, yeastPercentOverride: 0.2 });
    expect(r.yeastPercent).toBeCloseTo(0.2, 3);
  });

  it("harte Fehler und Warnungen", () => {
    expect(() => calculateDough({ ...base, phases: [] })).toThrow();
    expect(() => calculateDough({ ...base, phases: [{ kind: "balls", hours: 2, tempC: 20 }, { kind: "bulk", hours: 2, tempC: 20 }] })).toThrow();
    expect(() => calculateDough({ ...base, phases: Array(5).fill({ kind: "bulk", hours: 1, tempC: 20 }) })).toThrow();
    const r = calculateDough({ ...base, hydration: 90, phases: [{ kind: "bulk", hours: 24, tempC: 20 }] });
    expect(r.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(["hydration_range", "no_balls_phase"]));
  });
});
