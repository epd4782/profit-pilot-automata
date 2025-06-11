
import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PerformanceChart } from "@/components/PerformanceChart";
import { StatCard } from "@/components/StatCard";
import { RecentTradesTable } from "@/components/RecentTradesTable";
import { StrategySelector } from "@/components/StrategySelector";
import { VolatilityWidget } from "@/components/VolatilityWidget";
import { ApiKeyForm } from "@/components/ApiKeyForm";
import { TradingProvider, useTradingContext } from "@/contexts/TradingContext";

const DashboardContent = () => {
  const { isLoading, totalBalance, profit, tradeStats } = useTradingContext();
  const [apiConfigured, setApiConfigured] = useState(false);
  
  // Check if API keys are configured
  useEffect(() => {
    const apiKey = localStorage.getItem("binance_api_key");
    const secretKey = localStorage.getItem("binance_secret_key");
    setApiConfigured(!!apiKey && !!secretKey);
  }, []);
  
  const handleApiKeySaved = (apiKey: string, secretKey: string) => {
    setApiConfigured(!!apiKey && !!secretKey);
  };
  
  return (
    <div className="min-h-screen bg-trading-dark">
      <div className="container px-4 lg:px-8 mx-auto">
        <DashboardHeader />
        
        {apiConfigured ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <StatCard 
                title="Kontostand" 
                value={`${isLoading ? '...' : totalBalance.toFixed(2)} USDT`}
              />
              <StatCard 
                title="Gesamtgewinn" 
                value={`${isLoading ? '...' : profit.total.toFixed(2)} USDT`} 
                change={profit.total > 0 ? (profit.total / totalBalance) * 100 : 0} 
                changeTimeframe="Gesamt"
              />
              <StatCard 
                title="Anzahl Trades" 
                value={isLoading ? '...' : tradeStats.total}
              />
              <StatCard 
                title="Win-Rate" 
                value={isLoading ? '...' : `${(tradeStats.winRate * 100).toFixed(1)}%`} 
                change={tradeStats.winRate > 0.5 ? ((tradeStats.winRate - 0.5) * 100) : ((0.5 - tradeStats.winRate) * -100)} 
                changeTimeframe="Gesamt"
              />
            </div>
            
            {/* Chart, Strategy and Volatility Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-2">
                <PerformanceChart />
              </div>
              <div>
                <StrategySelector />
              </div>
              <div>
                <VolatilityWidget />
              </div>
            </div>
            
            {/* Recent Trades Table */}
            <div className="mb-4">
              <RecentTradesTable />
            </div>
          </>
        ) : (
          <div className="mt-4">
            <div className="max-w-xl mx-auto">
              <ApiKeyForm onApiKeySaved={handleApiKeySaved} isConfigured={apiConfigured} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <TradingProvider>
      <DashboardContent />
    </TradingProvider>
  );
};

export default Dashboard;
