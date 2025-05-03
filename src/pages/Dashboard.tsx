
import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PerformanceChart } from "@/components/PerformanceChart";
import { StatCard } from "@/components/StatCard";
import { RecentTradesTable } from "@/components/RecentTradesTable";
import { StrategySelector } from "@/components/StrategySelector";
import { ApiKeyForm } from "@/components/ApiKeyForm";

const Dashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [balance, setBalance] = useState(0);
  const [profit, setProfit] = useState(0);
  const [profitPercent, setProfitPercent] = useState(0);
  const [trades, setTrades] = useState(0);
  
  // Prüfe, ob API-Schlüssel konfiguriert sind
  useEffect(() => {
    const apiKey = localStorage.getItem("binance_api_key");
    const secretKey = localStorage.getItem("binance_secret_key");
    
    if (apiKey && secretKey) {
      setApiConfigured(true);
      // Simuliere Ladeprozess von Binance-Daten
      setTimeout(() => {
        setBalance(125.48);
        setProfit(7.92);
        setProfitPercent(6.74);
        setTrades(13);
      }, 1000);
    }
  }, []);
  
  const handleToggleBot = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsRunning(!isRunning);
        resolve();
      }, 1000);
    });
  };
  
  const handleApiKeySaved = (apiKey: string, secretKey: string) => {
    setApiConfigured(!!apiKey && !!secretKey);
  };
  
  return (
    <div className="min-h-screen bg-trading-dark">
      <div className="container px-4 lg:px-8 mx-auto">
        <DashboardHeader isRunning={isRunning} onToggleBot={handleToggleBot} />
        
        {apiConfigured ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <StatCard title="Kontostand" value={`${balance.toFixed(2)} €`} />
              <StatCard 
                title="Gesamtgewinn" 
                value={`${profit.toFixed(2)} €`} 
                change={profitPercent} 
                changeTimeframe="Gesamt"
              />
              <StatCard title="Anzahl Trades" value={trades} />
              <StatCard 
                title="Win-Rate" 
                value="61.5%" 
                change={3.8} 
                changeTimeframe="7T"
              />
            </div>
            
            {/* Chart and Strategy Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <PerformanceChart />
              </div>
              <div>
                <StrategySelector />
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

export default Dashboard;
