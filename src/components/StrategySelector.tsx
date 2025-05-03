
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
import { SettingsIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { mockStrategies } from "@/lib/mock-data";

export const StrategySelector = () => {
  const { toast } = useToast();
  const [selectedStrategy, setSelectedStrategy] = useState("smart-grid");
  const [stopLoss, setStopLoss] = useState("5");
  const [takeProfit, setTakeProfit] = useState("3");
  
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
        
        <Button onClick={handleSaveSettings} className="w-full">
          Einstellungen speichern
        </Button>
      </CardContent>
    </Card>
  );
};
