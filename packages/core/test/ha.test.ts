import { describe, expect, it } from "vitest";
import { haUrlProblem } from "../src/index.js";

describe("haUrlProblem", () => {
  it("blockiert http-Adressen auf einer https-Seite (Mixed Content)", () => {
    expect(haUrlProblem("http://192.168.1.10:8123", "https:")).toContain("https");
  });
  it("erlaubt https-Adressen und http auf http-Seiten", () => {
    expect(haUrlProblem("https://haus.ui.nabu.casa", "https:")).toBeNull();
    expect(haUrlProblem("http://homeassistant.local:8123", "http:")).toBeNull();
  });
  it("meldet leere und ungültige Adressen", () => {
    expect(haUrlProblem("", "https:")).toContain("eintragen");
    expect(haUrlProblem("homeassistant", "https:")).toContain("ungültig");
    expect(haUrlProblem("ftp://x", "https:")).toContain("beginnen");
  });
});
