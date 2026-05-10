import type { IngredientId } from "@/lib/game/types";

export type MarketSelection = IngredientId | "all";

export type ChartDataPoint = {
  day: string;
  cash: number;
  reputation: number;
};

export type GameWarning = {
  title: string;
  description: string;
  type: "default" | "destructive";
  action?: "inventory";
};
