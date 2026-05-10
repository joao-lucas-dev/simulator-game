"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Bike,
  BriefcaseBusiness,
  CircleDollarSign,
  CircleHelp,
  ClipboardList,
  Clock,
  Flame,
  LineChart,
  HeartCrack,
  MessageCircle,
  Package,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  TimerReset,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatMoney } from "@/lib/utils";
import {
  dayLength,
  dailyOverheadCosts,
  ingredients,
  motoboyDailyCost,
  motoboyHireCost
} from "@/lib/game/data";
import {
  availableMotoboys,
  getOpeningStockMissing,
  ingredientById,
  recipeById,
  timeLabel
} from "@/lib/game/engine";
import { useGameStore, type GameStore } from "@/lib/game/store";
import type { IngredientId, Order } from "@/lib/game/types";

type MarketSelection = IngredientId | "all";

const quickBuyOptions = [1, 5, 10];
const speedOptions = [1, 2, 3] as const;
const marketColors: Record<IngredientId, string> = {
  dough: "#ff1934",
  sauce: "#111111",
  cheese: "#d97706",
  pepperoni: "#16a34a",
  box: "#2563eb"
};

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
              <OperationKanban game={game} contacts={contacts} />
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

function SidebarTab({ value, icon: Icon, label }: { value: string; icon: LucideIcon; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="mx-0 justify-start rounded-none border-l-4 border-transparent px-5 py-4 text-[15px] font-medium text-[#161616] shadow-none data-[state=active]:border-[#ff1934] data-[state=active]:bg-red-50 data-[state=active]:text-[#ff1934] data-[state=active]:shadow-none"
    >
      <Icon className="mr-3 h-5 w-5" />
      {label}
    </TabsTrigger>
  );
}

function MobileTab({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger value={value} className="rounded-md text-xs data-[state=active]:bg-[#ff1934] data-[state=active]:text-white">
      {label}
    </TabsTrigger>
  );
}

