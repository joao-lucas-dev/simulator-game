"use client";

import { buildChartData, getWarnings } from "@/components/game/game-view-models";
import { InventoryPanel } from "@/components/game/inventory-panel";
import { OperationPanel } from "@/components/game/operation-panel";
import { ReportsPanel } from "@/components/game/reports-panel";
import { SpeedControl } from "@/components/game/shared";
import { StaffPanel } from "@/components/game/staff-panel";
import type { MarketSelection } from "@/components/game/types";
import { UpgradesPanel } from "@/components/game/upgrades-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { availableMotoboys, getOpeningStockMissing, timeLabel } from "@/lib/game/engine";
import { useGameStore } from "@/lib/game/store";
import { formatMoney } from "@/lib/utils";
import {
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Package,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  TimerReset,
  Users,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const game = useGameStore();
  const [activeTab, setActiveTab] = useState("operation");
  const [selectedMarket, setSelectedMarket] = useState<MarketSelection>("all");

  const { shopOpen, isRunning, speed, advanceTime } = game;

  const contacts = game.orders.filter((order) => order.status === "contacting");
  const activeOrders = game.orders.filter((order) =>
    ["accepted", "baking", "ready", "delivering"].includes(order.status)
  );
  const missingToOpen = getOpeningStockMissing(game);
  const warnings = getWarnings(game, contacts, activeOrders, missingToOpen);
  const chartData = buildChartData(game.reports, game.cash, game.reputation, game.day);
  const available = availableMotoboys(game);
  const hasActiveOrders = activeOrders.length > 0;
  const canRunClock = shopOpen || hasActiveOrders;
  const canOpenShop = !shopOpen && !hasActiveOrders && missingToOpen.length === 0;

  useEffect(() => {
    if (!canRunClock || !isRunning) return;
    const interval = window.setInterval(() => advanceTime(speed), 1000);
    return () => window.clearInterval(interval);
  }, [advanceTime, canRunClock, isRunning, speed]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen bg-[#f7f7f7] text-[#232323]">
      <nav aria-label="Menu principal" className="fixed left-4 top-4 z-50 flex flex-col gap-2">
        {navigationItems.map((item) => (
          <GameNavIcon
            key={item.value}
            item={item}
            active={activeTab === item.value}
            onSelect={() => setActiveTab(item.value)}
          />
        ))}
      </nav>

      <main className="min-w-0">
        <div className="px-4 pb-56 pl-24 pt-5 sm:pb-44 lg:px-10 lg:pb-36 lg:pl-28">
          <div className="mx-auto max-w-[1240px]">
            <section className="mb-6">
              <div>
                <h1 className="text-[28px] font-semibold leading-tight tracking-normal text-[#2b2b2b]">
                  Operacao da loja
                </h1>
                <p className="mt-2 text-[15px] text-[#767676]">
                  Siga o fluxo do pedido do inbox ate a entrega.
                </p>
              </div>
            </section>

            {warnings.length > 0 && (
              <div className="mb-6 grid gap-3 lg:grid-cols-2">
                {warnings.map((warning) => (
                  <Alert key={warning.title} variant={warning.type}>
                    <ShieldCheck className="mb-2 h-4 w-4" />
                    <AlertTitle>{warning.title}</AlertTitle>
                    <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                      <span>{warning.description}</span>
                      {warning.action === "inventory" && (
                        <Button size="sm" variant="outline" onClick={() => setActiveTab("inventory")}>
                          Ir para estoque
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <TabsContent value="operation" className="mt-0">
              <OperationPanel game={game} contacts={contacts} />
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              <InventoryPanel game={game} selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} />
            </TabsContent>

            <TabsContent value="staff" className="mt-0">
              <StaffPanel game={game} />
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              <ReportsPanel game={game} chartData={chartData} />
            </TabsContent>

            <TabsContent value="upgrades" className="mt-0">
              <UpgradesPanel game={game} />
            </TabsContent>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#dedede] bg-white/95 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-3 lg:px-8">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <BottomMetric icon={CircleDollarSign} label="Caixa atual" value={formatMoney(game.cash)} />
            <BottomMetric icon={Clock} label="Hora" value={`Dia ${game.day}, ${timeLabel(game.minute)}`} />
            <BottomMetric icon={ShieldCheck} label="Reputacao" value={`${game.reputation}/100`} />
            <BottomMetric icon={Users} label="Motoboys" value={`${available}/${game.motoboys} disponiveis`} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={shopOpen ? "mr-auto flex items-center gap-2 text-sm font-semibold text-emerald-700" : "mr-auto flex items-center gap-2 text-sm font-semibold text-[#d7192d]"}>
              <span className={shopOpen ? "h-2.5 w-2.5 rounded-full bg-emerald-500" : "h-2.5 w-2.5 rounded-full bg-[#ff1934]"} />
              {shopOpen ? "Loja aberta" : "Loja fechada"}
            </div>

            {!canRunClock ? (
              <Button
                className="border border-[#ff1934] bg-white text-[#ff1934] hover:bg-red-50"
                disabled={!canOpenShop}
                onClick={game.openShop}
              >
                <Play className="mr-2 h-4 w-4" />
                Abrir loja
              </Button>
            ) : (
              <Button className="border border-[#ff1934] bg-white text-[#ff1934] hover:bg-red-50" onClick={game.toggleRunning}>
                {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isRunning ? "Pausar" : "Continuar"}
              </Button>
            )}

            <SpeedControl game={game} />

            <Button
              className="border border-[#ff1934] bg-white text-[#ff1934] hover:bg-red-50 disabled:border-[#d8d8d8] disabled:text-[#999]"
              disabled={hasActiveOrders}
              onClick={game.endDay}
            >
              <TimerReset className="mr-2 h-4 w-4" />
              Fechar dia
            </Button>
            <Button variant="ghost" className="text-[#ff1934] hover:bg-red-50 hover:text-[#ff1934]" onClick={game.resetGame}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>
        </div>
      </footer>
    </Tabs>
  );
}

const navigationItems = [
  { value: "operation", icon: BarChart3, label: "Operacao" },
  { value: "inventory", icon: Package, label: "Estoque e mercado" },
  { value: "staff", icon: BriefcaseBusiness, label: "Funcionarios" },
  { value: "reports", icon: ClipboardList, label: "Relatorio" },
  { value: "upgrades", icon: Wrench, label: "Melhorias" }
] as const;

function GameNavIcon({
  item,
  active,
  onSelect
}: {
  item: (typeof navigationItems)[number];
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      aria-label={item.label}
      title={item.label}
      className={
        active
          ? "grid h-14 w-14 place-items-center rounded-md border-2 border-[#ff1934] bg-[#ff1934] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#e9162f] focus:outline-none focus:ring-2 focus:ring-[#ff1934] focus:ring-offset-2"
          : "grid h-14 w-14 place-items-center rounded-md border-2 border-[#ff1934] bg-transparent text-[#ff1934] shadow-sm transition-transform hover:scale-105 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-[#ff1934] focus:ring-offset-2"
      }
      onClick={onSelect}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function BottomMetric({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-md border border-[#e8e8e8] bg-[#fbfbfb] px-3 py-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-red-50 text-[#ff1934]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase text-[#777]">{label}</div>
        <div className="truncate text-sm font-semibold text-[#2b2b2b]">{value}</div>
      </div>
    </div>
  );
}
