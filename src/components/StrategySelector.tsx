
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsIcon, PlusIcon, MinusIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { mockStrategies } from "@/lib/mock-data";

interface IndicatorSetting {
  name: string;
  value: string;
}

export const StrategySelector = () => {
  const { toast } = useToast();
  const [selectedStrategy, setSelectedStrategy] = useState("smart-grid");
  const [stopLoss, setStopLoss] = useState("5");
  const [takeProfit, setTakeProfit] = useState("3");
  const [maxDailyDrawdown, setMaxDailyDrawdown] = useState("5");
  const [maxTradesPerDay, setMaxTradesPerDay] = useState("10");
  const [selectedTimeframes, setSelectedTimeframes] = useState(["5m", "15m"]);
  const [activeTab, setActiveTab] = useState("risk");
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(false);
  
  // Strategy-specific indicator settings
  const [indicators, setIndicators] = useState<IndicatorSetting[]>([
    { name: "RSI Period", value: "14" },
    { name: "EMA Short", value: "9" },
    { name: "EMA Long", value: "21" }
  ]);
  
  const handleAddIndicator = () => {
    setIndicators([...indicators, { name: "", value: "" }]);
  };
  
  const handleRemoveIndicator = (index: number) => {
    const newIndicators = [...indicators];
    newIndicators.splice(index, 1);
    setIndicators(newIndicators);
  };
  
  const handleIndicatorChange = (index: number, field: "name" | "value", value: string) => {
    const newIndicators = [...indicators];
    newIndicators[index][field] = value;
    setIndicators(newIndicators);
  };
  
  const handleToggleTimeframe = (timeframe: string) => {
    if (selectedTimeframes.includes(timeframe)) {
      setSelectedTimeframes(selectedTimeframes.filter(t => t !== timeframe));
    } else {
      setSelectedTimeframes([...selectedTimeframes, timeframe]);
    }
  };
  
  const handleSaveSettings = () => {
    toast({
      title: "Strategie aktualisiert",
      description: "Deine Trading-Strategie wurde erfolgreich aktualisiert.",
    });
  };
  
  const currentStrategy = mockStrategies.find(s => s.id === selectedStrategy);

  return (
    <Card className="trading-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Trading-Strategie</CardTitle>
          <SettingsIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="strategy">Strategie auswählen</Label>
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger id="strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockStrategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentStrategy && (
            <p className="text-xs text-muted-foreground mt-1">{currentStrategy.description}</p>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-trading-dark">
            <TabsTrigger value="risk" className="flex-1">Risiko</TabsTrigger>
            <TabsTrigger value="timeframes" className="flex-1">Timeframes</TabsTrigger>
            <TabsTrigger value="indicators" className="flex-1">Indikatoren</TabsTrigger>
          </TabsList>
          
          <TabsContent value="risk" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stop-loss">Stop-Loss (%)</Label>
                <Input 
                  id="stop-loss" 
                  type="number" 
                  min="0.1" 
                  max="50" 
                  step="0.1"
                  value={stopLoss} 
                  onChange={(e) => setStopLoss(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="take-profit">Take-Profit (%)</Label>
                <Input 
                  id="take-profit" 
                  type="number"
                  min="0.1" 
                  max="50" 
                  step="0.1"
                  value={takeProfit} 
                  onChange={(e) => setTakeProfit(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-drawdown">Max. Drawdown/Tag (%)</Label>
                <Input 
                  id="max-drawdown" 
                  type="number"
                  min="1" 
                  max="100" 
                  step="1"
                  value={maxDailyDrawdown} 
                  onChange={(e) => setMaxDailyDrawdown(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-trades">Max. Trades/Tag</Label>
                <Input 
                  id="max-trades" 
                  type="number"
                  min="1" 
                  max="1000" 
                  step="1"
                  value={maxTradesPerDay} 
                  onChange={(e) => setMaxTradesPerDay(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="trailing-stop" className="flex-grow">Trailing Stop-Loss</Label>
              <Switch 
                id="trailing-stop" 
                checked={trailingStopEnabled}
                onCheckedChange={setTrailingStopEnabled}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="timeframes" className="pt-2">
            <div className="space-y-2">
              <Label className="block mb-2">Analyse Timeframes</Label>
              <div className="flex flex-wrap gap-2">
                {["1m", "5m", "15m", "30m", "1h", "4h", "1d"].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframes.includes(timeframe) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleTimeframe(timeframe)}
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Wähle die Timeframes, die für die Multi-Timeframe-Analyse verwendet werden sollen.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="indicators" className="space-y-4 pt-2">
            {indicators.map((indicator, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`indicator-name-${index}`}>Indikator</Label>
                  <Input
                    id={`indicator-name-${index}`}
                    value={indicator.name}
                    onChange={(e) => handleIndicatorChange(index, "name", e.target.value)}
                    placeholder="z.B. RSI, EMA, MACD"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`indicator-value-${index}`}>Wert</Label>
                  <Input
                    id={`indicator-value-${index}`}
                    value={indicator.value}
                    onChange={(e) => handleIndicatorChange(index, "value", e.target.value)}
                    placeholder="z.B. 14, 9/21, 12/26/9"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => handleRemoveIndicator(index)}
                >
                  <MinusIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-1"
              onClick={handleAddIndicator}
            >
              <PlusIcon className="h-4 w-4" /> Indikator hinzufügen
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Definiere hier deine technischen Indikatoren und ihre Parameter für die gewählte Strategie.
            </p>
          </TabsContent>
        </Tabs>
        
        <Button onClick={handleSaveSettings} className="w-full">
          Einstellungen speichern
        </Button>
      </CardContent>
    </Card>
  );
};
