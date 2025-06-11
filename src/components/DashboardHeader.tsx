import { useState } from "react";
import { useTradingContext } from "@/contexts/TradingContext";
import { ModeToggle } from "@/components/ModeToggle";
import { WalletModal } from "@/components/WalletModal";
import { SettingsModal } from "@/components/SettingsModal";
import { ClearDataButton } from "@/components/ClearDataButton";
import { Button } from "@/components/ui/button";
import { ActivityIcon, WalletIcon } from "lucide-react";
import { SystemHealthDialog } from "@/components/SystemHealthDialog";

export const DashboardHeader = () => {
  const { isRunning, toggleBot } = useTradingContext();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHealthDialog, setShowHealthDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="text-2xl font-bold">
          Trading Dashboard
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={toggleBot} variant={isRunning ? "destructive" : "secondary"}>
            {isRunning ? "Stop Bot" : "Start Bot"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWalletModal(true)}
            className="gap-2"
          >
            <WalletIcon className="h-4 w-4" />
            Wallet
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
          >
            Settings
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHealthDialog(true)}
            className="gap-2"
          >
            <ActivityIcon className="h-4 w-4" />
            System-Check
          </Button>
          
          <ClearDataButton />
          <ModeToggle />
        </div>
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onOpenChange={setShowWalletModal}
      />
      
      <SettingsModal
        isOpen={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
      
      <SystemHealthDialog 
        isOpen={showHealthDialog}
        onOpenChange={setShowHealthDialog}
      />
    </>
  );
};
