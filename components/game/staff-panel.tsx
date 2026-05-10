import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { motoboyDailyCost, motoboyHireCost } from "@/lib/game/data";
import { availableMotoboys } from "@/lib/game/engine";
import type { GameStore } from "@/lib/game/store";
import { formatMoney } from "@/lib/utils";
import { ReportValue } from "./shared";

export function StaffPanel({ game }: { game: GameStore }) {
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
