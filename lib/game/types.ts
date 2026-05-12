import { z } from "zod";

export const IngredientIdSchema = z.enum(["dough", "sauce", "cheese", "pepperoni", "box"]);
export type IngredientId = z.infer<typeof IngredientIdSchema>;

export const RecipeIdSchema = z.enum(["margherita", "pepperoni", "house"]);
export type RecipeId = z.infer<typeof RecipeIdSchema>;

export type OrderStatus =
  | "contacting"
  | "waiting"
  | "accepted"
  | "preparing"
  | "baking"
  | "ready"
  | "delivering"
  | "delivered"
  | "rejected"
  | "expired"
  | "failed";

export type UpgradeId = "helper" | "oven" | "packaging" | "marketing" | "menu";
export type FeedbackReason =
  | "taste"
  | "delivery"
  | "late_delivery"
  | "slow_response"
  | "rejected_order";

export const InventoryItemSchema = z.object({
  ingredientId: IngredientIdSchema,
  quantity: z.number().nonnegative()
});

export const SupplierPriceSchema = z.object({
  ingredientId: IngredientIdSchema,
  price: z.number().positive(),
  changePercent: z.number()
});

export const OrderSchema = z.object({
  id: z.string(),
  recipeId: RecipeIdSchema,
  customerName: z.string(),
  value: z.number().positive(),
  createdAt: z.number().int().nonnegative(),
  dueAt: z.number().int().positive(),
  status: z.enum([
    "contacting",
    "waiting",
    "accepted",
    "preparing",
    "baking",
    "ready",
    "delivering",
    "delivered",
    "rejected",
    "expired",
    "failed"
  ]),
  demanding: z.number().min(1).max(5),
  acceptedAt: z.number().int().nonnegative().optional(),
  preparationStartedAt: z.number().int().nonnegative().optional(),
  preparationReadyAt: z.number().int().nonnegative().optional(),
  preparationMinutes: z.number().int().positive().optional(),
  contactExpiresAt: z.number().int().positive().optional(),
  message: z.string().optional(),
  deliveryStartedAt: z.number().int().nonnegative().optional(),
  deliveryEta: z.number().int().positive().optional(),
  deliveryArrivesAt: z.number().int().positive().optional()
});

export const OvenSlotSchema = z.object({
  id: z.string(),
  orderId: z.string().nullable(),
  recipeId: RecipeIdSchema.nullable(),
  startedAt: z.number().int().nonnegative().nullable(),
  readyAt: z.number().int().nonnegative().nullable()
});

export const CashLedgerEntrySchema = z.object({
  id: z.string(),
  day: z.number().int().positive(),
  minute: z.number().int().nonnegative(),
  type: z.enum(["purchase", "sale", "upgrade", "penalty", "labor", "overhead"]),
  label: z.string(),
  amount: z.number()
});

export const CustomerFeedbackSchema = z.object({
  id: z.string(),
  orderId: z.string().optional(),
  message: z.string(),
  reputationDelta: z.number(),
  reason: z.enum(["taste", "delivery", "late_delivery", "slow_response", "rejected_order"]),
  minute: z.number().int().nonnegative()
});

export const UpgradeSchema = z.object({
  id: z.enum(["helper", "oven", "packaging", "marketing", "menu"]),
  name: z.string(),
  description: z.string(),
  cost: z.number().positive(),
  dayUnlock: z.number().int().positive(),
  purchased: z.boolean()
});

export const DayReportSchema = z.object({
  day: z.number().int().positive(),
  revenue: z.number(),
  costs: z.number(),
  profit: z.number(),
  accepted: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  complaints: z.number().int().nonnegative(),
  reputation: z.number(),
  cashEnd: z.number()
});

export const MarketHistoryEntrySchema = z.object({
  id: z.string(),
  day: z.number().int().positive(),
  minute: z.number().int().nonnegative(),
  ingredientId: IngredientIdSchema,
  price: z.number().positive(),
  changePercent: z.number()
});

export const GameStateSchema = z.object({
  day: z.number().int().positive(),
  minute: z.number().int().nonnegative(),
  shopOpen: z.boolean(),
  isRunning: z.boolean(),
  speed: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  cash: z.number(),
  reputation: z.number().min(0).max(100),
  motoboys: z.number().int().positive(),
  inventory: z.array(InventoryItemSchema),
  prices: z.array(SupplierPriceSchema),
  marketHistory: z.array(MarketHistoryEntrySchema),
  orders: z.array(OrderSchema),
  oven: z.array(OvenSlotSchema),
  ledger: z.array(CashLedgerEntrySchema),
  feedback: z.array(CustomerFeedbackSchema),
  upgrades: z.array(UpgradeSchema),
  reports: z.array(DayReportSchema),
  eventLog: z.array(z.string()),
  nextOrderId: z.number().int().positive(),
  lastContactAt: z.number().int().nonnegative().nullable()
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type SupplierPrice = z.infer<typeof SupplierPriceSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OvenSlot = z.infer<typeof OvenSlotSchema>;
export type CashLedgerEntry = z.infer<typeof CashLedgerEntrySchema>;
export type CustomerFeedback = z.infer<typeof CustomerFeedbackSchema>;
export type Upgrade = z.infer<typeof UpgradeSchema>;
export type DayReport = z.infer<typeof DayReportSchema>;
export type MarketHistoryEntry = z.infer<typeof MarketHistoryEntrySchema>;
export type GameState = z.infer<typeof GameStateSchema>;

export type Ingredient = {
  id: IngredientId;
  name: string;
  unit: string;
  basePrice: number;
};

export type PizzaRecipe = {
  id: RecipeId;
  name: string;
  price: number;
  bakeMinutes: number;
  ingredients: Partial<Record<IngredientId, number>>;
};
