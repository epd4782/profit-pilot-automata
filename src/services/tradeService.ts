
import { toast } from "sonner";
import { 
  Trade, 
  TradeHistory, 
  EquityHistory, 
  EquityPoint,
  StrategyPerformance,
  DailyPerformance
} from "@/models/trade";

class TradeService {
  private storageKeyTrades = "trading_history";
  private storageKeyEquity = "equity_history";
  private initialBalance = 100; // Initial balance in USDT
  
  // Load trade history from localStorage
  public loadTradeHistory(): TradeHistory {
    try {
      const storedData = localStorage.getItem(this.storageKeyTrades);
      if (storedData) {
        return JSON.parse(storedData) as TradeHistory;
      }
    } catch (error) {
      console.error("Error loading trade history:", error);
      toast.error("Fehler beim Laden der Trade-Historie");
    }
    
    return {
      trades: [],
      lastUpdated: Date.now()
    };
  }
  
  // Save trade history to localStorage
  private saveTradeHistory(history: TradeHistory): void {
    try {
      localStorage.setItem(this.storageKeyTrades, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving trade history:", error);
      toast.error("Fehler beim Speichern der Trade-Historie");
    }
  }
  
  // Add a new trade
  public addTrade(trade: Omit<Trade, "id">): Trade {
    const history = this.loadTradeHistory();
    const newTrade: Trade = {
      ...trade,
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    history.trades.push(newTrade);
    history.lastUpdated = Date.now();
    this.saveTradeHistory(history);
    
    // Update equity after adding trade
    this.updateEquity();
    
    return newTrade;
  }
  
  // Update an existing trade (for example, when closing a position)
  public updateTrade(tradeId: string, updates: Partial<Trade>): Trade | null {
    const history = this.loadTradeHistory();
    const tradeIndex = history.trades.findIndex(t => t.id === tradeId);
    
    if (tradeIndex === -1) {
      console.error(`Trade with ID ${tradeId} not found`);
      return null;
    }
    
    const updatedTrade = {
      ...history.trades[tradeIndex],
      ...updates
    };
    
    history.trades[tradeIndex] = updatedTrade;
    history.lastUpdated = Date.now();
    this.saveTradeHistory(history);
    
    // Update equity after updating trade
    this.updateEquity();
    
    return updatedTrade;
  }
  
  // Get recent trades (optionally filtered by symbol or strategy)
  public getRecentTrades(limit: number = 20, symbol?: string, strategyId?: string): Trade[] {
    const history = this.loadTradeHistory();
    
    return history.trades
      .filter(trade => 
        (!symbol || trade.symbol === symbol) && 
        (!strategyId || trade.strategyId === strategyId)
      )
      .sort((a, b) => b.entryTime - a.entryTime)
      .slice(0, limit);
  }
  
  // Calculate performance metrics for all trades or by strategy
  public calculatePerformance(strategyId?: string): StrategyPerformance[] {
    const history = this.loadTradeHistory();
    const strategies: Record<string, StrategyPerformance> = {};
    
    // Filter trades by strategy if provided
    const filteredTrades = strategyId 
      ? history.trades.filter(trade => trade.strategyId === strategyId)
      : history.trades;
    
    // Group trades by strategy
    filteredTrades.forEach(trade => {
      if (!strategies[trade.strategyId]) {
        strategies[trade.strategyId] = {
          strategyId: trade.strategyId,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          breakEvenTrades: 0,
          totalProfit: 0,
          averageProfitPerTrade: 0,
          winRate: 0,
          consecutiveLosses: 0,
          consecutiveWins: 0
        };
      }
      
      const strategy = strategies[trade.strategyId];
      strategy.totalTrades++;
      
      // Only count completed trades for profit/loss stats
      if (trade.status === 'CLOSED' && trade.pnl !== undefined) {
        if (trade.pnl > 0) {
          strategy.winningTrades++;
          if (strategy.lastTradeResult !== 'WIN') {
            strategy.consecutiveWins = 1;
          } else {
            strategy.consecutiveWins++;
          }
          strategy.consecutiveLosses = 0;
          strategy.lastTradeResult = 'WIN';
        } else if (trade.pnl < 0) {
          strategy.losingTrades++;
          if (strategy.lastTradeResult !== 'LOSS') {
            strategy.consecutiveLosses = 1;
          } else {
            strategy.consecutiveLosses++;
          }
          strategy.consecutiveWins = 0;
          strategy.lastTradeResult = 'LOSS';
        } else {
          strategy.breakEvenTrades++;
          strategy.consecutiveWins = 0;
          strategy.consecutiveLosses = 0;
          strategy.lastTradeResult = 'BREAK_EVEN';
        }
        
        strategy.totalProfit += trade.pnl;
      }
    });
    
    // Calculate derived metrics
    Object.values(strategies).forEach(strategy => {
      const completedTrades = strategy.winningTrades + strategy.losingTrades + strategy.breakEvenTrades;
      strategy.winRate = completedTrades > 0 
        ? strategy.winningTrades / completedTrades 
        : 0;
        
      strategy.averageProfitPerTrade = completedTrades > 0 
        ? strategy.totalProfit / completedTrades 
        : 0;
    });
    
    return Object.values(strategies);
  }
  
  // Calculate daily performance
  public getDailyPerformance(days: number = 7): DailyPerformance[] {
    const history = this.loadTradeHistory();
    const dailyMap: Record<string, DailyPerformance> = {};
    
    // Create entries for all requested days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dailyMap[dateStr] = {
        date: dateStr,
        trades: 0,
        profit: 0,
        winRate: 0
      };
    }
    
    // Process all completed trades
    history.trades
      .filter(trade => trade.status === 'CLOSED' && trade.pnl !== undefined)
      .forEach(trade => {
        // Convert timestamp to date string
        const date = new Date(trade.exitTime || trade.entryTime);
        const dateStr = date.toISOString().split('T')[0];
        
        // Only process trades within the requested time range
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].trades++;
          
          // Fix: Ensure pnl is a number before arithmetic operation
          if (trade.pnl !== undefined) {
            dailyMap[dateStr].profit += Number(trade.pnl);
            
            // Update win rate
            if (trade.pnl > 0) {
              dailyMap[dateStr].winRate = (dailyMap[dateStr].winRate * (dailyMap[dateStr].trades - 1) + 1) / dailyMap[dateStr].trades;
            } else if (trade.pnl < 0) {
              dailyMap[dateStr].winRate = dailyMap[dateStr].winRate * (dailyMap[dateStr].trades - 1) / dailyMap[dateStr].trades;
            }
          }
        }
      });
    
    // Convert map to array and sort by date
    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }
  
  // Load equity history from localStorage
  public loadEquityHistory(): EquityHistory {
    try {
      const storedData = localStorage.getItem(this.storageKeyEquity);
      if (storedData) {
        return JSON.parse(storedData) as EquityHistory;
      }
    } catch (error) {
      console.error("Error loading equity history:", error);
    }
    
    // If no equity history exists, create initial point
    const initialEquity: EquityHistory = {
      data: [{ timestamp: Date.now(), value: this.initialBalance }],
      lastUpdated: Date.now()
    };
    
    this.saveEquityHistory(initialEquity);
    return initialEquity;
  }
  
  // Save equity history to localStorage
  private saveEquityHistory(history: EquityHistory): void {
    try {
      localStorage.setItem(this.storageKeyEquity, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving equity history:", error);
    }
  }
  
  // Update equity based on trades
  public updateEquity(): void {
    const tradeHistory = this.loadTradeHistory();
    const equityHistory = this.loadEquityHistory();
    
    // Calculate current equity
    const completedTrades = tradeHistory.trades.filter(t => t.status === 'CLOSED' && t.pnl !== undefined);
    const totalPnL = completedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const currentEquity = this.initialBalance + totalPnL;
    
    // Add new equity point if value changed
    const lastPoint = equityHistory.data[equityHistory.data.length - 1];
    if (!lastPoint || lastPoint.value !== currentEquity) {
      equityHistory.data.push({
        timestamp: Date.now(),
        value: currentEquity
      });
      
      equityHistory.lastUpdated = Date.now();
      this.saveEquityHistory(equityHistory);
    }
  }
  
  // Get equity data for charting (by timeframe)
  public getEquityData(timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'): EquityPoint[] {
    const history = this.loadEquityHistory();
    
    // If we have very little data, just return what we have
    if (history.data.length <= 2) {
      return history.data;
    }
    
    // Calculate time range based on timeframe
    const now = Date.now();
    let startTime: number;
    
    switch (timeframe) {
      case 'weekly':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'yearly':
        startTime = now - 365 * 24 * 60 * 60 * 1000;
        break;
      case 'daily':
      default:
        startTime = now - 24 * 60 * 60 * 1000;
        break;
    }
    
    // Filter equity points within the time range
    const filteredData = history.data.filter(point => point.timestamp >= startTime);
    
    // If no data points in the selected timeframe, return most recent point
    if (filteredData.length === 0 && history.data.length > 0) {
      return [history.data[history.data.length - 1]];
    }
    
    return filteredData;
  }
  
  // Clear all trade and equity history
  public clearAllData(): void {
    try {
      localStorage.removeItem(this.storageKeyTrades);
      localStorage.removeItem(this.storageKeyEquity);
      
      // Reinitialize with starting balance
      const initialEquity: EquityHistory = {
        data: [{ timestamp: Date.now(), value: this.initialBalance }],
        lastUpdated: Date.now()
      };
      
      this.saveEquityHistory(initialEquity);
      this.saveTradeHistory({ trades: [], lastUpdated: Date.now() });
      
      toast.success("Alle Tradingdaten wurden gelöscht");
    } catch (error) {
      console.error("Error clearing trading data:", error);
      toast.error("Fehler beim Löschen der Tradingdaten");
    }
  }
}

// Singleton instance
export const tradeService = new TradeService();
