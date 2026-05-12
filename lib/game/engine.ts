import { clamp } from "@/lib/utils";
import {
  contactResponseMinutes,
  customerNames,
  dailyOverheadCosts,
  dayLength,
  ingredients,
  marketUpdateInterval,
  motoboyDailyCost,
  motoboyHireCost,
  recipes,
  shiftStartHour,
  starterUpgrades
} from "./data";
import type {
  GameState,
  IngredientId,
  MarketHistoryEntry,
  Order,
  RecipeId,
  SupplierPrice,
  UpgradeId
} from "./types";

const id = (prefix: string, day: number, minute: number, sequence: number) =>
  `${prefix}-${day}-${minute}-${sequence}`;

export function recipeById(recipeId: RecipeId) {
  return recipes.find((recipe) => recipe.id === recipeId)!;
}

export function ingredientById(ingredientId: IngredientId) {
  return ingredients.find((ingredient) => ingredient.id === ingredientId)!;
}

export function createInitialGameState(): GameState {
  const prices = generatePrices(1, 0);

  return {
    day: 1,
    minute: 0,
    shopOpen: false,
    isRunning: false,
    speed: 1,
    cash: 1000,
    reputation: 0,
    motoboys: 1,
    inventory: ingredients.map((ingredient) => ({
      ingredientId: ingredient.id,
      quantity: 0
    })),
    prices,
    marketHistory: createMarketSnapshot(1, 0, prices),
    orders: [],
    oven: [{ id: "oven-1", orderId: null, recipeId: null, startedAt: null, readyAt: null }],
    ledger: [],
    feedback: [],
    upgrades: starterUpgrades.map((upgrade) => ({ ...upgrade, purchased: false })),
    reports: [],
    eventLog: ["Dia 1 preparado. Compre estoque antes de abrir a loja."],
    nextOrderId: 1,
    lastContactAt: null
  };
}

export function generatePrices(day: number, minute = 0): SupplierPrice[] {
  return ingredients.map((ingredient, index) => {
    const dailyWave = Math.sin(day * 1.7 + index * 0.9) * 12;
    const intradayWave = Math.sin((minute / marketUpdateInterval + index) * 0.85) * 9;
    const pressure = Math.cos(day * 0.45 + minute / 95 + index * 1.3) * 5;
    const changePercent = Math.round(dailyWave + intradayWave + pressure);
    const price = Number((ingredient.basePrice * (1 + changePercent / 100)).toFixed(2));
    return { ingredientId: ingredient.id, price: Math.max(0.1, price), changePercent };
  });
}

export function openShop(state: GameState): GameState {
  if (state.shopOpen) return state;
  const missing = getOpeningStockMissing(state);
  if (missing.length > 0) {
    return withLog(state, `Nao foi possivel abrir: compre ${missing.join(", ")}.`);
  }

  return {
    ...state,
    shopOpen: true,
    isRunning: true,
    minute: 0,
    eventLog: [`Loja aberta as ${timeLabel(0)}. Clientes podem chamar no inbox.`, ...state.eventLog]
  };
}

export function hireMotoboy(state: GameState): GameState {
  if (state.cash < motoboyHireCost) {
    return withLog(state, "Caixa insuficiente para contratar motoboy.");
  }

  return {
    ...state,
    cash: Number((state.cash - motoboyHireCost).toFixed(2)),
    motoboys: state.motoboys + 1,
    ledger: [
      ...state.ledger,
      {
        id: id("ledger", state.day, state.minute, state.ledger.length + 1),
        day: state.day,
        minute: state.minute,
        type: "labor",
        label: "Contratacao de motoboy",
        amount: -motoboyHireCost
      }
    ],
    eventLog: [`Motoboy contratado por R$ ${motoboyHireCost.toFixed(2)}.`, ...state.eventLog]
  };
}

export function toggleRunning(state: GameState): GameState {
  if (!state.shopOpen && !hasActiveOrders(state)) return state;
  return { ...state, isRunning: !state.isRunning };
}

