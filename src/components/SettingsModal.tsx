
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ isOpen, onOpenChange }: SettingsModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // General settings
  const [dailyLossLimit, setDailyLossLimit] = useState(5);
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(false);
  const [trailingStopPercentage, setTrailingStopPercentage] = useState(1.5);
  const [trailingTakeProfitEnabled, setTrailingTakeProfitEnabled] = useState(false);
  const [trailingTakeProfitPercentage, setTrailingTakeProfitPercentage] = useState(2.0);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(10);
  
  // Notification settings
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [notifyOnEntry, setNotifyOnEntry] = useState(true);
  const [notifyOnExit, setNotifyOnExit] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);
  
  const handleSaveSettings = () => {
    // In a real app, this would be saved to a database or localStorage
    localStorage.setItem("settings_dailyLossLimit", dailyLossLimit.toString());
    localStorage.setItem("settings_trailingStopEnabled", trailingStopEnabled.toString());
    localStorage.setItem("settings_trailingStopPercentage", trailingStopPercentage.toString());
    localStorage.setItem("settings_trailingTakeProfitEnabled", trailingTakeProfitEnabled.toString());
    localStorage.setItem("settings_trailingTakeProfitPercentage", trailingTakeProfitPercentage.toString());
    localStorage.setItem("settings_maxTradesPerDay", maxTradesPerDay.toString());
    
    if (telegramEnabled && (!telegramBotToken || !telegramChatId)) {
      toast({
        title: "Fehler bei Telegram-Einstellungen",
        description: "Bitte gib einen Bot-Token und Chat-ID ein, um Telegram-Benachrichtigungen zu aktivieren.",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem("settings_telegramEnabled", telegramEnabled.toString());
    if (telegramEnabled) {
      localStorage.setItem("settings_telegramBotToken", telegramBotToken);
      localStorage.setItem("settings_telegramChatId", telegramChatId);
      localStorage.setItem("settings_notifyOnEntry", notifyOnEntry.toString());
      localStorage.setItem("settings_notifyOnExit", notifyOnExit.toString());
      localStorage.setItem("settings_notifyDailySummary", notifyDailySummary.toString());
    }
    
    toast({
      title: "Einstellungen gespeichert",
      description: "Deine Trading-Einstellungen wurden erfolgreich aktualisiert."
    });
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-trading-card border-trading-border">
        <DialogHeader>
          <DialogTitle>Bot-Einstellungen</DialogTitle>
          <DialogDescription>
            Konfiguriere hier die globalen Einstellungen für deinen Trading-Bot.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Maximaler täglicher Verlust (%)</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[dailyLossLimit]} 
                    min={1} 
                    max={20} 
                    step={0.5}
                    onValueChange={(values) => setDailyLossLimit(values[0])}
                    className="flex-grow"
                  />
                  <span className="w-12 text-right">{dailyLossLimit}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Der Bot stoppt automatisch, wenn dieser Verlust am Tag erreicht wird.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Maximale Anzahl Trades pro Tag</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[maxTradesPerDay]} 
                    min={1} 
                    max={50} 
                    step={1}
                    onValueChange={(values) => setMaxTradesPerDay(values[0])}
                    className="flex-grow"
                  />
                  <span className="w-12 text-right">{maxTradesPerDay}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="trailing-stop" className="block">Trailing Stop-Loss</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stop-Loss folgt dem Kurs automatisch nach oben.
                  </p>
                </div>
                <Switch 
                  id="trailing-stop" 
                  checked={trailingStopEnabled}
                  onCheckedChange={setTrailingStopEnabled}
                />
              </div>
              
              {trailingStopEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label>Trailing Stop-Loss Abstand (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider 
                      value={[trailingStopPercentage]} 
                      min={0.5} 
                      max={10} 
                      step={0.1}
                      onValueChange={(values) => setTrailingStopPercentage(values[0])}
                      className="flex-grow"
                    />
                    <span className="w-12 text-right">{trailingStopPercentage}%</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="trailing-tp" className="block">Trailing Take-Profit</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take-Profit folgt dem Kurs für höhere Gewinne.
                  </p>
                </div>
                <Switch 
                  id="trailing-tp" 
                  checked={trailingTakeProfitEnabled}
                  onCheckedChange={setTrailingTakeProfitEnabled}
                />
              </div>
              
              {trailingTakeProfitEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label>Trailing Take-Profit Abstand (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider 
                      value={[trailingTakeProfitPercentage]} 
                      min={0.5} 
                      max={10} 
                      step={0.1}
                      onValueChange={(values) => setTrailingTakeProfitPercentage(values[0])}
                      className="flex-grow"
                    />
                    <span className="w-12 text-right">{trailingTakeProfitPercentage}%</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="telegram-enabled" className="block">Telegram-Benachrichtigungen</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Erhalte Benachrichtigungen über Trades direkt in Telegram.
                </p>
              </div>
              <Switch 
                id="telegram-enabled" 
                checked={telegramEnabled}
                onCheckedChange={setTelegramEnabled}
              />
            </div>
            
            {telegramEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="bot-token">Telegram Bot Token</Label>
                  <Input 
                    id="bot-token" 
                    type="password" 
                    value={telegramBotToken} 
                    onChange={(e) => setTelegramBotToken(e.target.value)} 
                    placeholder="z.B. 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ"
                  />
                  <p className="text-xs text-muted-foreground">
                    Erstelle einen Bot mit @BotFather und füge den API-Token hier ein.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chat-id">Telegram Chat ID</Label>
                  <Input 
                    id="chat-id" 
                    value={telegramChatId} 
                    onChange={(e) => setTelegramChatId(e.target.value)} 
                    placeholder="z.B. -1001234567890"
                  />
                  <p className="text-xs text-muted-foreground">
                    ID deines persönlichen Chats oder einer Gruppe.
                  </p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <Label>Benachrichtigungstypen</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-entry" className="cursor-pointer">Trade-Einstieg</Label>
                      <Switch 
                        id="notify-entry" 
                        checked={notifyOnEntry}
                        onCheckedChange={setNotifyOnEntry}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-exit" className="cursor-pointer">Trade-Ausstieg (TP/SL)</Label>
                      <Switch 
                        id="notify-exit" 
                        checked={notifyOnExit}
                        onCheckedChange={setNotifyOnExit}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-summary" className="cursor-pointer">Tägliche Zusammenfassung</Label>
                      <Switch 
                        id="notify-summary" 
                        checked={notifyDailySummary}
                        onCheckedChange={setNotifyDailySummary}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSaveSettings}>
            Einstellungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
