import { binanceService } from "./binanceService";
import { tradeService } from "./tradeService";
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
  
  constructor() {
    this.loadStrategies();
  }
  
  // Load strategies from localStorage
  private loadStrategies(): void {
    try {
      const storedStrategies = localStorage.getItem('trading_strategies');
      if (storedStrategies) {
        const strategies = JSON.parse(storedStrategies) as StrategySettings[];
        strategies.forEach(strategy => {
          this.strategies.set(strategy.id, strategy);
          this.activeStrategies.set(strategy.id, strategy.isActive);
        });
      } else {
        // Add default RSI + EMA Cross strategy if no strategies exist
        const defaultStrategy = this.getDefaultRsiEmaStrategy();
        this.strategies.set(defaultStrategy.id, defaultStrategy);
        this.activeStrategies.set(defaultStrategy.id, defaultStrategy.isActive);
        this.saveStrategies();
      }
    } catch (error) {
      console.error("Error loading strategies:", error);
      toast.error("Fehler beim Laden der Trading-Strategien");
      
      // Add default strategy as fallback
      const defaultStrategy = this.getDefaultRsiEmaStrategy();
      this.strategies.set(defaultStrategy.id, defaultStrategy);
      this.activeStrategies.set(defaultStrategy.id, defaultStrategy.isActive);
    }
  }
  
  // Save strategies to localStorage
  private saveStrategies(): void {
    try {
      const strategiesToSave = Array.from(this.strategies.values());
      localStorage.setItem('trading_strategies', JSON.stringify(strategiesToSave));
    } catch (error) {
      console.error("Error saving strategies:", error);
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
  
  // Start the trading bot
  public start(): boolean {
    if (this.isRunning) {
      return false;
    }
    
    // Check if API keys are configured
    if (!binanceService.isConfigured()) {
      toast.error("API-Keys nicht konfiguriert", {
        description: "Bitte konfiguriere deine Binance API-Keys, bevor du den Bot startest."
      });
      return false;
    }
    
    // Start analysis interval
    this.analysisInterval = setInterval(() => this.runAnalysis(), 60000); // Run every minute
    this.isRunning = true;
    
    toast.success("Trading-Bot gestartet", {
      description: "Der Bot analysiert nun den Markt gemäß den konfigurierten Strategien."
    });
    
    // Run initial analysis immediately
    this.runAnalysis();
    
    return true;
  }
  
  // Stop the trading bot
  public stop(): boolean {
    if (!this.isRunning) {
      return false;
    }
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    this.isRunning = false;
    
    toast.success("Trading-Bot gestoppt", {
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
      // Get active strategies
      const activeStrategies = Array.from(this.strategies.values())
        .filter(strategy => strategy.isActive);
      
      if (activeStrategies.length === 0) {
        console.log("No active strategies to analyze");
        return;
      }
      
      // Check trading limits
      if (this.shouldStopTrading()) {
        console.log("Trading stopped due to daily loss limit or max trades reached");
        return;
      }
      
      // Collect all symbols from all strategies for efficient API calls
      const allSymbols = new Set<string>();
      activeStrategies.forEach(strategy => {
        strategy.symbols.forEach(symbol => allSymbols.add(symbol));
      });
      
      const symbols = Array.from(allSymbols);
      console.log(`Running analysis for symbols: ${symbols.join(', ')}`);
      
      // Analyze each strategy for each symbol and timeframe
      for (const strategy of activeStrategies) {
        for (const symbol of strategy.symbols) {
          try {
            // Check each timeframe for the strategy
            for (const timeframe of strategy.timeframes) {
              const signal = await this.analyzeRsiEmaStrategy(symbol, timeframe, strategy);
              
              if (signal) {
                console.log(`Signal detected: ${symbol} ${signal.side} (${signal.confidence}% confidence)`);
                this.executeSignal(signal, strategy);
              }
            }
          } catch (symbolError) {
            console.error(`Error analyzing ${symbol} with strategy ${strategy.id}:`, symbolError);
          }
        }
      }
    } catch (error) {
      console.error("Error running analysis:", error);
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
      console.log(`Daily loss limit reached: ${dailyPerformance.profit.toFixed(2)} USDT`);
      return true;
    }
    
    // Check max trades per day
    if (dailyPerformance && dailyPerformance.trades >= maxTradesPerDay) {
      console.log(`Max trades per day reached: ${dailyPerformance.trades}/${maxTradesPerDay}`);
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
        console.log(`Not enough data for ${symbol} on ${timeframe}`);
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
      console.error(`Error in RSI+EMA analysis for ${symbol} (${timeframe}):`, error);
      return null;
    }
  }
  
  // Execute a trading signal
  private async executeSignal(signal: StrategySignal, strategySettings: StrategySettings): Promise<void> {
    try {
      // Get latest price to ensure we're not using stale data
      const tickers = await binanceService.getTickers([signal.symbol]);
      if (!tickers || tickers.length === 0) {
        console.error(`Could not get current price for ${signal.symbol}`);
        return;
      }
      
      const currentPrice = parseFloat(tickers[0].price);
      
      // Calculate trade size based on risk settings
      const accountInfo = await binanceService.getAccountInfo();
      const usdtBalance = accountInfo.balances.find(b => b.asset === 'USDT');
      
      if (!usdtBalance) {
        console.error('Could not determine USDT balance');
        return;
      }
      
      const availableBalance = parseFloat(usdtBalance.free);
      const tradeAmount = availableBalance * (strategySettings.riskPerTrade / 100);
      const quantity = (tradeAmount / currentPrice).toFixed(6);
      
      // Convert LONG/SHORT to BUY/SELL for Binance API
      const orderType = 'MARKET';
      const orderSide = signal.side === 'LONG' ? 'BUY' : 'SELL';
      
      // For demo/test purposes, use createTestOrder
      // In production, you would use createOrder
      const order = await binanceService.createTestOrder(
        signal.symbol,
        orderSide,
        orderType as any,
        quantity
      );
      
      if (order) {
        console.log(`Order placed: ${orderSide} ${quantity} ${signal.symbol} at ${currentPrice}`);
        
        // Log the trade with timestamp as number
        const trade = tradeService.addTrade({
          symbol: signal.symbol,
          entryTime: Date.now(),
          strategyId: signal.strategyId,
          entryPrice: currentPrice,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          quantity: parseFloat(quantity),
          side: signal.side, // Now Trade interface supports LONG/SHORT directly
          status: 'OPEN',
          profit: 0,
          profitPercentage: 0,
          exitPrice: 0,
          exitTime: null,
          notes: `Signal confidence: ${signal.confidence}%, Timeframe: ${signal.timeframe}`
        });
        
        toast.success(
          `${signal.side} Signal erkannt: ${signal.symbol}`,
          {
            description: `Konfidenz: ${signal.confidence}%, Timeframe: ${signal.timeframe}`
          }
        );
        
        // For demo/testing purposes, simulate trade completion after a delay
        this.simulateTradeCompletion(trade.id);
      }
    } catch (error) {
      console.error("Error executing trade signal:", error);
      toast.error("Fehler bei der Signalausführung");
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
        console.error("Error in trade simulation:", error);
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