export function setSpeed(state: GameState, speed: 1 | 3 | 5): GameState {
  return { ...state, speed };
}

export function buyIngredient(state: GameState, ingredientId: IngredientId, quantity: number): GameState {
  const price = state.prices.find((item) => item.ingredientId === ingredientId)?.price ?? 0;
  const total = Number((price * quantity).toFixed(2));

  if (quantity <= 0 || state.cash < total) {
    return withLog(state, "Compra nao realizada: caixa insuficiente ou quantidade invalida.");
  }

  return {
    ...state,
    cash: Number((state.cash - total).toFixed(2)),
    inventory: state.inventory.map((item) =>
      item.ingredientId === ingredientId
        ? { ...item, quantity: item.quantity + quantity }
        : item
    ),
    ledger: [
      ...state.ledger,
      {
        id: id("ledger", state.day, state.minute, state.ledger.length + 1),
        day: state.day,
        minute: state.minute,
        type: "purchase",
        label: `Compra de ${quantity} ${ingredientById(ingredientId).name}`,
        amount: -total
      }
    ],
    eventLog: [
      `Comprou ${quantity} ${ingredientById(ingredientId).unit} de ${ingredientById(ingredientId).name}.`,
      ...state.eventLog
    ]
  };
}

export function acceptOrder(state: GameState, orderId: string): GameState {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || order.status !== "contacting" || state.minute > (order.contactExpiresAt ?? 0)) {
    return withLog(state, "Esse cliente nao esta mais aguardando resposta.");
  }

  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId ? { ...item, status: "accepted", acceptedAt: state.minute } : item
    ),
    eventLog: [`Pedido ${orderId} aceito pelo WhatsApp.`, ...state.eventLog]
  };
}

export function rejectOrder(state: GameState, orderId: string): GameState {
  const order = state.orders.find((item) => item.id === orderId);
  return {
    ...state,
    reputation: clamp(state.reputation - 1, 0, 100),
    orders: state.orders.map((order) =>
      ["contacting", "waiting"].includes(order.status) && order.id === orderId
        ? { ...order, status: "rejected" }
        : order
    ),
    feedback: [
      ...state.feedback,
      {
        id: id("feedback", state.day, state.minute, state.feedback.length + 1),
        orderId,
        message: `${order?.customerName ?? "Cliente"} ficou chateado com a recusa.`,
        reputationDelta: -1,
        reason: "rejected_order",
        minute: state.minute
      }
    ],
    eventLog: [`Pedido ${orderId} recusado. A reputacao caiu levemente.`, ...state.eventLog]
  };
}

export function startPreparation(state: GameState, orderId: string): GameState {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || order.status !== "accepted" || order.preparationReadyAt !== undefined) {
    return withLog(state, "Nao foi possivel preparar esse pedido.");
  }

  const recipe = recipeById(order.recipeId);
  if (!hasIngredients(state, recipe.ingredients)) {
    return withLog(state, "Estoque insuficiente para preparar esse pedido.");
  }

  const preparationMinutes = preparationTime(state, order);
  return {
    ...state,
    inventory: state.inventory.map((item) => ({
      ...item,
      quantity: item.quantity - (recipe.ingredients[item.ingredientId] ?? 0)
    })),
    orders: state.orders.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: "preparing",
            preparationStartedAt: state.minute,
            preparationReadyAt: state.minute + preparationMinutes,
            preparationMinutes
          }
        : item
    ),
    eventLog: [`${recipe.name} entrou em preparo para ${order.customerName}.`, ...state.eventLog]
  };
}

