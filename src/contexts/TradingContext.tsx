
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { binanceService } from "@/services/binanceService";
import { strategyService, StrategySettings } from "@/services/strategyService";
import { tradeService } from "@/services/tradeService";
import { Trade, EquityPoint } from "@/models/trade";
import { toast } from "sonner";

interface TradingContextType {
  isRunning: boolean;
  strategies: StrategySettings[];
  activeStrategy?: StrategySettings;
  recentTrades: Trade[];
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
    totalUSDT: string;
  }>;
  totalBalance: number;
  profit: {
    daily: number;
    weekly: number;
    total: number;
  };
  equityData: {
    daily: EquityPoint[];
    weekly: EquityPoint[];
    monthly: EquityPoint[];
    yearly: EquityPoint[];
  };
  tradeStats: {
    total: number;
    winRate: number;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
  isLoading: boolean;
  toggleBot: () => Promise<void>;
  updateStrategy: (id: string, updates: Partial<StrategySettings>) => boolean;
  addStrategy: (strategy: StrategySettings) => boolean;
  loadEquityData: (timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly') => EquityPoint[];
  refreshData: () => Promise<void>;
  selectedStrategy: string;
  setSelectedStrategy: (id: string) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider = ({ children }: { children: ReactNode }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [strategies, setStrategies] = useState<StrategySettings[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [balances, setBalances] = useState<Array<{
    asset: string;
    free: string;
    locked: string;
    totalUSDT: string;
  }>>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [profit, setProfit] = useState({
    daily: 0,
    weekly: 0,
    total: 0
  });
  const [equityData, setEquityData] = useState<{
    daily: EquityPoint[];
    weekly: EquityPoint[];
    monthly: EquityPoint[];
    yearly: EquityPoint[];
  }>({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  });
  const [tradeStats, setTradeStats] = useState({
    total: 0,
    winRate: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await refreshData();
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
    
    // Initialize bot status
    setIsRunning(strategyService.isActive());
    
    // Update data every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Load equity data by timeframe
  const loadEquityData = (timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly'): EquityPoint[] => {
    return tradeService.getEquityData(timeframe);
  };
  
  // Toggle bot running state
  const toggleBot = async (): Promise<void> => {
    try {
      if (isRunning) {
        strategyService.stop();
        setIsRunning(false);
      } else {
        const success = strategyService.start();
        setIsRunning(success);
        
        if (!success) {
          throw new Error("Bot konnte nicht gestartet werden.");
        }
      }
    } catch (error) {
      console.error("Error toggling bot:", error);
      toast.error(`Fehler beim ${isRunning ? "Stoppen" : "Starten"} des Bots`);
      throw error;
    }
  };
  
  // Update strategy settings
  const updateStrategy = (id: string, updates: Partial<StrategySettings>): boolean => {
    const success = strategyService.updateStrategy(id, updates);
    if (success) {
      refreshData();
    }
    return success;
  };
  
  // Add a new strategy
  const addStrategy = (strategy: StrategySettings): boolean => {
    const success = strategyService.addStrategy(strategy);
    if (success) {
      refreshData();
    }
    return success;
  };
  
  // Refresh all trading data
  const refreshData = async (): Promise<void> => {
    try {
      // Load strategies
      const allStrategies = strategyService.getAllStrategies();
      setStrategies(allStrategies);
      
      // Set default selected strategy if not set
      if (!selectedStrategy && allStrategies.length > 0) {
        setSelectedStrategy(allStrategies[0].id);
      }
      
      // Get active strategy
      const activeStrat = allStrategies.find(s => s.id === selectedStrategy) || allStrategies[0];
      
      // Load recent trades
      const trades = tradeService.getRecentTrades(20);
      setRecentTrades(trades);
      
      // Load performance stats
      const performance = tradeService.calculatePerformance();
      const activeStrategyPerformance = performance.find(p => p.strategyId === activeStrat?.id);
      
      setTradeStats({
        total: trades.length,
        winRate: activeStrategyPerformance?.winRate || 0,
        consecutiveWins: activeStrategyPerformance?.consecutiveWins || 0,
        consecutiveLosses: activeStrategyPerformance?.consecutiveLosses || 0
      });
      
      // Load daily performance
      const dailyPerformance = tradeService.getDailyPerformance(7);
      const todayPerf = dailyPerformance[dailyPerformance.length - 1];
      const weeklyProfit = dailyPerformance.reduce((sum, day) => sum + day.profit, 0);
      
      // Calculate total profit from trades
      const totalProfit = trades
        .filter(t => t.status === 'CLOSED' && t.pnl !== undefined)
        .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      
      setProfit({
        daily: todayPerf?.profit || 0,
        weekly: weeklyProfit,
        total: totalProfit
      });
      
      // Load equity data
      setEquityData({
        daily: tradeService.getEquityData('daily'),
        weekly: tradeService.getEquityData('weekly'),
        monthly: tradeService.getEquityData('monthly'),
        yearly: tradeService.getEquityData('yearly')
      });
      
      // Load account balances
      if (binanceService.isConfigured()) {
        const accountInfo = await binanceService.getAccountInfo();
        const tickers = await binanceService.getTickers([]);
        
        // Calculate USDT values
        const balancesWithUsdt = accountInfo.balances
          .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
          .map(balance => {
            let usdtValue = "0.00";
            
            if (balance.asset === 'USDT') {
              usdtValue = balance.free;
            } else {
              const ticker = tickers.find(t => t.symbol === `${balance.asset}USDT`);
              if (ticker) {
                const total = parseFloat(balance.free) + parseFloat(balance.locked);
                usdtValue = (total * parseFloat(ticker.price)).toFixed(2);
              }
            }
            
            return {
              ...balance,
              totalUSDT: usdtValue
            };
          })
          .sort((a, b) => parseFloat(b.totalUSDT) - parseFloat(a.totalUSDT));
        
        setBalances(balancesWithUsdt);
        
        // Calculate total balance
        const total = balancesWithUsdt.reduce((sum, b) => sum + parseFloat(b.totalUSDT), 0);
        setTotalBalance(total);
      }
      
      // Update bot status
      setIsRunning(strategyService.isActive());
      
    } catch (error) {
      console.error("Error refreshing trading data:", error);
    }
  };
  
  const value = {
    isRunning,
    strategies,
    activeStrategy: strategies.find(s => s.id === selectedStrategy),
    recentTrades,
    balances,
    totalBalance,
    profit,
    equityData,
    tradeStats,
    isLoading,
    toggleBot,
    updateStrategy,
    addStrategy,
    loadEquityData,
    refreshData,
    selectedStrategy,
    setSelectedStrategy
  };
  
  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error("useTradingContext must be used within a TradingProvider");
  }
  return context;
};
