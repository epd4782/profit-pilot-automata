
import { DashboardHeader } from "@/components/DashboardHeader";
import { StrategyManager } from "@/components/StrategyManager";
import { TradingProvider } from "@/contexts/TradingContext";

const StrategyManagerContent = () => {
  return (
    <div className="min-h-screen bg-trading-dark">
      <div className="container px-4 lg:px-8 mx-auto">
        <DashboardHeader />
        
        <div className="mb-4">
          <StrategyManager />
        </div>
      </div>
    </div>
  );
};

const StrategyManagerPage = () => {
  return (
    <TradingProvider>
      <StrategyManagerContent />
    </TradingProvider>
  );
};

export default StrategyManagerPage;
