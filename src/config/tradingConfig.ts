
export interface TradingConfig {
  // API Configuration
  binance: {
    testnet: boolean;
    baseUrl: string;
    wsUrl: string;
    maxRetries: number;
    retryDelay: number;
    rateLimitPerSecond: number;
  };
  
  // Trading Configuration
  trading: {
    minTradeAmount: number; // Minimum trade amount in USDT
    maxTradeAmount: number; // Maximum trade amount in USDT
    defaultRiskPerTrade: number; // Default risk percentage per trade
    maxDailyLoss: number; // Maximum daily loss percentage
    maxTradesPerDay: number; // Maximum trades per day
    enableRealTrading: boolean; // Use real orders vs test orders
  };
  
  // Analysis Configuration
  analysis: {
    intervalMs: number; // Analysis interval in milliseconds
    minConfidenceScore: number; // Minimum confidence score to execute trades
    lookbackPeriods: number; // Number of periods to look back for analysis
  };
  
  // Risk Management
  risk: {
    enableStopLoss: boolean;
    enableTakeProfit: boolean;
    enableTrailingStop: boolean;
    maxOpenPositions: number;
    maxExposurePerSymbol: number; // Maximum exposure per symbol as % of balance
  };
  
  // Logging Configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableRemoteLogging: boolean;
    maxLocalLogs: number;
  };
}

// Development Configuration
const developmentConfig: TradingConfig = {
  binance: {
    testnet: true,
    baseUrl: "https://testnet.binance.vision/api",
    wsUrl: "wss://testnet.binance.vision/ws",
    maxRetries: 3,
    retryDelay: 1000,
    rateLimitPerSecond: 10
  },
  trading: {
    minTradeAmount: 10,
    maxTradeAmount: 100,
    defaultRiskPerTrade: 1.0,
    maxDailyLoss: 5.0,
    maxTradesPerDay: 10,
    enableRealTrading: false // Always use test orders in development
  },
  analysis: {
    intervalMs: 60000, // 1 minute
    minConfidenceScore: 60,
    lookbackPeriods: 100
  },
  risk: {
    enableStopLoss: true,
    enableTakeProfit: true,
    enableTrailingStop: true,
    maxOpenPositions: 5,
    maxExposurePerSymbol: 20
  },
  logging: {
    level: 'debug',
    enableRemoteLogging: false,
    maxLocalLogs: 1000
  }
};

// Production Configuration
const productionConfig: TradingConfig = {
  binance: {
    testnet: false, // IMPORTANT: Set to false for live trading
    baseUrl: "https://api.binance.com/api",
    wsUrl: "wss://stream.binance.com:9443/ws",
    maxRetries: 5,
    retryDelay: 2000,
    rateLimitPerSecond: 5 // More conservative in production
  },
  trading: {
    minTradeAmount: 20, // Higher minimum for production
    maxTradeAmount: 1000,
    defaultRiskPerTrade: 0.5, // More conservative risk
    maxDailyLoss: 2.0, // Lower daily loss limit
    maxTradesPerDay: 20,
    enableRealTrading: true // CAREFUL: This enables real money trading
  },
  analysis: {
    intervalMs: 30000, // 30 seconds - more frequent in production
    minConfidenceScore: 70, // Higher confidence required
    lookbackPeriods: 200 // More data for better analysis
  },
  risk: {
    enableStopLoss: true,
    enableTakeProfit: true,
    enableTrailingStop: true,
    maxOpenPositions: 3, // More conservative
    maxExposurePerSymbol: 15 // Lower exposure per symbol
  },
  logging: {
    level: 'info',
    enableRemoteLogging: true,
    maxLocalLogs: 500
  }
};

// Get configuration based on environment
export const getTradingConfig = (): TradingConfig => {
  const isDevelopment = import.meta.env.DEV;
  return isDevelopment ? developmentConfig : productionConfig;
};

// Export default config
export const tradingConfig = getTradingConfig();
