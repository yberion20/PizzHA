/** Art der Gärphase: Stockgare (ganzer Teig) oder Stückgare (geformte Teiglinge). */
export type PhaseKind = "bulk" | "balls";

export interface FermentationPhase {
  kind: PhaseKind;
  /** Dauer in Stunden */
  hours: number;
  /** Temperatur in °C */
  tempC: number;
  /** Optionale Bezeichnung, z. B. "Kühlschrank" */
  label?: string;
}

export type YeastType = "fresh" | "active_dry" | "instant" | "sourdough";

export type StarterActivity = "weak" | "normal" | "strong";

export interface Recipe {
  balls: number;
  /** Gewicht pro Teigballen in g */
  ballWeight: number;
  /** Hydration in % bezogen auf Mehl (z. B. 65) */
  hydration: number;
  /** Salz in % bezogen auf Mehl (z. B. 3) */
  salt: number;
  yeastType: YeastType;
  phases: FermentationPhase[];
  /** Korrekturfaktor für die Hefe- bzw. Anstellgutmenge (Standard 1) */
  correction?: number;
  /** Nur Sauerteig: Hydration des Anstellguts in % (Standard 100) */
  starterHydration?: number;
  /** Nur Sauerteig: Triebkraft des Anstellguts */
  starterActivity?: StarterActivity;
  /**
   * Manuelle Vorgabe der Hefe in % (bei Sauerteig: Anstellgut in %).
   * Überschreibt das Modell.
   */
  yeastPercentOverride?: number;
}

export interface Warning {
  code: string;
  message: string;
}

export interface DoughResult {
  totalDough: number;
  /** Gesamtmehl (inkl. Mehl im Anstellgut) */
  flourTotal: number;
  /** Zuzugebendes Mehl */
  flour: number;
  /** Zuzugebendes Wasser */
  water: number;
  salt: number;
  /** Hefe in g (bei Sauerteig 0) */
  yeast: number;
  /** Anstellgut in g (nur Sauerteig, sonst 0) */
  starter: number;
  /** Hefe- bzw. Anstellgutanteil in % bezogen auf Gesamtmehl */
  yeastPercent: number;
  /** Frischhefe-Äquivalent in % (nur Hefe) */
  freshYeastPercent: number;
  /** Äquivalente Gärstunden bei 24 °C */
  equivalentHours: number;
  /** Mengen hochgerechnet auf 1 kg Mehl */
  perKgFlour: { water: number; salt: number; yeast: number; starter: number };
  warnings: Warning[];
}