function SpeedControl({ game }: { game: GameStore }) {
  return (
    <div className="flex rounded-md border border-[#e5e5e5] bg-white p-1">
      {speedOptions.map((speed) => (
        <Button
          key={speed}
          size="sm"
          variant="ghost"
          className={game.speed === speed ? "bg-[#ff1934] text-white hover:bg-[#e9162f] hover:text-white" : "text-[#565656] hover:bg-[#f3f3f3]"}
          onClick={() => game.setSpeed(speed)}
        >
          {speed}x
        </Button>
      ))}
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-[#e8e8e8] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[#777]">{label}</div>
        <Icon className="h-4 w-4 text-[#ff1934]" />
      </div>
      <div className="mt-2 text-xl font-semibold text-[#2b2b2b]">{value}</div>
      {hint && <div className="mt-1 text-xs text-[#888]">{hint}</div>}
    </div>
  );
}

function ReputationCard({ game }: { game: GameStore }) {
  const breakdown = reputationBreakdown(game);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="rounded-md border border-[#e8e8e8] bg-white p-4 text-left transition-colors hover:border-[#ff1934]/40">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[#777]">Reputacao</div>
            <Star className="h-4 w-4 text-[#ff1934]" />
          </div>
          <div className="mt-2 text-xl font-semibold text-[#2b2b2b]">{game.reputation}/100</div>
          <div className="mt-1 text-xs text-[#888]">{reputationLabel(game.reputation)}</div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Por que a reputacao esta assim?</DialogTitle>
          <DialogDescription>Resumo dos sinais recentes dos clientes.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-[#777]">{item.description}</div>
              </div>
              <Badge variant={item.score < 0 ? "destructive" : item.score > 0 ? "default" : "outline"}>
                {item.score > 0 ? "+" : ""}
                {item.score}
              </Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StaffPanel({ game }: { game: GameStore }) {
  const available = availableMotoboys(game);
  const delivering = game.orders.filter((order) => order.status === "delivering").length;
  const dailyTotal = game.motoboys * motoboyDailyCost;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Motoboys
          </CardTitle>
          <CardDescription>Gerencie a capacidade de entrega da loja.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <ReportValue label="Contratados" value={String(game.motoboys)} />
            <ReportValue label="Disponiveis" value={String(available)} />
            <ReportValue label="Em rota" value={String(delivering)} />
          </div>
          <div className="mt-5 rounded-md border border-[#ededed] bg-[#fbfbfb] p-4">
            <div className="text-sm font-medium">Contratar motoboy</div>
            <div className="mt-1 text-sm text-[#777]">
              Custo imediato de {formatMoney(motoboyHireCost)} e diaria de {formatMoney(motoboyDailyCost)} por dia.
            </div>
            <Button className="mt-4" onClick={game.hireMotoboy} disabled={game.cash < motoboyHireCost}>
              <UserPlus className="mr-2 h-4 w-4" />
              Contratar motoboy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custos da equipe</CardTitle>
          <CardDescription>Descontados ao fechar o dia.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ReportValue label="Diaria por motoboy" value={formatMoney(motoboyDailyCost)} />
          <ReportValue label="Total diario atual" value={formatMoney(dailyTotal)} />
          <ReportValue label="Custo de contratacao" value={formatMoney(motoboyHireCost)} />
        </CardContent>
      </Card>
    </div>
  );
}

function OperationKanban({ game, contacts }: { game: GameStore; contacts: Order[] }) {
  const waiting = game.orders.filter((order) => order.status === "accepted");
  const baking = game.orders.filter((order) => order.status === "baking");
  const ready = game.orders.filter((order) => order.status === "ready");
  const delivering = game.orders.filter((order) => order.status === "delivering");
  const lostContacts = game.orders.filter((order) => ["rejected", "expired"].includes(order.status)).slice(0, 3);
  const available = availableMotoboys(game);
  const busyOvens = game.oven.filter((slot) => slot.orderId).length;
  const freeOvens = game.oven.filter((slot) => !slot.orderId);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <KanbanColumn title="Inbox" icon={MessageCircle} count={contacts.length}>
        {!game.shopOpen && <EmptyState text="Abra a loja para receber mensagens." />}
        {game.shopOpen && contacts.length === 0 && <EmptyState text="Nenhum cliente aguardando." />}
        {contacts.map((order) => (
          <OrderCard key={order.id} game={game} order={order} action="inbox" />
        ))}
        {lostContacts.map((order) => (
          <div key={order.id} className="rounded-md border border-red-100 bg-red-50 p-4 text-sm text-[#7f1d1d]">
            <div className="flex items-center gap-2 font-medium">
              <HeartCrack className="h-4 w-4" />
              {order.customerName} ficou chateado
            </div>
            <div className="mt-1 text-xs">
              {order.status === "expired" ? "Demora na resposta" : "Pedido recusado"}
            </div>
          </div>
        ))}
      </KanbanColumn>

      <KanbanColumn title="Aguardando forno" icon={ClipboardList} count={waiting.length}>
        {waiting.length === 0 && <EmptyState text="Nenhum pedido aceito." />}
        {waiting.map((order) => (
          <OrderCard key={order.id} game={game} order={order} action="oven" />
        ))}
      </KanbanColumn>

      <KanbanColumn title="No forno" icon={Flame} count={baking.length} subtitle={`${busyOvens}/${game.oven.length} fornos ocupados`}>
        {baking.length === 0 && <EmptyState text="Forno sem pedidos." />}
        {baking.map((order) => (
          <OrderCard key={order.id} game={game} order={order} action="baking" />
        ))}
        {freeOvens.map((slot) => (
          <div key={slot.id} className="rounded-md border border-dashed border-[#dedede] bg-white p-4 text-sm text-[#777]">
            {slot.id} livre
          </div>
        ))}
      </KanbanColumn>

      <KanbanColumn title="Pronto para despacho" icon={Package} count={ready.length}>
        {ready.length === 0 && <EmptyState text="Nada pronto para despachar." />}
        {ready.map((order) => (
          <OrderCard key={order.id} game={game} order={order} action="dispatch" />
        ))}
      </KanbanColumn>

      <KanbanColumn title="Em entrega" icon={Bike} count={delivering.length} subtitle={`${available}/${game.motoboys} motoboys livres`}>
        <div className="hidden">
          <div className="text-sm font-medium">Equipe de motoboys</div>
          <div className="mt-1 text-xs text-[#777]">
            Contratar: {formatMoney(motoboyHireCost)} · Diaria: {formatMoney(motoboyDailyCost)}
          </div>
          <Button className="mt-3 w-full" size="sm" variant="outline" onClick={game.hireMotoboy} disabled={game.cash < motoboyHireCost}>
            <UserPlus className="mr-2 h-4 w-4" />
            Contratar motoboy
          </Button>
        </div>
        {delivering.length === 0 && <EmptyState text="Nenhum motoboy em rota." />}
        {delivering.map((order) => (
          <OrderCard key={order.id} game={game} order={order} action="delivering" />
        ))}
      </KanbanColumn>
    </div>
  );
}

function KanbanColumn({
  title,
  icon: Icon,
  count,
  subtitle,
  children
}: {
  title: string;
  icon: LucideIcon;
  count: number;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-h-[420px] rounded-md border border-[#e8e8e8] bg-[#fbfbfb]">
      <div className="border-b border-[#ececec] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#2b2b2b]">
            <Icon className="h-4 w-4 text-[#ff1934]" />
            {title}
          </h2>
          <Badge variant="outline">{count}</Badge>
        </div>
        {subtitle && <div className="mt-1 text-xs text-[#777]">{subtitle}</div>}
      </div>
      <div className="grid gap-3 p-3">{children}</div>
    </section>
  );
}

function OrderCard({ game, order, action }: { game: GameStore; order: Order; action: "inbox" | "oven" | "baking" | "dispatch" | "delivering" }) {
  const recipe = recipeById(order.recipeId);
  const remaining = Math.max(0, order.dueAt - game.minute);
  const ovenSlot = game.oven.find((slot) => slot.orderId === order.id);
  const bakeTotal = ovenSlot?.startedAt !== null && ovenSlot?.readyAt !== null && ovenSlot?.startedAt !== undefined && ovenSlot?.readyAt !== undefined
    ? ovenSlot.readyAt - ovenSlot.startedAt
    : 0;
  const bakeProgress = bakeTotal > 0 && ovenSlot?.startedAt !== null && ovenSlot?.startedAt !== undefined
    ? ((game.minute - ovenSlot.startedAt) / bakeTotal) * 100
    : 0;
  const deliveryTotal = order.deliveryEta ?? 1;
  const deliveryElapsed = order.deliveryStartedAt !== undefined ? game.minute - order.deliveryStartedAt : 0;
  const deliveryRemaining = Math.max(0, (order.deliveryArrivesAt ?? game.minute) - game.minute);
  const motoboyAvailable = availableMotoboys(game) > 0;

  return (
    <div className="rounded-md border border-[#ededed] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[#2b2b2b]">{order.customerName}</div>
          <div className="mt-1 text-sm text-[#666]">{recipe.name}</div>
        </div>
        <OrderBadge order={order} />
      </div>
      <div className="mt-3 grid gap-1 text-xs text-[#777]">
        <span>{formatMoney(order.value)}</span>
        <span className={remaining <= 20 ? "font-medium text-[#ff1934]" : ""}>Prazo: {timeLabel(order.dueAt)} ({remaining} min)</span>
      </div>

      {action === "inbox" && (
        <>
          <div className="mt-3 rounded-md bg-[#f6f6f6] px-3 py-2 text-sm text-[#333]">{order.message}</div>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" size="sm" onClick={() => game.acceptOrder(order.id)}>Aceitar</Button>
            <Button className="flex-1" size="sm" variant="outline" onClick={() => game.rejectOrder(order.id)}>Recusar</Button>
          </div>
        </>
      )}

      {action === "oven" && (
        <Button className="mt-3 w-full" size="sm" onClick={() => game.startBaking(order.id)}>
          <Flame className="mr-2 h-4 w-4" />
          Enviar ao forno
        </Button>
      )}

      {action === "baking" && (
        <div className="mt-3">
          <Progress value={Math.max(0, Math.min(100, bakeProgress))} />
          <div className="mt-2 text-xs text-[#777]">Assando no forno.</div>
        </div>
      )}

      {action === "dispatch" && (
        <Button className="mt-3 w-full" size="sm" onClick={() => game.deliverOrder(order.id)} disabled={!motoboyAvailable}>
          <Bike className="mr-2 h-4 w-4" />
          {motoboyAvailable ? "Despachar" : "Sem motoboy livre"}
        </Button>
      )}

      {action === "delivering" && (
        <div className="mt-3">
          <Progress value={Math.max(0, Math.min(100, (deliveryElapsed / deliveryTotal) * 100))} />
          <div className="mt-2 text-xs text-[#777]">Chega em {deliveryRemaining} min</div>
        </div>
      )}
    </div>
  );
}

function InventoryPanel({
  game,
  selectedMarket,
  setSelectedMarket
}: {
  game: GameStore;
  selectedMarket: MarketSelection;
  setSelectedMarket: (selection: MarketSelection) => void;
}) {
  const marketData = useMemo(() => buildMarketData(game, selectedMarket), [game, selectedMarket]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Estoque
          </CardTitle>
          <CardDescription>Compre insumos antes de abrir a loja.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Preco</TableHead>
                <TableHead>Oscilacao</TableHead>
                <TableHead className="text-right">Comprar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient) => {
                const inventory = game.inventory.find((item) => item.ingredientId === ingredient.id);
                const price = game.prices.find((item) => item.ingredientId === ingredient.id);
                const change = price?.changePercent ?? 0;

                return (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      <button className="text-left hover:text-[#ff1934]" onClick={() => setSelectedMarket(ingredient.id)}>
                        {ingredient.name}
                      </button>
                    </TableCell>
                    <TableCell>{inventory?.quantity ?? 0} {ingredient.unit}</TableCell>
                    <TableCell>{formatMoney(price?.price ?? 0)}</TableCell>
                    <TableCell>
                      <span className={change > 0 ? "inline-flex items-center text-sm font-medium text-[#ff1934]" : change < 0 ? "inline-flex items-center text-sm font-medium text-emerald-600" : "inline-flex items-center text-sm text-[#777]"}>
                        {change > 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                        {change > 0 ? "+" : ""}
                        {change}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {quickBuyOptions.map((quantity) => (
                          <Button key={quantity} size="sm" variant="outline" onClick={() => game.buyIngredient(ingredient.id, quantity)}>
                            +{quantity}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4" variant="outline">Ver receitas</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Receitas do cardapio</DialogTitle>
                <DialogDescription>Consumo de insumos por pedido preparado.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                {["margherita", "pepperoni", "house"].map((recipeId) => {
                  const recipe = recipeById(recipeId as never);
                  return (
                    <div key={recipe.id} className="rounded-md border p-3">
                      <div className="font-medium">{recipe.name}</div>
                      <div className="mt-1 text-sm text-[#777]">
                        {Object.entries(recipe.ingredients)
                          .map(([ingredientId, quantity]) => `${quantity} ${ingredientById(ingredientId as IngredientId).name}`)
                          .join(", ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Mercado do dia
          </CardTitle>
          <CardDescription>
            {selectedMarket === "all" ? "Todos os ingredientes." : `Oscilacao de ${ingredientById(selectedMarket).name}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button size="sm" variant={selectedMarket === "all" ? "default" : "outline"} onClick={() => setSelectedMarket("all")}>
              Todos
            </Button>
            {ingredients.map((ingredient) => (
              <Button key={ingredient.id} size="sm" variant={selectedMarket === ingredient.id ? "default" : "outline"} onClick={() => setSelectedMarket(ingredient.id)}>
                {ingredient.name}
              </Button>
            ))}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={marketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value, name) => [formatMoney(Number(value)), String(name)]} />
                {selectedMarket === "all" ? (
                  ingredients.map((ingredient) => (
                    <Line key={ingredient.id} type="monotone" dataKey={ingredient.id} stroke={marketColors[ingredient.id]} strokeWidth={2} dot={false} name={ingredient.name} />
                  ))
                ) : (
                  <Line type="monotone" dataKey="price" stroke="#ff1934" strokeWidth={3} dot={{ r: 4 }} name="Preco" />
                )}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsPanel({ game, chartData }: { game: GameStore; chartData: { day: string; cash: number; reputation: number }[] }) {
  const latest = game.reports.at(-1);
  const deliveredOrders = game.orders.filter((order) => order.status === "delivered");
  const dayRevenue = deliveredOrders.reduce((total, order) => total + order.value, 0);
  const averageTicket = deliveredOrders.length > 0 ? dayRevenue / deliveredOrders.length : 0;
  const currentCosts = Math.abs(game.ledger.filter((entry) => entry.day === game.day && entry.amount < 0).reduce((total, entry) => total + entry.amount, 0));
  const laborCosts = Math.abs(game.ledger.filter((entry) => entry.day === game.day && entry.type === "labor").reduce((total, entry) => total + entry.amount, 0));
  const overheadCosts = Math.abs(game.ledger.filter((entry) => entry.day === game.day && entry.type === "overhead").reduce((total, entry) => total + entry.amount, 0));
  const projectedOverhead = dailyOverheadCosts.reduce((total, cost) => total + cost.amount, 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Relatorio
          </CardTitle>
          <CardDescription>Vendas, custos e caixa da operacao.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <ReportValue label="Vendas do dia" value={String(deliveredOrders.length)} />
            <ReportValue label="Valor total" value={formatMoney(dayRevenue)} />
            <ReportValue label="Ticket medio" value={formatMoney(averageTicket)} />
          </div>
          {latest ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ReportValue label="Ultimo dia" value={String(latest.day)} />
              <ReportValue label="Receita" value={formatMoney(latest.revenue)} />
              <ReportValue label="Custos" value={formatMoney(latest.costs)} />
              <ReportValue label="Lucro" value={formatMoney(latest.profit)} />
              <ReportValue label="Entregues" value={String(latest.delivered)} />
              <ReportValue label="Caixa final" value={formatMoney(latest.cashEnd)} />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <ReportValue label="Custos do dia" value={formatMoney(currentCosts)} />
              <ReportValue label="Funcionarios" value={formatMoney(laborCosts)} />
              <ReportValue label="Custos fixos" value={formatMoney(overheadCosts)} />
              <ReportValue label="Fixos previstos" value={formatMoney(projectedOverhead)} />
              <ReportValue label="Caixa atual" value={formatMoney(game.cash)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Evolucao
          </CardTitle>
          <CardDescription>Caixa e reputacao por dia.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="cash" stroke="#ff1934" fill="#ff1934" fillOpacity={0.12} name="Caixa" />
              <Area type="monotone" dataKey="reputation" stroke="#111111" fill="#111111" fillOpacity={0.08} name="Reputacao" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function UpgradesPanel({ game }: { game: GameStore }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {game.upgrades.map((upgrade) => {
        const locked = upgrade.dayUnlock > game.day;
        const disabled = locked || upgrade.purchased || game.cash < upgrade.cost;
        return (
          <Card key={upgrade.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  {upgrade.name}
                </span>
                <Badge variant={upgrade.purchased ? "default" : locked ? "outline" : "destructive"}>
                  {upgrade.purchased ? "Comprado" : locked ? `Dia ${upgrade.dayUnlock}` : formatMoney(upgrade.cost)}
                </Badge>
              </CardTitle>
              <CardDescription>{upgrade.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={disabled} onClick={() => game.purchaseUpgrade(upgrade.id)}>
                Comprar melhoria
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function OrderBadge({ order }: { order: Order }) {
  const statusMap: Record<Order["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "accent" }> = {
    contacting: { label: "Chat", variant: "destructive" },
    waiting: { label: "Novo", variant: "outline" },
    accepted: { label: "Aceito", variant: "secondary" },
    baking: { label: "Forno", variant: "default" },
    ready: { label: "Pronto", variant: "default" },
    delivering: { label: "Em rota", variant: "default" },
    delivered: { label: "Entregue", variant: "secondary" },
    rejected: { label: "Recusado", variant: "outline" },
    expired: { label: "Expirou", variant: "destructive" },
    failed: { label: "Perdido", variant: "destructive" }
  };
  const item = statusMap[order.status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

function ReportValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ededed] p-4">
      <div className="text-xs font-medium uppercase text-[#888]">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-[#dedede] p-4 text-sm text-[#777]">{text}</div>;
}

function getWarnings(game: GameStore, contacts: Order[], activeOrders: Order[], missingToOpen: string[]) {
  const warnings: { title: string; description: string; type: "default" | "destructive"; action?: "inventory" }[] = [];
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

function reputationLabel(reputation: number) {
  if (reputation < 20) return "critica";
  if (reputation < 35) return "loja nova";
  if (reputation < 60) return "normal";
  if (reputation < 80) return "boa";
  return "excelente";
}

function reputationBreakdown(game: GameStore) {
  const scoreFor = (reason: string) =>
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

function buildMarketData(game: GameStore, selectedMarket: MarketSelection) {
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

function buildChartData(
  reports: { day: number; cashEnd: number; reputation: number }[],
  currentCash: number,
  currentReputation: number,
  currentDay: number
) {
  const previous = reports.map((report) => ({
    day: `D${report.day}`,
    cash: report.cashEnd,
    reputation: report.reputation
  }));

  return [...previous, { day: `D${currentDay}`, cash: currentCash, reputation: currentReputation }];
}
