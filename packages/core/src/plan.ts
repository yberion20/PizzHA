import type { DoughResult, Recipe } from "./types.js";
import type { Schedule } from "./schedule.js";

/** Datenformat, das an den Home-Assistant-Dienst pizza_dough.start_plan übergeben wird. */
export interface PlanPayload {
  name: string;
  eat_at: string;
  recipe: Recipe;
  amounts: {
    flour: number;
    flour_total: number;
    water: number;
    salt: number;
    yeast: number;
    starter: number;
    yeast_type: Recipe["yeastType"];
    yeast_percent: number;
  };
  steps: { id: string; type: string; title: string; description: string; at: string }[];
}

export function buildPlanPayload(name: string, recipe: Recipe, dough: DoughResult, schedule: Schedule): PlanPayload {
  return {
    name,
    eat_at: schedule.eatAt,
    recipe,
    amounts: {
      flour: dough.flour,
      flour_total: dough.flourTotal,
      water: dough.water,
      salt: dough.salt,
      yeast: dough.yeast,
      starter: dough.starter,
      yeast_type: recipe.yeastType,
      yeast_percent: dough.yeastPercent,
    },
    steps: schedule.steps.map(({ id, type, title, description, at }) => ({ id, type, title, description, at })),
  };
}
