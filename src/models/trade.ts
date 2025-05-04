
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
