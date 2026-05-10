import type { Ingredient, PizzaRecipe, Upgrade } from "./types";

export const shiftStartHour = 17;
export const dayLength = 360;
export const marketUpdateInterval = 30;
export const contactResponseMinutes = 15;
export const motoboyHireCost = 600;
export const motoboyDailyCost = 80;
export const dailyOverheadCosts = [
  { id: "gas", label: "Gas", amount: 45 },
  { id: "electricity", label: "Luz", amount: 35 },
  { id: "maintenance", label: "Manutencao e limpeza", amount: 25 }
] as const;

export const ingredients: Ingredient[] = [
  { id: "dough", name: "Massa", unit: "un", basePrice: 3.2 },
  { id: "sauce", name: "Molho", unit: "porcao", basePrice: 1.1 },
  { id: "cheese", name: "Queijo", unit: "porcao", basePrice: 4.6 },
  { id: "pepperoni", name: "Calabresa", unit: "porcao", basePrice: 3.9 },
  { id: "box", name: "Embalagem", unit: "un", basePrice: 1.4 }
];

export const recipes: PizzaRecipe[] = [
  {
    id: "margherita",
    name: "Marguerita",
    price: 32,
    bakeMinutes: 30,
    ingredients: { dough: 1, sauce: 1, cheese: 1, box: 1 }
  },
  {
    id: "pepperoni",
    name: "Calabresa",
    price: 39,
    bakeMinutes: 35,
    ingredients: { dough: 1, sauce: 1, cheese: 1, pepperoni: 1, box: 1 }
  },
  {
    id: "house",
    name: "Da Casa",
    price: 45,
    bakeMinutes: 40,
    ingredients: { dough: 1, sauce: 2, cheese: 2, pepperoni: 1, box: 1 }
  }
];

export const starterUpgrades: Upgrade[] = [
  {
    id: "helper",
    name: "Ajudante",
    description: "Reduz atrasos: clientes toleram 15 minutos extras.",
    cost: 1400,
    dayUnlock: 3,
    purchased: false
  },
  {
    id: "oven",
    name: "Forno melhor",
    description: "Adiciona um segundo espaco de forno.",
    cost: 3200,
    dayUnlock: 4,
    purchased: false
  },
  {
    id: "packaging",
    name: "Embalagem reforcada",
    description: "Melhora a satisfacao das entregas no prazo.",
    cost: 900,
    dayUnlock: 2,
    purchased: false
  },
  {
    id: "marketing",
    name: "Marketing local",
    description: "Aumenta a chance de novos pedidos a cada avanco de tempo.",
    cost: 2200,
    dayUnlock: 5,
    purchased: false
  },
  {
    id: "menu",
    name: "Cardapio expandido",
    description: "Aumenta o valor medio de alguns pedidos.",
    cost: 2600,
    dayUnlock: 6,
    purchased: false
  }
];

export const customerNames = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Fernanda",
  "Gabriel",
  "Helena",
  "Igor",
  "Julia",
  "Marcos"
];