export function startBaking(state: GameState, orderId: string): GameState {
  const order = state.orders.find((item) => item.id === orderId);
  const freeSlot = state.oven.find((slot) => !slot.orderId);
  if (!order || order.status !== "accepted" || order.preparationReadyAt === undefined || !freeSlot) {
    return withLog(state, "Nao foi possivel iniciar o forno para esse pedido.");
  }

  const recipe = recipeById(order.recipeId);

  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId ? { ...item, status: "baking" } : item
    ),
    oven: state.oven.map((slot) =>
      slot.id === freeSlot.id
        ? {
            ...slot,
            orderId,
            recipeId: order.recipeId,
            startedAt: state.minute,
            readyAt: state.minute + recipe.bakeMinutes
          }
        : slot
    ),
    eventLog: [`${recipe.name} entrou no forno para ${order.customerName}.`, ...state.eventLog]
  };
}

export function deliverOrder(state: GameState, orderId: string): GameState {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || order.status !== "ready") {
    return withLog(state, "Esse pedido ainda nao esta pronto para despacho.");
  }
  if (availableMotoboys(state) <= 0) {
    return withLog(state, "Todos os motoboys estao em rota.");
  }

  const eta = deliveryEta(order, state.day);
  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: "delivering",
            deliveryStartedAt: state.minute,
            deliveryEta: eta,
            deliveryArrivesAt: state.minute + eta
          }
        : item
    ),
    eventLog: [`Motoboy saiu com o pedido ${orderId}. ETA: ${eta} min.`, ...state.eventLog]
  };
}

export function advanceTime(state: GameState, minutes: number): GameState {
  if ((!state.shopOpen && !hasActiveOrders(state)) || minutes <= 0) return state;

  const nextMinute = state.minute + minutes;
  let nextState: GameState = { ...state, minute: nextMinute };

  nextState = updateMarket(nextState, state.minute, Math.min(nextMinute, dayLength));
  nextState = completePreparationJobs(nextState);
  nextState = completeOvenJobs(nextState);
  nextState = expireContacts(nextState, state);
  nextState = completeDeliveries(nextState, state);
  nextState = failAbandonedOrders(nextState, state);

  if (nextMinute < dayLength) {
    nextState = maybeGenerateContact(nextState);
  } else if (state.minute < dayLength) {
    nextState = closeShopForNight(nextState);
  } else if (!hasActiveOrders(nextState)) {
    nextState = { ...nextState, isRunning: false };
  }

  return nextState;
}

export function endDay(state: GameState): GameState {
  if (hasActiveOrders(state)) {
    return withLog(state, "Conclua os pedidos ativos antes de fechar o dia.");
  }

  const laborCost = state.motoboys * motoboyDailyCost;
  const laborEntry = {
    id: id("ledger", state.day, state.minute, state.ledger.length + 1),
    day: state.day,
    minute: state.minute,
    type: "labor" as const,
    label: `Diaria de ${state.motoboys} motoboy(s)`,
    amount: -laborCost
  };
  const overheadEntries = dailyOverheadCosts.map((cost, index) => ({
    id: id("ledger", state.day, state.minute, state.ledger.length + 2 + index),
    day: state.day,
    minute: state.minute,
    type: "overhead" as const,
    label: cost.label,
    amount: -cost.amount
  }));
  const overheadTotal = overheadEntries.reduce((total, entry) => total + Math.abs(entry.amount), 0);
  const totalDailyCosts = laborCost + overheadTotal;
  const ledger = [...state.ledger, laborEntry, ...overheadEntries];
  const dayLedger = ledger.filter((entry) => entry.day === state.day);
  const revenue = sum(dayLedger.filter((entry) => entry.amount > 0).map((entry) => entry.amount));
  const costs = Math.abs(sum(dayLedger.filter((entry) => entry.amount < 0).map((entry) => entry.amount)));
  const accepted = state.orders.filter((order) =>
    ["accepted", "preparing", "baking", "ready", "delivering", "delivered", "failed"].includes(order.status)
  ).length;
  const delivered = state.orders.filter((order) => order.status === "delivered").length;
  const complaints =
    state.feedback.filter((item) => item.reputationDelta < 0).length +
    state.orders.filter((order) => ["failed", "expired"].includes(order.status)).length;
  const report = {
    day: state.day,
    revenue,
    costs,
    profit: Number((revenue - costs).toFixed(2)),
    accepted,
    delivered,
    complaints,
    reputation: state.reputation,
    cashEnd: Number((state.cash - totalDailyCosts).toFixed(2))
  };
  const nextDay = state.day + 1;
  const nextOvenCount = hasUpgrade(state, "oven") ? 2 : 1;
  const prices = generatePrices(nextDay, 0);

  return {
    ...state,
    day: nextDay,
    minute: 0,
    shopOpen: false,
    isRunning: false,
    speed: 1,
    cash: Number((state.cash - totalDailyCosts).toFixed(2)),
    prices,
    marketHistory: createMarketSnapshot(nextDay, 0, prices),
    orders: [],
    oven: Array.from({ length: nextOvenCount }, (_, index) => ({
      id: `oven-${index + 1}`,
      orderId: null,
      recipeId: null,
      startedAt: null,
      readyAt: null
    })),
    reports: [...state.reports, report],
    ledger,
    eventLog: [
      `Diaria dos motoboys descontada: R$ ${laborCost.toFixed(2)}.`,
      `Custos fixos descontados: R$ ${overheadTotal.toFixed(2)}.`,
      `Dia ${nextDay} preparado. Estoque mantido e mercado reiniciado.`,
      ...state.eventLog
    ],
    lastContactAt: null
  };
}

