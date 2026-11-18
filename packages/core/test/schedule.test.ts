import { describe, expect, it } from "vitest";
import { buildSchedule, scheduleToIcs, type FermentationPhase } from "../src/index.js";

const phases: FermentationPhase[] = [
  { kind: "bulk", hours: 2, tempC: 22 },
  { kind: "bulk", hours: 42, tempC: 4 },
  { kind: "balls", hours: 4, tempC: 22 },
];

describe("Zeitplan", () => {
  const eat = new Date("2026-11-21T18:00:00Z");
  const s = buildSchedule(phases, eat, { now: new Date("2026-11-01T00:00:00Z") });

  it("rechnet rückwärts ab dem Essen", () => {
    const bake = s.steps.find((x) => x.type === "bake")!;
    expect(bake.at).toBe("2026-11-21T17:30:00.000Z");
    // 48 h Gare + 35 min Kneten vor dem Backen
    expect(s.start).toBe(new Date(Date.parse(bake.at) - 48 * 3600e3 - 35 * 60e3).toISOString());
    expect(s.steps[0].type).toBe("mix");
  });

  it("fügt Wechsel-Schritte ein", () => {
    const types = s.steps.map((x) => x.type);
    expect(types).toEqual(["mix", "bulk_start", "to_fridge", "shape", "preheat", "bake"]);
    expect(s.steps.find((x) => x.type === "shape")!.description).toContain("aus dem Kühlschrank");
    expect(s.steps.find((x) => x.type === "to_fridge")!.at).toBe("2026-11-19T19:30:00.000Z");
  });

  it("Zeiten sind aufsteigend und IDs eindeutig", () => {
    const at = s.steps.map((x) => x.at);
    expect([...at].sort()).toEqual(at);
    expect(new Set(s.steps.map((x) => x.id)).size).toBe(s.steps.length);
  });

  it("warnt, wenn der Start in der Vergangenheit liegt", () => {
    const late = buildSchedule(phases, eat, { now: new Date("2026-11-21T00:00:00Z") });
    expect(late.warnings[0]?.code).toBe("start_in_past");
    expect(s.warnings).toHaveLength(0);
  });

  it("Zeitumstellung (Europe/Berlin, 25.10.2026): Gärdauer bleibt exakt", () => {
    // Essen am 25.10. 19:00 MEZ (= 18:00 UTC); die Nacht davor hat 25 Stunden
    const d = buildSchedule([{ kind: "bulk", hours: 24, tempC: 4 }, { kind: "balls", hours: 3, tempC: 22 }], new Date("2026-10-25T18:00:00Z"), {
      preheatMinutes: 0,
      now: new Date("2026-01-01T00:00:00Z"),
    });
    const fridge = d.steps.find((x) => x.type === "to_fridge")!;
    const out = d.steps.find((x) => x.type === "shape")!;
    expect(Date.parse(out.at) - Date.parse(fridge.at)).toBe(24 * 3600e3);
    const local = new Date(fridge.at).toLocaleString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
    // Formen 15:30 MEZ (14:30 UTC); 24 h vorher = 14:30 UTC am Vortag = 16:30 MESZ
    expect(local).toBe("16:30");
  });

  it("Stückgare im Kühlschrank", () => {
    const d = buildSchedule([{ kind: "bulk", hours: 2, tempC: 22 }, { kind: "balls", hours: 24, tempC: 4 }, { kind: "balls", hours: 3, tempC: 22 }], eat, { now: new Date(0) });
    expect(d.steps.map((x) => x.type)).toEqual(["mix", "bulk_start", "shape", "from_fridge", "preheat", "bake"]);
    expect(d.steps.find((x) => x.type === "shape")!.description).toContain("in den Kühlschrank");
  });

  it("ICS-Export", () => {
    const ics = scheduleToIcs(s, "Pizza", 10);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(s.steps.length);
    expect(ics).toContain("TRIGGER:-PT10M");
    expect(ics).toContain("DTSTART:20261121T173000Z");
  });
});
