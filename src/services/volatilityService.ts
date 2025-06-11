
import { binanceService } from "./binanceService";
import { logger } from "./loggerService";

export interface VolatilityData {
  symbol: string;
  volatilityScore: number;
  highPrice: number;
  lowPrice: number;
  avgPrice: number;
  priceChange24h: number;
  volume24h: number;
  lastUpdated: number;
}

export interface VolatilityRanking {
  symbol: string;
  rank: number;
  volatilityScore: number;
  isEligible: boolean;
}

class VolatilityService {
  private volatilityData: Map<string, VolatilityData> = new Map();
  private minVolatilityThreshold: number = 3.0; // 3% minimum volatility
  private updateInterval: NodeJS.Timeout | null = null;
  private isTracking: boolean = false;
  
  constructor() {
    logger.info("VolatilityService initialized");
  }
  
  // Start real-time volatility tracking
  public startTracking(): void {
    if (this.isTracking) {
      return;
    }
    
    this.isTracking = true;
    
    // Update volatility data every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updateVolatilityData().catch(error => {
        logger.error("Error updating volatility data", error);
      });
    }, 5 * 60 * 1000);
    
    // Initial update
    this.updateVolatilityData();
    
    logger.info("Volatility tracking started");
  }
  
  // Stop volatility tracking
  public stopTracking(): void {
    if (!this.isTracking) {
      return;
    }
    
    this.isTracking = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    logger.info("Volatility tracking stopped");
  }
  
  // Update volatility data for all symbols
  private async updateVolatilityData(): Promise<void> {
    try {
      // Get 24h ticker statistics for all symbols
      const tickers = await binanceService.getTickers([]);
      
      // Get top 50 USDT pairs by volume
      const usdtPairs = tickers
        .filter(ticker => ticker.symbol.endsWith('USDT'))
        .map(ticker => ({
          symbol: ticker.symbol,
          price: parseFloat(ticker.price)
        }))
        .slice(0, 50);
      
      // Get 24h statistics for each symbol
      for (const pair of usdtPairs) {
        try {
          const klines = await binanceService.getKlines(pair.symbol, '1d', 2);
          
          if (klines && klines.length >= 1) {
            const todayKline = klines[klines.length - 1];
            const high = parseFloat(todayKline.high);
            const low = parseFloat(todayKline.low);
            const open = parseFloat(todayKline.open);
            const close = parseFloat(todayKline.close);
            const volume = parseFloat(todayKline.volume);
            
            // Calculate average price
            const avgPrice = (high + low + open + close) / 4;
            
            // Calculate volatility score: (High - Low) / Average * 100
            const volatilityScore = avgPrice > 0 ? ((high - low) / avgPrice) * 100 : 0;
            
            // Calculate 24h price change percentage
            const priceChange24h = open > 0 ? ((close - open) / open) * 100 : 0;
            
            const volatilityData: VolatilityData = {
              symbol: pair.symbol,
              volatilityScore,
              highPrice: high,
              lowPrice: low,
              avgPrice,
              priceChange24h,
              volume24h: volume,
              lastUpdated: Date.now()
            };
            
            this.volatilityData.set(pair.symbol, volatilityData);
          }
        } catch (error) {
          logger.debug(`Error updating volatility for ${pair.symbol}`, error);
        }
      }
      
      logger.debug(`Updated volatility data for ${this.volatilityData.size} symbols`);
    } catch (error) {
      logger.error("Error in volatility data update", error);
    }
  }
  
  // Check if symbol meets volatility threshold
  public isVolatilityEligible(symbol: string): boolean {
    const data = this.volatilityData.get(symbol);
    
    if (!data) {
      return false;
    }
    
    return data.volatilityScore >= this.minVolatilityThreshold;
  }
  
  // Get volatility data for a specific symbol
  public getVolatilityData(symbol: string): VolatilityData | null {
    return this.volatilityData.get(symbol) || null;
  }
  
  // Get volatility ranking (sorted by highest volatility)
  public getVolatilityRanking(): VolatilityRanking[] {
    const rankings: VolatilityRanking[] = [];
    
    // Convert map to array and sort by volatility score
    const sortedData = Array.from(this.volatilityData.values())
      .sort((a, b) => b.volatilityScore - a.volatilityScore);
    
    sortedData.forEach((data, index) => {
      rankings.push({
        symbol: data.symbol,
        rank: index + 1,
        volatilityScore: data.volatilityScore,
        isEligible: data.volatilityScore >= this.minVolatilityThreshold
      });
    });
    
    return rankings;
  }
  
  // Get top volatile symbols
  public getTopVolatileSymbols(limit: number = 10): string[] {
    return this.getVolatilityRanking()
      .filter(ranking => ranking.isEligible)
      .slice(0, limit)
      .map(ranking => ranking.symbol);
  }
  
  // Set minimum volatility threshold
  public setMinVolatilityThreshold(threshold: number): void {
    this.minVolatilityThreshold = threshold;
    logger.info(`Volatility threshold updated to ${threshold}%`);
  }
  
  // Get current threshold
  public getMinVolatilityThreshold(): number {
    return this.minVolatilityThreshold;
  }
  
  // Get all volatility data
  public getAllVolatilityData(): VolatilityData[] {
    return Array.from(this.volatilityData.values());
  }
}

// Singleton instance
export const volatilityService = new VolatilityService();
