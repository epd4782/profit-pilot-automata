
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockRecentTrades } from "@/lib/mock-data";

export const RecentTradesTable = () => {
  return (
    <Card className="trading-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Letzte Transaktionen</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px] text-xs">Zeitpunkt</TableHead>
              <TableHead className="text-xs">Paar</TableHead>
              <TableHead className="text-xs">Typ</TableHead>
              <TableHead className="text-xs text-right">Preis</TableHead>
              <TableHead className="text-xs text-right">Menge</TableHead>
              <TableHead className="text-xs text-right">Gesamt</TableHead>
              <TableHead className="text-xs text-right">Gewinn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRecentTrades.map((trade, i) => {
              const isBuy = trade.type === "buy";
              
              return (
                <TableRow key={i} className="hover:bg-muted/5">
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {trade.time}
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-trading-border flex items-center justify-center overflow-hidden">
                      <img 
                        src={`https://cryptologos.cc/logos/${trade.pair.toLowerCase().split('/')[0]}-logo.png`} 
                        alt={trade.pair}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://via.placeholder.com/20/2e3a50/FFFFFF?text=${trade.pair[0]}`;
                        }}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    <span className="text-xs">{trade.pair}</span>
                  </TableCell>
                  <TableCell>
                    <div className={`px-2 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                      isBuy 
                        ? "bg-success-DEFAULT/10 text-success-DEFAULT" 
                        : "bg-danger-DEFAULT/10 text-danger-DEFAULT"
                    }`}>
                      {isBuy ? (
                        <TrendingUpIcon className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDownIcon className="h-3.5 w-3.5" />
                      )}
                      {isBuy ? "Kauf" : "Verkauf"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-right">{trade.price.toFixed(2)} €</TableCell>
                  <TableCell className="text-xs text-right">{trade.amount.toFixed(6)}</TableCell>
                  <TableCell className="text-xs text-right">{trade.total.toFixed(2)} €</TableCell>
                  <TableCell className={`text-xs text-right ${
                    trade.profit > 0 
                      ? "text-success-DEFAULT" 
                      : trade.profit < 0 
                        ? "text-danger-DEFAULT" 
                        : ""
                  }`}>
                    {trade.profit > 0 ? "+" : ""}{trade.profit.toFixed(2)} €
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
