"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bike,
  CircleDollarSign,
  Clock,
  Flame,
  LineChart,
  MessageCircle,
  Package,
  Pause,
  Pizza,
  Play,
  RotateCcw,
  ShoppingCart,
  Star,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Wrench
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
import { dayLength, ingredients } from "@/lib/game/data";
import { ingredientById, recipeById, timeLabel } from "@/lib/game/engine";
import { useGameStore, type GameStore } from "@/lib/game/store";
import type { IngredientId, Order } from "@/lib/game/types";

const quickBuyOptions = [1, 5, 10];
const speedOptions = [1, 2, 3] as const;

export default function Home() {
  const game = useGameStore();
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientId>("dough");

  useEffect(() => {
    if (!game.shopOpen || !game.isRunning) return;
    const interval = window.setInterval(() => {
      game.advanceTime(game.speed);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [game, game.shopOpen, game.isRunning, game.speed]);

  const contacts = game.orders.filter((order) => order.status === "contacting");
  const activeOrders = game.orders.filter((order) =>
    ["accepted", "baking", "ready", "delivering"].includes(order.status)
  );
  const warnings = getWarnings(game, contacts, activeOrders);
  const chartData = buildChartData(game.reports, game.cash, game.reputation, game.day);

  return (
    <main className="min-h-screen">
      <section className="border-b border-red-950/20 bg-gradient-to-br from-red-950 via-red-800 to-red-700 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-yellow-200">
                <Pizza className="h-4 w-4" />
                Pizzaria do Dono
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                Central da noite
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-red-50">
                Compre estoque, abra a loja, responda clientes no chat e acompanhe forno,
                motoboys e mercado em tempo real.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!game.shopOpen ? (
                <Button className="bg-yellow-400 text-stone-950 hover:bg-yellow-300" onClick={game.openShop}>
                  <Play className="mr-2 h-4 w-4" />
                  Abrir loja
                </Button>
              ) : (
                <Button variant="secondary" onClick={game.toggleRunning}>
                  {game.isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {game.isRunning ? "Pausar" : "Continuar"}
                </Button>
              )}
              <div className="flex rounded-md border border-white/20 bg-white/10 p-1">
                {speedOptions.map((speed) => (
                  <Button
                    key={speed}
                    size="sm"
                    variant={game.speed === speed ? "accent" : "ghost"}
                    className={game.speed === speed ? "" : "text-white hover:bg-white/15 hover:text-white"}
                    onClick={() => game.setSpeed(speed)}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
              <Button variant="secondary" onClick={game.endDay}>
                <TimerReset className="mr-2 h-4 w-4" />
                Fechar dia
              </Button>
              <Button className="text-white hover:bg-white/15 hover:text-white" variant="ghost" onClick={game.resetGame}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reiniciar
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <HeroMetric icon={CircleDollarSign} label="Caixa" value={formatMoney(game.cash)} />
            <HeroMetric icon={Star} label="Reputacao" value={`${game.reputation}/100`} />
            <HeroMetric icon={Clock} label="Horario" value={`Dia ${game.day}, ${timeLabel(game.minute)}`} />
            <HeroMetric icon={MessageCircle} label="Inbox" value={String(contacts.length)} />
            <HeroMetric icon={ShoppingCart} label="Pedidos" value={String(activeOrders.length)} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {warnings.length > 0 && (
          <div className="mb-5 grid gap-3 lg:grid-cols-2">
            {warnings.map((warning) => (
              <Alert key={warning.title} variant={warning.type}>
                <AlertTriangle className="mb-2 h-4 w-4" />
                <AlertTitle>{warning.title}</AlertTitle>
                <AlertDescription>{warning.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <Tabs defaultValue="operation" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start bg-stone-950 p-1 text-white">
            <TabsTrigger value="operation">Operacao</TabsTrigger>
            <TabsTrigger value="inventory">Estoque e mercado</TabsTrigger>
            <TabsTrigger value="reports">Relatorio</TabsTrigger>
            <TabsTrigger value="upgrades">Melhorias</TabsTrigger>
          </TabsList>

          <TabsContent value="operation">
            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.1fr_0.95fr]">
              <InboxPanel game={game} contacts={contacts} />
              <OrdersPanel game={game} />
              <div className="grid gap-5">
                <OvenPanel game={game} />
                <DeliveryPanel game={game} />
              </div>
            </div>
            <div className="mt-5">
              <EventLog events={game.eventLog} />
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryPanel
              game={game}
              selectedIngredient={selectedIngredient}
              setSelectedIngredient={setSelectedIngredient}
            />
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <ReportsPanel game={game} />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Evolucao
                  </CardTitle>
                  <CardDescription>Caixa e reputacao no fechamento dos dias.</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="cash" stroke="#b91c1c" fill="#b91c1c" fillOpacity={0.16} name="Caixa" />
                      <Area type="monotone" dataKey="reputation" stroke="#facc15" fill="#facc15" fillOpacity={0.2} name="Reputacao" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upgrades">
            <UpgradesPanel game={game} />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-red-100">{label}</p>
        <Icon className="h-5 w-5 text-yellow-300" />
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function InboxPanel({ game, contacts }: { game: GameStore; contacts: Order[] }) {
  return (
    <Card className="border-red-950/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Inbox dos clientes
        </CardTitle>
        <CardDescription>Responda em ate 15 minutos de jogo para nao perder reputacao.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {!game.shopOpen && (
          <EmptyState text="Abra a loja para comecar a receber mensagens." />
        )}
        {game.shopOpen && contacts.length === 0 && (
          <EmptyState text="Nenhuma mensagem aguardando resposta." />
        )}
        {contacts.map((order) => {
          const remaining = Math.max(0, (order.contactExpiresAt ?? game.minute) - game.minute);
          const urgent = remaining <= 5;
          return (
            <div key={order.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">{timeLabel(order.createdAt)} - {order.id}</div>
                </div>
                <Badge variant={urgent ? "destructive" : "accent"}>{remaining} min</Badge>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-950">
                {order.message}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="font-medium">{recipeById(order.recipeId).name}</span>
                  <span className="text-muted-foreground"> - {formatMoney(order.value)}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => game.acceptOrder(order.id)}>Aceitar</Button>
                  <Button size="sm" variant="outline" onClick={() => game.rejectOrder(order.id)}>Recusar</Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function OrdersPanel({ game }: { game: GameStore }) {
  const orders = game.orders.filter((order) => ["accepted", "baking", "ready"].includes(order.status));

  return (
    <Card className="border-red-950/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Pedidos em producao
        </CardTitle>
        <CardDescription>Controle preparo, forno e despacho antes do prazo prometido.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {orders.length === 0 && <EmptyState text="Nenhum pedido aceito em producao." />}
        {orders.map((order) => {
          const lateRisk = order.dueAt - game.minute <= 20;
          return (
            <div key={order.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{recipeById(order.recipeId).name}</span>
                    <OrderBadge order={order} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {order.customerName} - entrega ate {timeLabel(order.dueAt)}
                  </div>
                </div>
                <Badge variant={lateRisk ? "destructive" : "outline"}>
                  {Math.max(0, order.dueAt - game.minute)} min restantes
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {order.status === "accepted" && (
                  <Button size="sm" variant="accent" onClick={() => game.startBaking(order.id)}>
                    <Flame className="mr-2 h-4 w-4" />
                    Forno
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button size="sm" onClick={() => game.deliverOrder(order.id)}>
                    <Bike className="mr-2 h-4 w-4" />
                    Despachar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function OvenPanel({ game }: { game: GameStore }) {
  return (
    <Card className="border-red-950/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Forno
        </CardTitle>
        <CardDescription>As pizzas ficam prontas automaticamente quando o tempo termina.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {game.oven.map((slot) => {
          const recipe = slot.recipeId ? recipeById(slot.recipeId) : null;
          const order = slot.orderId ? game.orders.find((item) => item.id === slot.orderId) : null;
          const total = slot.startedAt !== null && slot.readyAt !== null ? slot.readyAt - slot.startedAt : 0;
          const progress = total > 0 && slot.startedAt !== null
            ? ((game.minute - slot.startedAt) / total) * 100
            : 0;

          return (
            <div key={slot.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{slot.id}</span>
                <Badge variant={slot.orderId ? "accent" : "secondary"}>
                  {slot.orderId ? "Assando" : "Livre"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {recipe && order ? `${recipe.name} para ${order.customerName}` : "Sem pizza no forno"}
              </div>
              <Progress className="mt-3" value={Math.max(0, Math.min(100, progress))} />
              {slot.readyAt !== null && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Pronto em {Math.max(0, slot.readyAt - game.minute)} min
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DeliveryPanel({ game }: { game: GameStore }) {
  const deliveries = game.orders.filter((order) => ["delivering", "delivered"].includes(order.status)).slice(0, 6);

  return (
    <Card className="border-red-950/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bike className="h-5 w-5 text-primary" />
          Entregas
        </CardTitle>
        <CardDescription>Pagamento e reputacao fecham quando o motoboy chega.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {deliveries.length === 0 && <EmptyState text="Nenhum motoboy em rota." />}
        {deliveries.map((order) => {
          const total = order.deliveryEta ?? 1;
          const elapsed = order.deliveryStartedAt !== undefined ? game.minute - order.deliveryStartedAt : total;
          const remaining = Math.max(0, (order.deliveryArrivesAt ?? game.minute) - game.minute);
          return (
            <div key={order.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{order.customerName}</div>
                  <div className="text-sm text-muted-foreground">{recipeById(order.recipeId).name}</div>
                </div>
                <OrderBadge order={order} />
              </div>
              {order.status === "delivering" && (
                <>
                  <Progress className="mt-3" value={Math.max(0, Math.min(100, (elapsed / total) * 100))} />
                  <div className="mt-2 text-xs text-muted-foreground">Motoboy chega em {remaining} min</div>
                </>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function InventoryPanel({
  game,
  selectedIngredient,
  setSelectedIngredient
}: {
  game: GameStore;
  selectedIngredient: IngredientId;
  setSelectedIngredient: (ingredientId: IngredientId) => void;
}) {
  const marketData = useMemo(
    () =>
      game.marketHistory
        .filter((item) => item.day === game.day && item.ingredientId === selectedIngredient)
        .map((item) => ({
          time: timeLabel(item.minute),
          price: item.price,
          changePercent: item.changePercent
        })),
    [game.marketHistory, game.day, selectedIngredient]
  );
  const selectedName = ingredientById(selectedIngredient).name;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Estoque e compras
          </CardTitle>
          <CardDescription>Comece zerado, compre antes de abrir e aproveite quedas de mercado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Preco atual</TableHead>
                <TableHead>Mercado</TableHead>
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
                      <button
                        className="text-left underline-offset-4 hover:underline"
                        onClick={() => setSelectedIngredient(ingredient.id)}
                      >
                        {ingredient.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(inventory?.quantity ?? 0) === 0 ? "destructive" : "secondary"}>
                        {inventory?.quantity ?? 0} {ingredient.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatMoney(price?.price ?? 0)}</TableCell>
                    <TableCell>
                      <Badge variant={change > 8 ? "destructive" : change < -5 ? "accent" : "outline"}>
                        {change > 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                        {change > 0 ? "+" : ""}
                        {change}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {quickBuyOptions.map((quantity) => (
                          <Button
                            key={quantity}
                            size="sm"
                            variant="outline"
                            onClick={() => game.buyIngredient(ingredient.id as IngredientId, quantity)}
                          >
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
              <Button className="mt-4" variant="secondary">
                Ver receitas
              </Button>
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
                      <div className="mt-1 text-sm text-muted-foreground">
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
            <LineChart className="h-5 w-5 text-primary" />
            Mercado do dia
          </CardTitle>
          <CardDescription>Oscilacao intradiaria de {selectedName}. Atualiza a cada 30 minutos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {ingredients.map((ingredient) => (
              <Button
                key={ingredient.id}
                size="sm"
                variant={selectedIngredient === ingredient.id ? "default" : "outline"}
                onClick={() => setSelectedIngredient(ingredient.id)}
              >
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
                <Tooltip formatter={(value, name) => [name === "price" ? formatMoney(Number(value)) : `${value}%`, name === "price" ? "Preco" : "Oscilacao"]} />
                <Line type="monotone" dataKey="price" stroke="#b91c1c" strokeWidth={3} dot={{ r: 4 }} name="Preco" />
                <Line type="monotone" dataKey="changePercent" stroke="#d97706" strokeWidth={2} dot={false} name="Oscilacao" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsPanel({ game }: { game: GameStore }) {
  const latest = game.reports.at(-1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Relatorio diario
        </CardTitle>
        <CardDescription>Feche o dia para registrar o resultado.</CardDescription>
      </CardHeader>
      <CardContent>
        {latest ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ReportValue label="Dia" value={String(latest.day)} />
            <ReportValue label="Receita" value={formatMoney(latest.revenue)} />
            <ReportValue label="Custos" value={formatMoney(latest.costs)} />
            <ReportValue label="Lucro" value={formatMoney(latest.profit)} />
            <ReportValue label="Aceitos" value={String(latest.accepted)} />
            <ReportValue label="Entregues" value={String(latest.delivered)} />
            <ReportValue label="Reclamacoes" value={String(latest.complaints)} />
            <ReportValue label="Caixa final" value={formatMoney(latest.cashEnd)} />
          </div>
        ) : (
          <EmptyState text="Nenhum dia foi encerrado ainda." />
        )}
      </CardContent>
    </Card>
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
                  <Wrench className="h-5 w-5 text-primary" />
                  {upgrade.name}
                </span>
                <Badge variant={upgrade.purchased ? "default" : locked ? "outline" : "accent"}>
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

function EventLog({ events }: { events: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historico do turno</CardTitle>
        <CardDescription>Ultimos eventos operacionais.</CardDescription>
      </CardHeader>
      <CardContent className="max-h-72 overflow-auto">
        <div className="grid gap-2">
          {events.slice(0, 14).map((event, index) => (
            <div key={`${event}-${index}`} className="rounded-md bg-muted px-3 py-2 text-sm">
              {event}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderBadge({ order }: { order: Order }) {
  const statusMap: Record<Order["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "accent" }> = {
    contacting: { label: "Chat", variant: "accent" },
    waiting: { label: "Novo", variant: "outline" },
    accepted: { label: "Aceito", variant: "secondary" },
    baking: { label: "Forno", variant: "accent" },
    ready: { label: "Pronto", variant: "default" },
    delivering: { label: "Em rota", variant: "accent" },
    delivered: { label: "Entregue", variant: "default" },
    rejected: { label: "Recusado", variant: "outline" },
    expired: { label: "Expirou", variant: "destructive" },
    failed: { label: "Perdido", variant: "destructive" }
  };
  const item = statusMap[order.status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

function ReportValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function getWarnings(game: GameStore, contacts: Order[], activeOrders: Order[]) {
  const warnings: { title: string; description: string; type: "default" | "destructive" }[] = [];
  const emptyIngredients = game.inventory.filter((item) => item.quantity === 0).length;
  const urgentContacts = contacts.filter((order) => (order.contactExpiresAt ?? 0) - game.minute <= 5).length;

  if (!game.shopOpen) {
    warnings.push({
      title: "Loja fechada",
      description: "Compre insumos e abra a loja para iniciar o relogio e receber clientes.",
      type: "default"
    });
  }
  if (emptyIngredients > 0) {
    warnings.push({
      title: "Estoque zerado",
      description: `${emptyIngredients} insumo(s) estao zerados. Pedidos podem travar no forno.`,
      type: "destructive"
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
      title: "Reputacao baixa",
      description: "Menos clientes vao chamar enquanto a reputacao estiver baixa.",
      type: "destructive"
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

  return [
    ...previous,
    { day: `D${currentDay}`, cash: currentCash, reputation: currentReputation }
  ];
}
