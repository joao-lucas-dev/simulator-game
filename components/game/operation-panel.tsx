import type { ReactNode } from "react";
import {
  Bike,
  ClipboardList,
  Flame,
  HeartCrack,
  MessageCircle,
  Package,
  UserPlus,
  type LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motoboyDailyCost, motoboyHireCost } from "@/lib/game/data";
import { availableMotoboys, recipeById, timeLabel } from "@/lib/game/engine";
import type { GameStore } from "@/lib/game/store";
import type { Order, OvenSlot } from "@/lib/game/types";
import { formatMoney } from "@/lib/utils";
import { EmptyState, OrderBadge } from "./shared";

type OrderAction = "inbox" | "oven" | "baking" | "dispatch" | "delivering";

export function OperationPanel({ game, contacts }: { game: GameStore; contacts: Order[] }) {
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
        {baking.map((order) => (
          <OrderCard key={order.id} game={game} order={order} action="baking" />
        ))}
        {freeOvens.map((slot) => (
          <FreeOvenSlot key={slot.id} slot={slot} />
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
            Contratar: {formatMoney(motoboyHireCost)} - Diaria: {formatMoney(motoboyDailyCost)}
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

function OrderCard({ game, order, action }: { game: GameStore; order: Order; action: OrderAction }) {
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

function FreeOvenSlot({ slot }: { slot: OvenSlot }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-[#dedede] bg-white p-4 text-sm text-[#777]">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-red-50 text-[#ff1934]">
        <Flame className="h-4 w-4" />
      </span>
      <div>
        <div className="font-medium text-[#2b2b2b]">{ovenLabel(slot.id)}</div>
        <div className="text-xs text-[#888]">livre</div>
      </div>
    </div>
  );
}

function ovenLabel(id: string) {
  const match = id.match(/(\d+)$/);
  const number = match ? Number(match[1]) : 1;
  return number === 1 ? "forno pequeno" : `forno ${number}`;
}
