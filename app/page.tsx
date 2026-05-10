"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CircleDollarSign,
  CircleHelp,
  ClipboardList,
  Clock,
  Package,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  TimerReset,
  Users,
  Wrench
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { InventoryPanel } from "@/components/game/inventory-panel";
import { OperationPanel } from "@/components/game/operation-panel";
import { ReportsPanel } from "@/components/game/reports-panel";
import { ReputationCard, MobileTab, SidebarTab, SpeedControl, StatusCard } from "@/components/game/shared";
import { StaffPanel } from "@/components/game/staff-panel";
import type { MarketSelection } from "@/components/game/types";
import { UpgradesPanel } from "@/components/game/upgrades-panel";
import { buildChartData, getWarnings } from "@/components/game/game-view-models";
import { formatMoney } from "@/lib/utils";
import { availableMotoboys, getOpeningStockMissing, timeLabel } from "@/lib/game/engine";
import { useGameStore } from "@/lib/game/store";

export default function Home() {
  const game = useGameStore();
  const [activeTab, setActiveTab] = useState("operation");
  const [selectedMarket, setSelectedMarket] = useState<MarketSelection>("all");

  const { shopOpen, isRunning, speed, advanceTime } = game;

  useEffect(() => {
    if (!shopOpen || !isRunning) return;
    const interval = window.setInterval(() => advanceTime(speed), 1000);
    return () => window.clearInterval(interval);
  }, [advanceTime, isRunning, shopOpen, speed]);

  const contacts = game.orders.filter((order) => order.status === "contacting");
  const activeOrders = game.orders.filter((order) =>
    ["accepted", "baking", "ready", "delivering"].includes(order.status)
  );
  const missingToOpen = getOpeningStockMissing(game);
  const warnings = getWarnings(game, contacts, activeOrders, missingToOpen);
  const chartData = buildChartData(game.reports, game.cash, game.reputation, game.day);
  const available = availableMotoboys(game);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen bg-[#f7f7f7] text-[#232323] lg:grid lg:grid-cols-[262px_1fr]">
      <aside className="hidden border-r border-[#e5e5e5] bg-white lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-[#e5e5e5] px-5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-[#ff1934] text-white">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Pizzaria do Dono</div>
        </div>
        <div className="p-3">
          <div className={shopOpen ? "rounded-md border border-emerald-100 bg-emerald-50 p-4" : "rounded-md border border-red-100 bg-red-50 p-4"}>
            <div className="flex items-center gap-3">
              <span className={shopOpen ? "h-2.5 w-2.5 rounded-full bg-emerald-500" : "h-2.5 w-2.5 rounded-full bg-[#ff1934]"} />
              <span className={shopOpen ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-[#d7192d]"}>
                {shopOpen ? "Loja aberta" : "Loja fechada"}
              </span>
            </div>
          </div>
        </div>
        <TabsList className="flex h-auto flex-1 flex-col items-stretch justify-start rounded-none bg-transparent p-0 text-[#161616]">
          <SidebarTab value="operation" icon={BarChart3} label="Operacao" />
          <SidebarTab value="inventory" icon={Package} label="Estoque e mercado" />
          <SidebarTab value="staff" icon={BriefcaseBusiness} label="Funcionarios" />
          <SidebarTab value="reports" icon={ClipboardList} label="Relatorio" />
          <SidebarTab value="upgrades" icon={Wrench} label="Melhorias" />
        </TabsList>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-[#e5e5e5] bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-[#ff1934] text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">Pizzaria do Dono</span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <button className="hidden items-center gap-2 text-[#333] md:flex">
                <CircleHelp className="h-4 w-4" />
                Ajuda
              </button>
              <button className="relative text-[#333]" aria-label="Notificacoes">
                <Bell className="h-5 w-5" />
                {contacts.length > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[#ff1934] px-1.5 text-[10px] font-semibold leading-4 text-white">
                    {contacts.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-10">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-5 lg:hidden">
              <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-md bg-white p-2 text-[#161616] shadow-sm sm:grid-cols-4">
                <MobileTab value="operation" label="Operacao" />
                <MobileTab value="inventory" label="Estoque" />
                <MobileTab value="staff" label="Equipe" />
                <MobileTab value="reports" label="Relatorio" />
                <MobileTab value="upgrades" label="Melhorias" />
              </TabsList>
            </div>

            <section className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
              <div>
                <h1 className="text-[28px] font-semibold leading-tight tracking-normal text-[#2b2b2b]">
                  Operacao da loja
                </h1>
                <p className="mt-2 text-[15px] text-[#767676]">
                  Siga o fluxo do pedido do inbox ate a entrega.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!shopOpen ? (
                  <Button
                    className="border border-[#ff1934] bg-white text-[#ff1934] hover:bg-red-50"
                    disabled={missingToOpen.length > 0}
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
                {activeTab !== "inventory" && (
                  <Button className="border border-[#ff1934] bg-white text-[#ff1934] hover:bg-red-50" onClick={() => setActiveTab("inventory")}>
                    <Package className="mr-2 h-4 w-4" />
                    Ir para estoque
                  </Button>
                )}
                <SpeedControl game={game} />
                <Button className="border border-[#ff1934] bg-white text-[#ff1934] hover:bg-red-50" onClick={game.endDay}>
                  <TimerReset className="mr-2 h-4 w-4" />
                  Fechar dia
                </Button>
                <Button variant="ghost" className="text-[#ff1934] hover:bg-red-50 hover:text-[#ff1934]" onClick={game.resetGame}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reiniciar
                </Button>
              </div>
            </section>

            <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatusCard icon={CircleDollarSign} label="Caixa atual" value={formatMoney(game.cash)} />
              <StatusCard icon={Clock} label="Hora" value={`Dia ${game.day}, ${timeLabel(game.minute)}`} />
              <ReputationCard game={game} />
              <StatusCard icon={Users} label="Motoboys" value={`${available}/${game.motoboys}`} hint="disponiveis" />
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
    </Tabs>
  );
}
