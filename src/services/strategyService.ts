import { binanceService } from "./binanceService";
import { tradeService } from "./tradeService";
import { logger } from "./loggerService";
import { toast } from "sonner";

export interface StrategySettings {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  symbols: string[];
  stopLoss: number;
  takeProfit: number;
  trailingStop: boolean;
  trailingTakeProfit: boolean;
  trailingStopDistance: number;
  timeframes: string[];
  riskPerTrade: number; // Percentage of account balance
  maxDailyLoss: number; // Percentage of account balance
  maxTradesPerDay: number;
  indicators: {
    rsiPeriod: number;
    rsiOverbought: number;
    rsiOversold: number;
    emaShortPeriod: number;
    emaLongPeriod: number;
    useVolume: boolean;
    volumeThreshold: number;
  };
}

export interface Strategy {
  settings: StrategySettings;
  analyze: (symbol: string, timeframes: string[]) => Promise<StrategySignal | null>;
}

export interface StrategySignal {
  symbol: string;
  timeframe: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number; // 0-100
  strategyId: string;
  timestamp: number;
}

class StrategyService {
  private strategies: Map<string, StrategySettings> = new Map();
  private activeStrategies: Map<string, boolean> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastApiCallTime: number = 0;
  private minApiCallInterval: number = 100; // Minimum 100ms between API calls
  
  constructor() {
    this.loadStrategies();
    logger.info("StrategyService initialized", { strategiesCount: this.strategies.size });
  }
  
  // Load strategies from localStorage with error handling
  private loadStrategies(): void {
    try {
      const storedStrategies = localStorage.getItem('trading_strategies');
      if (storedStrategies) {
        const strategies = JSON.parse(storedStrategies) as StrategySettings[];
        strategies.forEach(strategy => {
          // Validate strategy structure
          if (this.isValidStrategy(strategy)) {
            this.strategies.set(strategy.id, strategy);
            this.activeStrategies.set(strategy.id, strategy.isActive);
          } else {
            logger.warn("Invalid strategy found in storage", { strategyId: strategy.id });
          }
        });
        logger.info("Strategies loaded from storage", { count: strategies.length });
      } else {
        // Add default RSI + EMA Cross strategy if no strategies exist
        const defaultStrategy = this.getDefaultRsiEmaStrategy();
        this.strategies.set(defaultStrategy.id, defaultStrategy);
        this.activeStrategies.set(defaultStrategy.id, defaultStrategy.isActive);
        this.saveStrategies();
        logger.info("Default strategy created");
      }
    } catch (error) {
      logger.error("Error loading strategies", error);
      toast.error("Fehler beim Laden der Trading-Strategien");
      
      // Add default strategy as fallback
      const defaultStrategy = this.getDefaultRsiEmaStrategy();
      this.strategies.set(defaultStrategy.id, defaultStrategy);
      this.activeStrategies.set(defaultStrategy.id, defaultStrategy.isActive);
    }
  }

  // Validate strategy structure
  private isValidStrategy(strategy: any): boolean {
    const requiredFields = ['id', 'name', 'symbols', 'stopLoss', 'takeProfit', 'timeframes', 'riskPerTrade'];
    return requiredFields.every(field => strategy.hasOwnProperty(field));
  }
  
  // Save strategies to localStorage with error handling
  private saveStrategies(): void {
    try {
      const strategiesToSave = Array.from(this.strategies.values());
      localStorage.setItem('trading_strategies', JSON.stringify(strategiesToSave));
      logger.debug("Strategies saved to storage", { count: strategiesToSave.length });
    } catch (error) {
      logger.error("Error saving strategies", error);
      toast.error("Fehler beim Speichern der Trading-Strategien");
    }
  }
  
  // Get default RSI + EMA Cross strategy
  private getDefaultRsiEmaStrategy(): StrategySettings {
    return {
      id: 'rsi-ema-cross',
      name: 'RSI + EMA Cross',
      description: 'Kombiniert RSI-Überkauf/Überverkauf mit EMA-Kreuzungen für Trendbestätigung.',
      isActive: true,
      symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
      stopLoss: 2.0,
      takeProfit: 4.0,
      trailingStop: true,
      trailingTakeProfit: false,
      trailingStopDistance: 1.0,
      timeframes: ['15m', '1h'],
      riskPerTrade: 1.0,
      maxDailyLoss: 5.0,
      maxTradesPerDay: 10,
      indicators: {
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        emaShortPeriod: 9,
        emaLongPeriod: 21,
        useVolume: true,
        volumeThreshold: 1.5
      }
    };
  }
  
