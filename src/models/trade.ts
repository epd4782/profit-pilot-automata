
export interface Trade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  status: 'OPEN' | 'CLOSED' | 'CANCELED';
  profit: number;
  profitPercentage: number;
  entryTime: string;
  exitTime: string | null;
  stopLoss: number | null;
  takeProfit: number | null;
  strategyId: string;
  pnl?: number; // Added pnl field that was missing
}

export interface StrategySettings {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  timeframe: string;
  symbols: string[];
  maxOpenTrades: number;
  maxDailyLoss: number;
  schema: StrategySchema;
}

export interface StrategySchema {
  type: string;
  parameters: {
    [key: string]: string | number | boolean;
  };
  conditions?: {
    type: string;
    value?: string | number;
    lookback?: number;
    compareTo?: string;
    timeframe?: string;
  }[];
}

// Adding missing interfaces for equity tracking
export interface EquityPoint {
  timestamp: number;
  value: number;
}

export interface EquityHistory {
  data: EquityPoint[];
  lastUpdated: number;
}

export interface TradeHistory {
  trades: Trade[];
  lastUpdated: number;
}

export interface StrategyPerformance {
  strategyId: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  totalProfit: number;
  averageProfitPerTrade: number;
  winRate: number;
  consecutiveLosses: number;
  consecutiveWins: number;
  lastTradeResult?: 'WIN' | 'LOSS' | 'BREAK_EVEN';
}

export interface DailyPerformance {
  date: string;
  trades: number;
  profit: number;
  winRate: number;
}
