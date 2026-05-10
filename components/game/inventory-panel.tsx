import { useMemo } from "react";
import { LineChart, Package, TrendingDown, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ingredients } from "@/lib/game/data";
import { ingredientById, recipeById } from "@/lib/game/engine";
import type { GameStore } from "@/lib/game/store";
import type { IngredientId } from "@/lib/game/types";
import { formatMoney } from "@/lib/utils";
import { buildMarketData, marketColors } from "./game-view-models";
import type { MarketSelection } from "./types";

const quickBuyOptions = [1, 5, 10];

export function InventoryPanel({
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