export function purchaseUpgrade(state: GameState, upgradeId: UpgradeId): GameState {
  const upgrade = state.upgrades.find((item) => item.id === upgradeId);
  if (!upgrade || upgrade.purchased || upgrade.dayUnlock > state.day || state.cash < upgrade.cost) {
    return withLog(state, "Melhoria indisponivel ou caixa insuficiente.");
  }

  const nextState: GameState = {
    ...state,
    cash: Number((state.cash - upgrade.cost).toFixed(2)),
    upgrades: state.upgrades.map((item) =>
      item.id === upgradeId ? { ...item, purchased: true } : item
    ),
    ledger: [
      ...state.ledger,
      {
        id: id("ledger", state.day, state.minute, state.ledger.length + 1),
        day: state.day,
        minute: state.minute,
        type: "upgrade",
        label: upgrade.name,
        amount: -upgrade.cost
      }
    ],
    eventLog: [`Melhoria comprada: ${upgrade.name}.`, ...state.eventLog]
  };

  if (upgradeId === "oven") {
    return {
      ...nextState,
      oven: [
        ...nextState.oven,
        { id: `oven-${nextState.oven.length + 1}`, orderId: null, recipeId: null, startedAt: null, readyAt: null }
      ]
    };
  }

  return nextState;
}

export function timeLabel(minute: number) {
  const hour = shiftStartHour + Math.floor(minute / 60);
  const min = String(minute % 60).padStart(2, "0");
  return `${String(hour).padStart(2, "0")}:${min}`;
}

function updateMarket(state: GameState, previousMinute: number, nextMinute: number): GameState {
  const nextMarketMinute = Math.floor(nextMinute / marketUpdateInterval) * marketUpdateInterval;
  const previousMarketMinute = Math.floor(previousMinute / marketUpdateInterval) * marketUpdateInterval;
  if (nextMarketMinute <= previousMarketMinute) return state;

  const prices = generatePrices(state.day, nextMarketMinute);
  return {
    ...state,
    prices,
    marketHistory: [
      ...state.marketHistory,
      ...createMarketSnapshot(state.day, nextMarketMinute, prices)
    ],
    eventLog: [`Mercado atualizou os precos as ${timeLabel(nextMarketMinute)}.`, ...state.eventLog]
  };
}

