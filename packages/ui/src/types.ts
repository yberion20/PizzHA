import type { PlanPayload } from "@pizza-dough/core";

export interface ActiveStep {
  id: string;
  type: string;
  title: string;
  description: string;
  at: string;
  done: boolean;
  notified: boolean;
}

export interface ActivePlan {
  name: string;
  eat_at: string;
  amounts: Partial<PlanPayload["amounts"]>;
  steps: ActiveStep[];
}

/** Verbindung der Oberfläche zu Home Assistant oder zum lokalen Speicher der Web-App. */
export interface PlanBackend {
  /** Bezeichnung, z. B. "Home Assistant" */
  label: string;
  startPlan(plan: PlanPayload): Promise<void>;
  cancelPlan(): Promise<void>;
  completeStep(stepId: string): Promise<void>;
}
