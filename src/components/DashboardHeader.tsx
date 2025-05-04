
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletIcon, PlayIcon, SquareIcon, SettingsIcon, TrendingUpIcon, WifiIcon } from 'lucide-react';
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SettingsModal } from './SettingsModal';
import { WalletModal } from './WalletModal';
import { useTradingContext } from '@/contexts/TradingContext';

export const DashboardHeader = () => {
  const { isRunning, toggleBot, isLoading } = useTradingContext();
  const [isTogglingBot, setIsTogglingBot] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // API status check handled by the useEffect directly in TradingContext
  // Here we just visualize it based on the context values
  const apiConfigured = !!localStorage.getItem("binance_api_key") && 
                         !!localStorage.getItem("binance_secret_key");
  
  // Set API status based on configuration
  if (apiConfigured && apiStatus !== 'connected') {
    setApiStatus('connected');
  } else if (!apiConfigured && apiStatus !== 'disconnected') {
    setApiStatus('disconnected');
  }

  const handleToggleBot = async () => {
    setIsTogglingBot(true);
    try {
      await toggleBot();
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

  const getApiStatusColor = () => {
    switch (apiStatus) {
      case 'connected': return 'bg-success-DEFAULT';
      case 'disconnected': return 'bg-warning-DEFAULT';
      case 'error': return 'bg-danger-DEFAULT';
      default: return 'bg-muted-foreground';
    }
  };

  const getApiStatusText = () => {
    switch (apiStatus) {
      case 'connected': return 'API verbunden';
      case 'disconnected': return 'API nicht verbunden';
      case 'error': return 'API Fehler';
      default: return 'API Status unbekannt';
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="h-6 w-6 text-success-DEFAULT" />
          <h1 className="text-2xl font-bold">ProfitPilot</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* API Status Indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${getApiStatusColor()} ${apiStatus === 'connected' ? 'animate-pulse-slow' : ''}`} />
                <span className="text-sm font-medium">
                  {getApiStatusText()}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-2">
                <WifiIcon className="h-4 w-4" />
                <p>Letzte API-Prüfung: {new Date().toLocaleTimeString()}</p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Bot Status Indicator */}
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
              disabled={isTogglingBot || isLoading}
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
              onClick={() => setIsWalletModalOpen(true)}
            >
              <WalletIcon className="h-4 w-4" />
              <span>Wallet</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1.5"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Einstellungen</span>
            </Button>
          </div>
        </div>
      </div>
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
      
      <WalletModal
        isOpen={isWalletModalOpen}
        onOpenChange={setIsWalletModalOpen}
      />
    </>
  );
};