function completePreparationJobs(state: GameState): GameState {
  const preparedOrderIds = state.orders
    .filter(
      (order) =>
        order.status === "preparing" &&
        order.preparationReadyAt !== undefined &&
        order.preparationReadyAt <= state.minute
    )
    .map((order) => order.id);

  if (preparedOrderIds.length === 0) return state;

  return {
    ...state,
    orders: state.orders.map((order) =>
      preparedOrderIds.includes(order.id) ? { ...order, status: "accepted" } : order
    ),
    eventLog: [`${preparedOrderIds.length} pedido(s) terminaram o preparo.`, ...state.eventLog]
  };
}

function completeOvenJobs(state: GameState): GameState {
  const readyOrderIds = state.oven
    .filter((slot) => slot.orderId && slot.readyAt !== null && slot.readyAt <= state.minute)
    .map((slot) => slot.orderId!);

  if (readyOrderIds.length === 0) return state;

  return {
    ...state,
    oven: state.oven.map((slot) =>
      slot.orderId && readyOrderIds.includes(slot.orderId)
        ? { ...slot, orderId: null, recipeId: null, startedAt: null, readyAt: null }
        : slot
    ),
    orders: state.orders.map((order) =>
      readyOrderIds.includes(order.id) && order.status === "baking"
        ? { ...order, status: "ready" }
        : order
    ),
    eventLog: [`${readyOrderIds.length} pizza(s) sairam do forno.`, ...state.eventLog]
  };
}

function expireContacts(state: GameState, previousState: GameState): GameState {
  const expiredOrders = state.orders.filter(
    (order) =>
      order.status === "contacting" &&
      (order.contactExpiresAt ?? Number.POSITIVE_INFINITY) <= state.minute &&
      previousState.orders.find((previous) => previous.id === order.id)?.status === "contacting"
  );
  return expireSelectedContacts(state, expiredOrders, `${expiredOrders.length} cliente(s) desistiram no chat.`);
}

function closeShopForNight(state: GameState): GameState {
  const openContacts = state.orders.filter((order) => order.status === "contacting");
  const closedState = expireSelectedContacts(
    state,
    openContacts,
    `${openContacts.length} contato(s) expiraram no fechamento.`
  );

  return {
    ...closedState,
    shopOpen: false,
    isRunning: hasActiveOrders(closedState),
    eventLog: [
      `Loja fechada as ${timeLabel(dayLength)}. Finalize os pedidos aceitos antes de fechar o dia.`,
      ...closedState.eventLog
    ],
    lastContactAt: null
  };
}

function expireSelectedContacts(state: GameState, expiredOrders: Order[], summary: string): GameState {
  if (expiredOrders.length === 0) return state;

  const penalty = expiredOrders.reduce((total, order) => total + Math.ceil(order.demanding / 2), 0);
  return {
    ...state,
    reputation: clamp(state.reputation - penalty, 0, 100),
    orders: state.orders.map((order) =>
      expiredOrders.some((expired) => expired.id === order.id)
        ? { ...order, status: "expired" }
        : order
    ),
    feedback: [
      ...state.feedback,
      ...expiredOrders.map((order, index) => ({
        id: id("feedback", state.day, state.minute, state.feedback.length + index + 1),
        orderId: order.id,
        message: `${order.customerName} desistiu porque demorou para receber resposta.`,
        reputationDelta: -Math.ceil(order.demanding / 2),
        reason: "slow_response" as const,
        minute: state.minute
      }))
    ],
    eventLog: [
      `${summary} Reputacao -${penalty}.`,
      ...state.eventLog
    ]
  };
}

function completeDeliveries(state: GameState, previousState: GameState): GameState {
  const arrivingOrders = state.orders.filter(
    (order) =>
      order.status === "delivering" &&
      (order.deliveryArrivesAt ?? Number.POSITIVE_INFINITY) <= state.minute &&
      previousState.orders.find((previous) => previous.id === order.id)?.status === "delivering"
  );
  if (arrivingOrders.length === 0) return state;

  return arrivingOrders.reduce((nextState, order) => closeDelivery(nextState, order), state);
}

