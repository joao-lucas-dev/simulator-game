import { ingredients } from "@/lib/game/data";
import { timeLabel } from "@/lib/game/engine";
import type { GameStore } from "@/lib/game/store";
import type { FeedbackReason, IngredientId, Order } from "@/lib/game/types";
import type { ChartDataPoint, GameWarning, MarketSelection } from "./types";

export const marketColors: Record<IngredientId, string> = {
  dough: "#ff1934",
  sauce: "#111111",
  cheese: "#d97706",
  pepperoni: "#16a34a",
  box: "#2563eb"
};

export function getWarnings(
  game: GameStore,
  contacts: Order[],
  activeOrders: Order[],
  missingToOpen: string[]
): GameWarning[] {
  const warnings: GameWarning[] = [];
  const urgentContacts = contacts.filter((order) => (order.contactExpiresAt ?? 0) - game.minute <= 5).length;

  if (!game.shopOpen && missingToOpen.length > 0) {
    warnings.push({
      title: "Estoque minimo para abrir",
      description: `Compre antes: ${missingToOpen.join(", ")}.`,
      type: "destructive",
      action: "inventory"
    });
  }
  if (urgentContacts > 0) {
    warnings.push({
      title: "Cliente esperando",
      description: `${urgentContacts} mensagem(ns) estao perto de expirar no inbox.`,
      type: "destructive"
    });
  }
  if (game.reputation < 35) {
    warnings.push({
      title: "Loja nova",
      description: "Com reputacao baixa, poucos clientes vao chamar no comeco.",
      type: "default"
    });
  }
  if (activeOrders.length >= 6) {
    warnings.push({
      title: "Operacao carregada",
      description: "Muitos pedidos ativos aumentam o risco de atraso.",
      type: "default"
    });
  }
  return warnings;
}

export function reputationLabel(reputation: number) {
  if (reputation < 20) return "critica";
  if (reputation < 35) return "loja nova";
  if (reputation < 60) return "normal";
  if (reputation < 80) return "boa";
  return "excelente";
}

export function reputationBreakdown(game: GameStore) {
  const scoreFor = (reason: FeedbackReason) =>
    game.feedback
      .filter((item) => item.reason === reason)
      .reduce((total, item) => total + item.reputationDelta, 0);

  return [
    {
      label: "Gosto da pizza",
      description: "Ainda sem avaliacao direta de sabor.",
      score: scoreFor("taste")
    },
    {
      label: "Entrega",
      description: "Entregas no prazo melhoram esta percepcao.",
      score: scoreFor("delivery")
    },
    {
      label: "Atraso na entrega",
      description: "Pedidos atrasados reduzem confianca.",
      score: scoreFor("late_delivery")
    },
    {
      label: "Demora na resposta",
      description: "Mensagens expiradas pesam contra a loja.",
      score: scoreFor("slow_response")
    },
    {
      label: "Pedidos recusados",
      description: "Recusas frustram clientes interessados.",
      score: scoreFor("rejected_order")
    }
  ];
}

export function buildMarketData(game: GameStore, selectedMarket: MarketSelection) {
  const dayHistory = game.marketHistory.filter((item) => item.day === game.day);
  const minutes = Array.from(new Set(dayHistory.map((item) => item.minute))).sort((a, b) => a - b);

  if (selectedMarket === "all") {
    return minutes.map((minute) => {
      const row: Record<string, string | number> = { time: timeLabel(minute) };
      ingredients.forEach((ingredient) => {
        const item = dayHistory.find((entry) => entry.minute === minute && entry.ingredientId === ingredient.id);
        row[ingredient.id] = item?.price ?? 0;
      });
      return row;
    });
  }

  return dayHistory
    .filter((item) => item.ingredientId === selectedMarket)
    .map((item) => ({
      time: timeLabel(item.minute),
      price: item.price
    }));
}

export function buildChartData(
  reports: { day: number; cashEnd: number; reputation: number }[],
  currentCash: number,
  currentReputation: number,
  currentDay: number
): ChartDataPoint[] {
  const previous = reports.map((report) => ({
    day: `D${report.day}`,
    cash: report.cashEnd,
    reputation: report.reputation
  }));

  return [...previous, { day: `D${currentDay}`, cash: currentCash, reputation: currentReputation }];
}