  // Get all strategies
  public getAllStrategies(): StrategySettings[] {
    return Array.from(this.strategies.values());
  }
  
  // Get a specific strategy by ID
  public getStrategy(id: string): StrategySettings | undefined {
    return this.strategies.get(id);
  }
  
  // Update a strategy's settings
  public updateStrategy(id: string, updates: Partial<StrategySettings>): boolean {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      return false;
    }
    
    this.strategies.set(id, { ...strategy, ...updates });
    
    // Update active status if it was changed
    if (updates.isActive !== undefined) {
      this.activeStrategies.set(id, updates.isActive);
    }
    
    this.saveStrategies();
    return true;
  }
  
  // Add a new strategy
  public addStrategy(strategy: StrategySettings): boolean {
    if (this.strategies.has(strategy.id)) {
      return false;
    }
    
    this.strategies.set(strategy.id, strategy);
    this.activeStrategies.set(strategy.id, strategy.isActive);
    this.saveStrategies();
    return true;
  }
  
  // Delete a strategy
  public deleteStrategy(id: string): boolean {
    if (!this.strategies.has(id)) {
      return false;
    }
    
    this.strategies.delete(id);
    this.activeStrategies.delete(id);
    this.saveStrategies();
    return true;
  }
  
  // Start the trading bot with enhanced error handling
  public start(): boolean {
    if (this.isRunning) {
      logger.warn("Attempted to start bot when already running");
      return false;
    }
    
    // Check if API keys are configured
    if (!binanceService.isConfigured()) {
      const errorMessage = "API-Keys nicht konfiguriert";
      logger.error(errorMessage);
      toast.error(errorMessage, {
        description: "Bitte konfiguriere deine Binance API-Keys, bevor du den Bot startest."
      });
      return false;
    }
    
    // Test API connection before starting
    this.testApiConnection().then(isConnected => {
      if (!isConnected) {
        this.stop();
        toast.error("API-Verbindung fehlgeschlagen", {
          description: "Bitte überprüfe deine API-Keys und Internetverbindung."
        });
        return;
      }
    });
    
    // Start analysis interval with error handling
    this.analysisInterval = setInterval(() => {
      this.runAnalysis().catch(error => {
        logger.error("Error in analysis interval", error);
      });
    }, 60000); // Run every minute
    
    this.isRunning = true;
    
    const message = "Trading-Bot gestartet";
    logger.info(message);
    toast.success(message, {
      description: "Der Bot analysiert nun den Markt gemäß den konfigurierten Strategien."
    });
    
    // Run initial analysis immediately
    this.runAnalysis().catch(error => {
      logger.error("Error in initial analysis", error);
    });
    
    return true;
  }
  
  // Test API connection
  private async testApiConnection(): Promise<boolean> {
    try {
      const isConnected = await binanceService.testConnection();
      if (isConnected) {
        logger.info("API connection test successful");
      } else {
        logger.error("API connection test failed");
      }
      return isConnected;
    } catch (error) {
      logger.error("API connection test error", error);
      return false;
    }
  }
  
  // Stop the trading bot with cleanup
  public stop(): boolean {
    if (!this.isRunning) {
      logger.warn("Attempted to stop bot when not running");
      return false;
    }
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    // Disconnect WebSocket
    binanceService.disconnectWebSocket();
    
    this.isRunning = false;
    
    const message = "Trading-Bot gestoppt";
    logger.info(message);
    toast.success(message, {
      description: "Der Bot wurde erfolgreich gestoppt und führt keine weiteren Analysen durch."
    });
    
    return true;
  }
  
  // Check if the bot is running
  public isActive(): boolean {
    return this.isRunning;
  }
  
  // Run analysis for all active strategies
  private async runAnalysis(): Promise<void> {
    try {
      // Rate limiting check
      const now = Date.now();
      if (now - this.lastApiCallTime < this.minApiCallInterval) {
        return;
      }
      this.lastApiCallTime = now;

      logger.debug("Starting market analysis");

      // Get active strategies
      const activeStrategies = Array.from(this.strategies.values())
        .filter(strategy => strategy.isActive);
      
      if (activeStrategies.length === 0) {
        logger.debug("No active strategies to analyze");
        return;
      }
      
      // Check trading limits
      if (this.shouldStopTrading()) {
        logger.info("Trading stopped due to daily limits");
        return;
      }
      
      // Collect all symbols from all strategies for efficient API calls
      const allSymbols = new Set<string>();
      activeStrategies.forEach(strategy => {
        strategy.symbols.forEach(symbol => allSymbols.add(symbol));
      });
      
      const symbols = Array.from(allSymbols);
      logger.debug("Analyzing symbols", { symbols, strategiesCount: activeStrategies.length });
      
      // Analyze each strategy for each symbol and timeframe
      for (const strategy of activeStrategies) {
        try {
          for (const symbol of strategy.symbols) {
            try {
              // Check each timeframe for the strategy
              for (const timeframe of strategy.timeframes) {
                try {
                  const signal = await this.analyzeRsiEmaStrategy(symbol, timeframe, strategy);
                  
                  if (signal) {
                    logger.logStrategy(strategy.id, "Signal detected", {
                      symbol: signal.symbol,
                      side: signal.side,
                      confidence: signal.confidence,
                      timeframe: signal.timeframe
                    });
                    
                    await this.executeSignal(signal, strategy);
                  }
                } catch (timeframeError) {
                  logger.error(`Error analyzing ${symbol} ${timeframe} with strategy ${strategy.id}`, timeframeError);
                }
              }
            } catch (symbolError) {
              logger.error(`Error analyzing ${symbol} with strategy ${strategy.id}`, symbolError);
            }
          }
        } catch (strategyError) {
          logger.error(`Error analyzing strategy ${strategy.id}`, strategyError);
        }
      }
    } catch (error) {
      logger.error("Critical error in market analysis", error);
      toast.error("Fehler bei der Marktanalyse", {
        description: "Der Bot versucht es in der nächsten Iteration erneut."
      });
    }
  }
  
  // Check if we should stop trading based on daily limits
  private shouldStopTrading(): boolean {
    // Get all strategies to find most restrictive limits
    const strategies = Array.from(this.strategies.values());
    
    if (strategies.length === 0) {
      return false;
    }
    
    // Find the most restrictive maxDailyLoss and maxTradesPerDay
    const maxDailyLoss = Math.min(...strategies.map(s => s.maxDailyLoss));
    const maxTradesPerDay = Math.min(...strategies.map(s => s.maxTradesPerDay));
    
    // Check daily loss
    const dailyPerformance = tradeService.getDailyPerformance(1)[0];
    const initialBalance = 100; // Initial balance (should match tradeService)
    
    if (dailyPerformance && Math.abs(dailyPerformance.profit) > (initialBalance * maxDailyLoss / 100)) {
      logger.log("Daily loss limit reached", { profit: dailyPerformance.profit.toFixed(2) });
      return true;
    }
    
    // Check max trades per day
    if (dailyPerformance && dailyPerformance.trades >= maxTradesPerDay) {
      logger.log("Max trades per day reached", { trades: dailyPerformance.trades, max: maxTradesPerDay });
      return true;
    }
    
    return false;
  }
  
  // Analyze using RSI + EMA Cross strategy
  private async analyzeRsiEmaStrategy(
    symbol: string, 
    timeframe: string,
    strategy: StrategySettings
  ): Promise<StrategySignal | null> {
    try {
      // Get OHLCV data from Binance
      const klines = await binanceService.getKlines(symbol, timeframe, 100);
      
      if (!klines || klines.length < strategy.indicators.emaLongPeriod + 10) {
        logger.log(`Not enough data for ${symbol} on ${timeframe}`);
        return null;
      }
      
      // Extract prices and calculate indicators
      const closes = klines.map(candle => parseFloat(candle.close));
      const volumes = klines.map(candle => parseFloat(candle.volume));
      
      // Calculate RSI
      const rsi = this.calculateRSI(closes, strategy.indicators.rsiPeriod);
      
      // Calculate EMAs
      const emaShort = this.calculateEMA(closes, strategy.indicators.emaShortPeriod);
      const emaLong = this.calculateEMA(closes, strategy.indicators.emaLongPeriod);
      
      const lastIndex = closes.length - 1;
      const prevIndex = lastIndex - 1;
      
      // Check for signals
      
      // LONG signal conditions
      const isLongSignal = 
        // RSI was oversold and is now coming back up
        (rsi[prevIndex] < strategy.indicators.rsiOversold && rsi[lastIndex] > rsi[prevIndex]) &&
        // EMA short crossed above EMA long
        (emaShort[prevIndex] < emaLong[prevIndex] && emaShort[lastIndex] > emaLong[lastIndex]) &&
        // Price is above short EMA
        (closes[lastIndex] > emaShort[lastIndex]) &&
        // Volume condition if enabled
        (!strategy.indicators.useVolume || volumes[lastIndex] > volumes.slice(-6, -1).reduce((a, b) => a + b, 0) / 5 * strategy.indicators.volumeThreshold);
      
      // SHORT signal conditions
      const isShortSignal =
        // RSI was overbought and is now coming back down
        (rsi[prevIndex] > strategy.indicators.rsiOverbought && rsi[lastIndex] < rsi[prevIndex]) &&
        // EMA short crossed below EMA long
        (emaShort[prevIndex] > emaLong[prevIndex] && emaShort[lastIndex] < emaLong[lastIndex]) &&
        // Price is below short EMA
        (closes[lastIndex] < emaShort[lastIndex]) &&
        // Volume condition if enabled
        (!strategy.indicators.useVolume || volumes[lastIndex] > volumes.slice(-6, -1).reduce((a, b) => a + b, 0) / 5 * strategy.indicators.volumeThreshold);
      
      // If no signal, return null
      if (!isLongSignal && !isShortSignal) {
        return null;
      }
      
      // Calculate confidence score (0-100)
      let confidence = 50; // Base confidence
      
      if (isLongSignal) {
        // RSI factor - higher confidence when RSI is more oversold and bouncing
        confidence += (strategy.indicators.rsiOversold - rsi[prevIndex]) / 2;
        // EMA crossover strength
        confidence += (emaShort[lastIndex] - emaLong[lastIndex]) / emaLong[lastIndex] * 1000;
        // Volume factor
        if (strategy.indicators.useVolume) {
          const volumeRatio = volumes[lastIndex] / (volumes.slice(-6, -1).reduce((a, b) => a + b, 0) / 5);
          confidence += Math.min(15, (volumeRatio - 1) * 10);
        }
        
        // Create signal
        const currentPrice = closes[lastIndex];
        const stopLossPrice = currentPrice * (1 - strategy.stopLoss / 100);
        const takeProfitPrice = currentPrice * (1 + strategy.takeProfit / 100);
        
        return {
          symbol,
          timeframe,
          side: 'LONG',
          entryPrice: currentPrice,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
          confidence: Math.min(99, Math.max(1, Math.round(confidence))),
          strategyId: strategy.id,
          timestamp: Date.now()
        };
      }
      
      if (isShortSignal) {
        // RSI factor - higher confidence when RSI is more overbought and dropping
        confidence += (rsi[prevIndex] - strategy.indicators.rsiOverbought) / 2;
        // EMA crossover strength
        confidence += (emaLong[lastIndex] - emaShort[lastIndex]) / emaLong[lastIndex] * 1000;
        // Volume factor
        if (strategy.indicators.useVolume) {
          const volumeRatio = volumes[lastIndex] / (volumes.slice(-6, -1).reduce((a, b) => a + b, 0) / 5);
          confidence += Math.min(15, (volumeRatio - 1) * 10);
        }
        
        // Create signal
        const currentPrice = closes[lastIndex];
        const stopLossPrice = currentPrice * (1 + strategy.stopLoss / 100);
        const takeProfitPrice = currentPrice * (1 - strategy.takeProfit / 100);
        
        return {
          symbol,
          timeframe,
          side: 'SHORT',
          entryPrice: currentPrice,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
          confidence: Math.min(99, Math.max(1, Math.round(confidence))),
          strategyId: strategy.id,
          timestamp: Date.now()
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`Error in RSI+EMA analysis for ${symbol} (${timeframe}):`, error);
      return null;
    }
  }
  
  // Execute a trading signal
  private async executeSignal(signal: StrategySignal, strategySettings: StrategySettings): Promise<void> {
    try {
      logger.logTrade("Signal received", signal.symbol, {
        side: signal.side,
        confidence: signal.confidence,
        strategyId: signal.strategyId
      });

      // Get latest price to ensure we're not using stale data
      const tickers = await binanceService.getTickers([signal.symbol]);
      if (!tickers || tickers.length === 0) {
        throw new Error(`Could not get current price for ${signal.symbol}`);
      }
      
      const currentPrice = parseFloat(tickers[0].price);
      
      // Validate price
      if (isNaN(currentPrice) || currentPrice <= 0) {
        throw new Error(`Invalid price received for ${signal.symbol}: ${currentPrice}`);
      }
      
      // Get real-time account info to calculate trade size
      const accountInfo = await binanceService.getAccountInfo();
      const usdtBalance = accountInfo.balances.find(b => b.asset === 'USDT');
      
      if (!usdtBalance) {
        throw new Error('No USDT balance found in account');
      }
      
      // Validate balance and risk calculations
      const availableBalance = parseFloat(usdtBalance.free);
      const riskPercentage = Number(strategySettings.riskPerTrade);
      
      if (isNaN(availableBalance) || availableBalance <= 0) {
        throw new Error(`Insufficient USDT balance: ${availableBalance}`);
      }
      
      if (isNaN(riskPercentage) || riskPercentage <= 0 || riskPercentage > 100) {
        throw new Error(`Invalid risk percentage: ${riskPercentage}%`);
      }
      
      // Calculate trade amount with safety checks
      const tradeAmount = availableBalance * (riskPercentage / 100);
      const minTradeAmount = 10; // Minimum $10 trade amount
      
      if (tradeAmount < minTradeAmount) {
        throw new Error(`Trade amount too small: ${tradeAmount} USDT (minimum: ${minTradeAmount} USDT)`);
      }
      
      if (tradeAmount > availableBalance) {
        throw new Error(`Trade amount exceeds available balance: ${tradeAmount} > ${availableBalance}`);
      }
      
      const quantity = (tradeAmount / currentPrice).toFixed(6);
      
      // Validate quantity
      if (parseFloat(quantity) <= 0) {
        throw new Error(`Invalid quantity calculated: ${quantity}`);
      }
      
      const orderType = 'MARKET';
      const orderSide = signal.side === 'LONG' ? 'BUY' : 'SELL';
      
      logger.logTrade("Executing order", signal.symbol, {
        side: orderSide,
        quantity,
        price: currentPrice,
        tradeAmount,
        availableBalance,
        riskPercentage
      });
      
      // Use test order for safety - change to createOrder for real trading
      const order = await binanceService.createTestOrder(
        signal.symbol,
        orderSide,
        orderType as any,
        quantity
      );
      
      if (order) {
        logger.logTrade("Order placed successfully", signal.symbol, {
          orderId: order.orderId,
          side: orderSide,
          quantity,
          price: currentPrice
        });
        
        // Log the trade
        const trade = tradeService.addTrade({
          symbol: signal.symbol,
          entryTime: Date.now(),
          strategyId: signal.strategyId,
          entryPrice: currentPrice,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          quantity: parseFloat(quantity),
          side: signal.side,
          status: 'OPEN',
          profit: 0,
          profitPercentage: 0,
          exitPrice: 0,
          exitTime: null,
          notes: `Signal confidence: ${signal.confidence}%, Timeframe: ${signal.timeframe}, Balance: ${availableBalance} USDT`
        });
        
        toast.success(
          `${signal.side} Signal erkannt: ${signal.symbol}`,
          {
            description: `Konfidenz: ${signal.confidence}%, Timeframe: ${signal.timeframe}, Einsatz: ${tradeAmount.toFixed(2)} USDT`
          }
        );
        
        // For demo/testing purposes, simulate trade completion
        this.simulateTradeCompletion(trade.id);
      }
    } catch (error) {
      logger.error("Error executing trade signal", error);
      toast.error("Fehler bei der Signalausführung", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
    }
  }
  
  // For demo/testing: simulate random trade completion
  private simulateTradeCompletion(tradeId: string): void {
    // Random delay between 5 and 15 minutes
    const delay = Math.floor(Math.random() * 10 + 5) * 60 * 1000;
    
    setTimeout(() => {
      try {
        const trade = tradeService.loadTradeHistory().trades.find(t => t.id === tradeId);
        if (!trade || trade.status !== 'OPEN') return;
        
        // Random outcome with 60% win rate
        const isWin = Math.random() < 0.6;
        
        // Calculate PnL (% between -stopLoss and +takeProfit)
        let pnlPercentage: number;
        let reason: 'TAKE_PROFIT' | 'STOP_LOSS';
        
        if (isWin) {
          // Win - between 50-100% of take profit
          pnlPercentage = trade.side === 'LONG' || trade.side === 'BUY'
            ? ((trade.takeProfit! - trade.entryPrice) / trade.entryPrice) * (0.5 + Math.random() * 0.5)
            : ((trade.entryPrice - trade.takeProfit!) / trade.entryPrice) * (0.5 + Math.random() * 0.5);
          reason = 'TAKE_PROFIT';
        } else {
          // Loss - between 80-100% of stop loss
          pnlPercentage = trade.side === 'LONG' || trade.side === 'BUY'
            ? -((trade.entryPrice - trade.stopLoss!) / trade.entryPrice) * (0.8 + Math.random() * 0.2)
            : -((trade.stopLoss! - trade.entryPrice) / trade.entryPrice) * (0.8 + Math.random() * 0.2);
          reason = 'STOP_LOSS';
        }
        
        // Calculate absolute PnL
        const pnl = trade.quantity * trade.entryPrice * pnlPercentage;
        
        // Calculate exit price
        const exitPrice = trade.side === 'LONG' || trade.side === 'BUY'
          ? trade.entryPrice * (1 + pnlPercentage)
          : trade.entryPrice * (1 - pnlPercentage);
        
        // Update trade
        tradeService.updateTrade(tradeId, {
          status: 'CLOSED',
          exitTime: Date.now(),
          exitPrice: exitPrice,
          pnl: pnl,
          profitPercentage: pnlPercentage * 100,
          reason: reason
        });
        
        // Notification
        const isPositive = pnl > 0;
        toast(
          isPositive ? 'Trade geschlossen mit Gewinn' : 'Trade geschlossen mit Verlust',
          {
            description: `${trade.symbol}: ${pnl.toFixed(2)} USDT (${(pnlPercentage * 100).toFixed(2)}%)`,
            icon: isPositive ? '📈' : '📉'
          }
        );
        
        // Update equity chart
        tradeService.updateEquity();
      } catch (error) {
        logger.error("Error in trade simulation", error);
      }
    }, delay);
  }
  
  // Calculate RSI (Relative Strength Index)
  private calculateRSI(prices: number[], period: number): number[] {
    const rsi: number[] = [];
    if (prices.length <= period) {
      return Array(prices.length).fill(50); // Not enough data
    }
    
    // Initialize with null values for the periods we can't calculate
    for (let i = 0; i < period; i++) {
      rsi.push(50); // Neutral RSI for initial periods
    }
    
    // Calculate first average gain and loss
    let gainSum = 0;
    let lossSum = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gainSum += change;
      } else {
        lossSum += Math.abs(change);
      }
    }
    
    let avgGain = gainSum / period;
    let avgLoss = lossSum / period;
    
    // Calculate RSI for remaining periods using smoothed averages
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      let currentGain = 0;
      let currentLoss = 0;
      
      if (change >= 0) {
        currentGain = change;
      } else {
        currentLoss = Math.abs(change);
      }
      
      // Smooth averages
      avgGain = ((avgGain * (period - 1)) + currentGain) / period;
      avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
      
      // Calculate RS and RSI
      const rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
      const currentRsi = 100 - (100 / (1 + rs));
      rsi.push(currentRsi);
    }
    
    return rsi;
  }
  
  // Calculate EMA (Exponential Moving Average)
  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Fill with SMA for first period
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
      ema.push(0); // Will overwrite later
    }
    
    // Initialize with SMA
    const sma = sum / period;
    ema[period - 1] = sma;
    
    // Calculate EMA for the rest
    for (let i = period; i < prices.length; i++) {
      const value = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
      ema.push(value);
    }
    
    return ema;
  }
}

// Singleton instance
export const strategyService = new StrategyService();

}
