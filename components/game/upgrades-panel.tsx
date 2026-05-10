import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { GameStore } from "@/lib/game/store";
import { formatMoney } from "@/lib/utils";

export function UpgradesPanel({ game }: { game: GameStore }) {
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