function closeDelivery(state: GameState, order: Order): GameState {
  const arrivalMinute = order.deliveryArrivesAt ?? state.minute;
  const lateMinutes = Math.max(0, arrivalMinute - order.dueAt);
  const helperBonus = hasUpgrade(state, "helper") ? 15 : 0;
  const adjustedLate = Math.max(0, lateMinutes - helperBonus);
  const packagingBonus = hasUpgrade(state, "packaging") ? 1 : 0;
  const repDelta = adjustedLate > 0 ? -Math.ceil(adjustedLate / 8) : 1 + packagingBonus;
  const message =
    adjustedLate > 0
      ? `Cliente reclamou de atraso de ${adjustedLate} min.`
      : "Entrega no prazo. Cliente satisfeito.";

  return {
    ...state,
    cash: Number((state.cash + order.value).toFixed(2)),
    reputation: clamp(state.reputation + repDelta, 0, 100),
    orders: state.orders.map((item) =>
      item.id === order.id ? { ...item, status: "delivered" } : item
    ),
    ledger: [
      ...state.ledger,
      {
        id: id("ledger", state.day, arrivalMinute, state.ledger.length + 1),
        day: state.day,
        minute: arrivalMinute,
        type: "sale",
        label: `Venda ${recipeById(order.recipeId).name}`,
        amount: order.value
      }
    ],
    feedback: [
      ...state.feedback,
      {
        id: id("feedback", state.day, arrivalMinute, state.feedback.length + 1),
        orderId: order.id,
        message,
        reputationDelta: repDelta,
        reason: adjustedLate > 0 ? "late_delivery" : "delivery",
        minute: arrivalMinute
      }
    ],
    eventLog: [`${message} Recebeu R$ ${order.value.toFixed(2)}.`, ...state.eventLog]
  };
}

function failAbandonedOrders(state: GameState, previousState: GameState): GameState {
  const failedOrders = state.orders.filter(
    (order) =>
      ["accepted", "preparing", "baking", "ready"].includes(order.status) &&
      state.minute > order.dueAt + 60 &&
      previousState.orders.find((previous) => previous.id === order.id)?.status !== "failed"
  );
  if (failedOrders.length === 0) return state;

  return {
    ...state,
    reputation: clamp(state.reputation - failedOrders.length * 5, 0, 100),
    orders: state.orders.map((order) =>
      failedOrders.some((failed) => failed.id === order.id) ? { ...order, status: "failed" } : order
    ),
    eventLog: [`${failedOrders.length} pedido(s) foram perdidos por atraso extremo.`, ...state.eventLog]
  };
}

function maybeGenerateContact(state: GameState): GameState {
  const demand = demandProfile(state.reputation);
  const openContacts = state.orders.filter((order) => order.status === "contacting").length;
  const activeOrders = state.orders.filter((order) =>
    ["contacting", "accepted", "preparing", "baking", "ready", "delivering"].includes(order.status)
  ).length;
  if (openContacts >= demand.maxContacts || activeOrders >= demand.maxActive) return state;
  if (state.lastContactAt !== null && state.minute - state.lastContactAt < demand.minGap) return state;

  const marketing = hasUpgrade(state, "marketing") ? 8 : 0;
  const threshold = clamp(demand.threshold + marketing, 2, 48);
  const score = (state.day * 17 + state.minute * 7 + state.reputation + state.nextOrderId * 11) % 100;
  if (score > threshold) return state;

  const order = createOrder(state.day, state.minute, state.reputation, state.nextOrderId);
  return {
    ...state,
    nextOrderId: state.nextOrderId + 1,
    lastContactAt: state.minute,
    orders: [order, ...state.orders],
    eventLog: [`Mensagem nova de ${order.customerName}: ${recipeById(order.recipeId).name}.`, ...state.eventLog]
  };
}

