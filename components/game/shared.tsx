import { Star, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsTrigger } from "@/components/ui/tabs";
import type { GameStore } from "@/lib/game/store";
import type { Order } from "@/lib/game/types";
import { reputationBreakdown, reputationLabel } from "./game-view-models";

const speedOptions = [1, 2, 3] as const;

export function SidebarTab({ value, icon: Icon, label }: { value: string; icon: LucideIcon; label: string }) {
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

export function MobileTab({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger value={value} className="rounded-md text-xs data-[state=active]:bg-[#ff1934] data-[state=active]:text-white">
      {label}
    </TabsTrigger>
  );
}

export function SpeedControl({ game }: { game: GameStore }) {
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

export function StatusCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
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

export function ReputationCard({ game }: { game: GameStore }) {
  const breakdown = reputationBreakdown(game);

  return (
    <div className="group relative rounded-md border border-[#e8e8e8] bg-white p-4 text-left transition-colors hover:border-[#ff1934]/40 focus-within:border-[#ff1934]/40">
      <button className="w-full text-left" aria-describedby="reputation-popover">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[#777]">Reputacao</div>
          <Star className="h-4 w-4 text-[#ff1934]" />
        </div>
        <div className="mt-2 text-xl font-semibold text-[#2b2b2b]">{game.reputation}/100</div>
        <div className="mt-1 text-xs text-[#888]">{reputationLabel(game.reputation)}</div>
      </button>
      <div
        id="reputation-popover"
        className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-20 hidden w-80 rounded-md border border-[#e5e5e5] bg-white p-3 text-sm shadow-lg group-hover:block group-focus-within:block"
      >
        <div className="font-semibold text-[#2b2b2b]">Por que a reputacao esta assim?</div>
        <div className="mt-1 text-xs text-[#777]">Resumo dos sinais recentes dos clientes.</div>
        <div className="mt-3 grid gap-2">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-[#ededed] p-2">
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-[#777]">{item.description}</div>
              </div>
              <Badge variant={item.score < 0 ? "destructive" : item.score > 0 ? "default" : "outline"}>
                {item.score > 0 ? "+" : ""}
                {item.score}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrderBadge({ order }: { order: Order }) {
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

export function ReportValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ededed] p-4">
      <div className="text-xs font-medium uppercase text-[#888]">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-[#dedede] p-4 text-sm text-[#777]">{text}</div>;
}
