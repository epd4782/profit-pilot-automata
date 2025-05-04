
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownIcon, ArrowUpIcon, CoinsIcon, WalletIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface WalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BalanceItem {
  asset: string;
  free: string;
  locked: string;
  totalUSDT: string;
}

export const WalletModal = ({ isOpen, onOpenChange }: WalletModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [totalBalance, setTotalBalance] = useState("0.00");
  
  // Mock data - in a real app this would come from the Binance API
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockBalances = [
          { asset: "USDT", free: "243.78", locked: "0.00", totalUSDT: "243.78" },
          { asset: "BTC", free: "0.0024", locked: "0.00", totalUSDT: "124.56" },
          { asset: "ETH", free: "0.0521", locked: "0.00", totalUSDT: "112.95" },
          { asset: "BNB", free: "0.1482", locked: "0.00", totalUSDT: "65.23" },
        ];
        
        setBalances(mockBalances);
        
        // Calculate total balance
        const total = mockBalances.reduce((sum, item) => sum + parseFloat(item.totalUSDT), 0);
        setTotalBalance(total.toFixed(2));
        
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-trading-card border-trading-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" /> Wallet-Übersicht
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="history">Transaktionen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-trading-dark border-trading-border">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Gesamtguthaben</div>
                <div className="text-2xl font-bold mt-1">
                  {isLoading ? "Laden..." : `${totalBalance} USDT`}
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <ArrowUpIcon className="h-4 w-4 text-success-DEFAULT" />
                  <span className="text-sm text-success-DEFAULT">+3.25%</span>
                  <span className="text-xs text-muted-foreground">in 24h</span>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-1">
              <div className="text-sm font-medium mb-2">Deine Assets</div>
              
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Lade Wallet-Daten...
                </div>
              ) : (
                <div className="space-y-2">
                  {balances.map((balance) => (
                    <div 
                      key={balance.asset}
                      className="flex items-center justify-between p-3 rounded-md bg-trading-dark border border-trading-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-trading-border flex items-center justify-center">
                          <CoinsIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{balance.asset}</div>
                          <div className="text-sm text-muted-foreground">
                            {balance.free} verfügbar
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{balance.totalUSDT} USDT</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="rounded-md border border-trading-border divide-y divide-trading-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${i % 2 === 0 ? 'bg-success-DEFAULT/20' : 'bg-danger-DEFAULT/20'}`}>
                        {i % 2 === 0 ? (
                          <ArrowUpIcon className="h-4 w-4 text-success-DEFAULT" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-danger-DEFAULT" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {i % 2 === 0 ? 'Gewinn' : 'Verlust'} BTC/USDT
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${i % 2 === 0 ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'}`}>
                        {i % 2 === 0 ? '+' : '-'}2.{i}5 USDT
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Smart Grid Strategie
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {!isLoading && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  Alle Transaktionen anzeigen
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
