
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletIcon, PlayIcon, SquareIcon, SettingsIcon, TrendingUpIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DashboardHeaderProps {
  isRunning: boolean;
  onToggleBot: () => void;
}

export const DashboardHeader = ({ isRunning, onToggleBot }: DashboardHeaderProps) => {
  const { toast } = useToast();
  const [isTogglingBot, setIsTogglingBot] = useState(false);

  const handleToggleBot = async () => {
    setIsTogglingBot(true);
    try {
      await onToggleBot();
      toast({
        title: isRunning ? "Bot gestoppt" : "Bot gestartet",
        description: isRunning 
          ? "Der Trading-Bot wurde erfolgreich gestoppt." 
          : "Der Trading-Bot wurde erfolgreich gestartet.",
        variant: isRunning ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: `Beim ${isRunning ? "Stoppen" : "Starten"} des Bots ist ein Fehler aufgetreten.`,
        variant: "destructive",
      });
    } finally {
      setIsTogglingBot(false);
    }
  };

  return (
    <div className="flex justify-between items-center mb-6 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <TrendingUpIcon className="h-6 w-6 text-success-DEFAULT" />
        <h1 className="text-2xl font-bold">ProfitPilot</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`h-2.5 w-2.5 rounded-full ${isRunning ? 'bg-success-DEFAULT animate-pulse-slow' : 'bg-danger-DEFAULT'}`} />
          <span className="text-sm font-medium">
            {isRunning ? 'Bot aktiv' : 'Bot inaktiv'}
          </span>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1.5"
            onClick={handleToggleBot}
            disabled={isTogglingBot}
          >
            {isRunning ? (
              <>
                <SquareIcon className="h-4 w-4 text-danger-DEFAULT" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 text-success-DEFAULT" />
                <span>Start</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
          >
            <WalletIcon className="h-4 w-4" />
            <span>Wallet</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1.5"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Einstellungen</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
