import { BarChart3, ClipboardList } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { dailyOverheadCosts } from "@/lib/game/data";
import type { GameStore } from "@/lib/game/store";
import { formatMoney } from "@/lib/utils";
import { ReportValue } from "./shared";
import type { ChartDataPoint } from "./types";

export function ReportsPanel({ game, chartData }: { game: GameStore; chartData: ChartDataPoint[] }) {
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