function createOrder(day: number, minute: number, reputation: number, sequence: number): Order {
  const availableRecipes = reputation > 62 || day >= 6 ? recipes : recipes.slice(0, 2);
  const recipe = availableRecipes[(day + sequence) % availableRecipes.length];
  const demanding = clamp(2 + ((day + sequence) % 4), 1, 5);
  const reputationBonus = reputation > 70 ? 5 : 0;
  const value = recipe.price + reputationBonus + (demanding - 2) * 2;

  return {
    id: `P${sequence}`,
    recipeId: recipe.id,
    customerName: customerNames[sequence % customerNames.length],
    value,
    createdAt: minute,
    dueAt: minute + 95 - demanding * 5,
    status: "contacting",
    demanding,
    contactExpiresAt: minute + contactResponseMinutes,
    message: buildCustomerMessage(recipe.name, demanding)
  };
}

export function getOpeningStockMissing(state: GameState) {
  const starterRecipe = recipes[0];
  return Object.entries(starterRecipe.ingredients)
    .filter(([ingredientId, quantity]) => {
      const item = state.inventory.find((inventory) => inventory.ingredientId === ingredientId);
      return (item?.quantity ?? 0) < (quantity ?? 0);
    })
    .map(([ingredientId]) => ingredientById(ingredientId as IngredientId).name);
}

export function availableMotoboys(state: GameState) {
  const delivering = state.orders.filter((order) => order.status === "delivering").length;
  return Math.max(0, state.motoboys - delivering);
}

export function hasActiveOrders(state: GameState) {
  return state.orders.some((order) =>
    ["accepted", "preparing", "baking", "ready", "delivering"].includes(order.status)
  );
}

function preparationTime(state: GameState, order: Order) {
  const recipe = recipeById(order.recipeId);
  const ingredientUnits = Object.values(recipe.ingredients).reduce((total, quantity) => total + (quantity ?? 0), 0);
  const helperReduction = hasUpgrade(state, "helper") ? 3 : 0;
  return Math.max(5, 8 + ingredientUnits * 2 + order.demanding - helperReduction);
}

function demandProfile(reputation: number) {
  if (reputation < 20) {
    return { threshold: 2, minGap: 35, maxContacts: 1, maxActive: 2 };
  }
  if (reputation < 35) {
    return { threshold: 8, minGap: 22, maxContacts: 1, maxActive: 3 };
  }
  if (reputation < 60) {
    return { threshold: 18, minGap: 15, maxContacts: 2, maxActive: 5 };
  }
  if (reputation < 80) {
    return { threshold: 28, minGap: 10, maxContacts: 3, maxActive: 7 };
  }
  return { threshold: 38, minGap: 7, maxContacts: 3, maxActive: 9 };
}

function buildCustomerMessage(recipeName: string, demanding: number) {
  const tone = demanding >= 4 ? "Consegue mandar rapido?" : "Boa noite! Ainda da para pedir?";
  return `${tone} Quero uma ${recipeName}.`;
}

function deliveryEta(order: Order, day: number) {
  return clamp(12 + ((day * 5 + order.demanding * 4 + order.id.length * 3) % 17), 12, 28);
}

function createMarketSnapshot(day: number, minute: number, prices: SupplierPrice[]): MarketHistoryEntry[] {
  return prices.map((price) => ({
    id: id("market", day, minute, ingredients.findIndex((ingredient) => ingredient.id === price.ingredientId) + 1),
    day,
    minute,
    ingredientId: price.ingredientId,
    price: price.price,
    changePercent: price.changePercent
  }));
}

function hasIngredients(state: GameState, needs: Partial<Record<IngredientId, number>>) {
  return Object.entries(needs).every(([ingredientId, quantity]) => {
    const item = state.inventory.find((inventory) => inventory.ingredientId === ingredientId);
    return (item?.quantity ?? 0) >= (quantity ?? 0);
  });
}

function hasUpgrade(state: GameState, upgradeId: UpgradeId) {
  return state.upgrades.some((upgrade) => upgrade.id === upgradeId && upgrade.purchased);
}

function withLog(state: GameState, message: string): GameState {
  return { ...state, eventLog: [message, ...state.eventLog] };
}

function sum(values: number[]) {
  return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
}
