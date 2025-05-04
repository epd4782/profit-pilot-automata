
export interface Trade {
  id: string;
  symbol: string;
  entryTime: number;
  exitTime?: number;
  strategyId: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  side: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED' | 'CANCELED';
  pnl?: number;
  pnlPercentage?: number;
  reason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL' | 'SYSTEM';
  notes?: string;
}

export interface TradeHistory {
  trades: Trade[];
  lastUpdated: number;
}

export interface EquityPoint {
  timestamp: number;
  value: number;
}

export interface EquityHistory {
  data: EquityPoint[];
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
  lastTradeResult?: 'WIN' | 'LOSS' | 'BREAK_EVEN';
  consecutiveLosses: number;
  consecutiveWins: number;
}

export interface DailyPerformance {
  date: string;
  trades: number;
  profit: number;
  winRate: number;
}

// JSON strategy schema for modular strategy management
export interface StrategySchema {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  
  // Trading parameters
  symbols: string[];
  timeframes: string[];
  
  // Risk management
  riskPerTrade: number; // Percentage of account
  maxDailyLoss: number; // Percentage of account
  maxTradesPerDay: number;
  stopLoss: number; // Percentage
  takeProfit: number; // Percentage
  trailingStop: boolean;
  trailingStopDistance?: number;
  trailingTakeProfit: boolean;
  trailingTakeProfitDistance?: number;
  
  // Strategy-specific indicators and parameters
  indicators: {
    [key: string]: {
      type: 'RSI' | 'EMA' | 'SMA' | 'MACD' | 'BB' | 'VOLUME' | 'CANDLE' | string;
      parameters: {
        [key: string]: number | string | boolean;
      };
      conditions?: {
        type: 'CROSSOVER' | 'CROSSUNDER' | 'ABOVE' | 'BELOW' | 'INCREASING' | 'DECREASING' | string;
        value?: number | string;
        lookback?: number;
        // For complex conditions
        compareTo?: string; // Another indicator or 'PRICE'
        timeframe?: string; // Optional different timeframe for MTF strategies
      }[];
    };
  };
  
  // Entry and exit rules (in plain English for documentation)
  entryRules?: string[];
  exitRules?: string[];
  
  // Performance metrics (updated during runtime)
  performance?: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    expectancy: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    lastUpdated: number;
  };
  
  // Learning parameters (for adaptive strategies)
  learningEnabled?: boolean;
  adaptiveParameters?: {
    parameterName: string;
    min: number;
    max: number;
    step: number;
    currentValue: number;
  }[];
}

// Strategy template presets for quick strategy creation
export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  schema: Partial<StrategySchema>;
}
