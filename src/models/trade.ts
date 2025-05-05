
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
