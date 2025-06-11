
import { tradeService } from "./tradeService";
import { strategyService } from "./strategyService";
import { logger } from "./loggerService";
import { toast } from "sonner";

interface StopLossEvent {
  timestamp: number;
  symbol: string;
  tradeId: string;
}

interface PortfolioSnapshot {
  timestamp: number;
  totalValue: number;
}

class ExtremeStopService {
  private stopLossEvents: StopLossEvent[] = [];
  private portfolioSnapshots: PortfolioSnapshot[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MAX_PORTFOLIO_LOSS_4H = 10; // 10% max loss in 4 hours
  private readonly MAX_STOP_LOSSES_30MIN = 3; // Max 3 stop losses in 30 minutes
  
  constructor() {
    logger.info("ExtremeStopService initialized");
  }
  
  // Start monitoring for extreme stop conditions
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    // Check every minute for extreme conditions
    this.monitoringInterval = setInterval(() => {
      this.checkExtremeConditions();
    }, 60 * 1000);
    
    // Take initial portfolio snapshot
    this.takePortfolioSnapshot();
    
    logger.info("Extreme stop monitoring started");
  }
  
  // Stop monitoring
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    logger.info("Extreme stop monitoring stopped");
  }
  
  // Record a stop loss event
  public recordStopLoss(symbol: string, tradeId: string): void {
    const event: StopLossEvent = {
      timestamp: Date.now(),
      symbol,
      tradeId
    };
    
    this.stopLossEvents.push(event);
    
    // Clean up events older than 30 minutes
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    this.stopLossEvents = this.stopLossEvents.filter(e => e.timestamp > thirtyMinutesAgo);
    
    logger.logTrade("Stop loss recorded", symbol, { tradeId, totalStopLosses: this.stopLossEvents.length });
    
    // Check if we hit the stop loss limit
    this.checkStopLossLimit();
  }
  
  // Take portfolio snapshot
  private takePortfolioSnapshot(): void {
    try {
      // Calculate current portfolio value from trades
      const allTrades = tradeService.getRecentTrades(1000);
      const completedTrades = allTrades.filter(t => t.status === 'CLOSED' && t.pnl !== undefined);
      
      const totalPnL = completedTrades.reduce((sum, trade) => {
        const tradePnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
        return sum + tradePnl;
      }, 0);
      
      const initialBalance = 100; // Should match tradeService initial balance
      const currentValue = initialBalance + totalPnL;
      
      const snapshot: PortfolioSnapshot = {
        timestamp: Date.now(),
        totalValue: currentValue
      };
      
      this.portfolioSnapshots.push(snapshot);
      
      // Clean up snapshots older than 4 hours
      const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
      this.portfolioSnapshots = this.portfolioSnapshots.filter(s => s.timestamp > fourHoursAgo);
      
      logger.debug("Portfolio snapshot taken", { value: currentValue, snapshots: this.portfolioSnapshots.length });
    } catch (error) {
      logger.error("Error taking portfolio snapshot", error);
    }
  }
  
  // Check for extreme stop conditions
  private checkExtremeConditions(): void {
    this.takePortfolioSnapshot();
    this.checkPortfolioLoss();
    this.checkStopLossLimit();
  }
  
  // Check if portfolio lost more than 10% in 4 hours
  private checkPortfolioLoss(): void {
    if (this.portfolioSnapshots.length < 2) {
      return;
    }
    
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
    const oldSnapshots = this.portfolioSnapshots.filter(s => s.timestamp <= fourHoursAgo);
    
    if (oldSnapshots.length === 0) {
      return;
    }
    
    // Get the highest value from 4 hours ago or earlier
    const oldestHighValue = Math.max(...oldSnapshots.map(s => s.totalValue));
    const currentValue = this.portfolioSnapshots[this.portfolioSnapshots.length - 1].totalValue;
    
    // Calculate percentage loss
    const lossPercentage = oldestHighValue > 0 ? ((oldestHighValue - currentValue) / oldestHighValue) * 100 : 0;
    
    if (lossPercentage >= this.MAX_PORTFOLIO_LOSS_4H) {
      this.triggerExtremeStop('PORTFOLIO_LOSS', {
        lossPercentage: lossPercentage.toFixed(2),
        oldValue: oldestHighValue.toFixed(2),
        currentValue: currentValue.toFixed(2)
      });
    }
  }
  
  // Check if we hit the stop loss limit (3 in 30 minutes)
  private checkStopLossLimit(): void {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    const recentStopLosses = this.stopLossEvents.filter(e => e.timestamp > thirtyMinutesAgo);
    
    if (recentStopLosses.length >= this.MAX_STOP_LOSSES_30MIN) {
      this.triggerExtremeStop('STOP_LOSS_LIMIT', {
        stopLossCount: recentStopLosses.length,
        timeWindow: '30 minutes'
      });
    }
  }
  
  // Trigger extreme stop protocol
  private triggerExtremeStop(reason: 'PORTFOLIO_LOSS' | 'STOP_LOSS_LIMIT', details: any): void {
    logger.log(`EXTREME STOP TRIGGERED: ${reason}`, details);
    
    // Stop the trading bot
    if (strategyService.isActive()) {
      strategyService.stop();
    }
    
    // Show critical alert
    const message = reason === 'PORTFOLIO_LOSS' 
      ? `Portfolio-Verlust von ${details.lossPercentage}% in 4 Stunden erkannt!`
      : `${details.stopLossCount} Stop-Loss-Orders in ${details.timeWindow} ausgelöst!`;
    
    toast.error("🚨 EXTREM-STOPP AKTIVIERT!", {
      description: `${message} Bot wurde automatisch gestoppt.`,
      duration: 10000
    });
    
    // Log the extreme stop event
    logger.error(`Extreme stop protocol activated: ${reason}`, {
      reason,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  // Get current status
  public getStatus() {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    const recentStopLosses = this.stopLossEvents.filter(e => e.timestamp > thirtyMinutesAgo);
    
    let portfolioLoss4h = 0;
    if (this.portfolioSnapshots.length >= 2) {
      const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
      const oldSnapshots = this.portfolioSnapshots.filter(s => s.timestamp <= fourHoursAgo);
      
      if (oldSnapshots.length > 0) {
        const oldestHighValue = Math.max(...oldSnapshots.map(s => s.totalValue));
        const currentValue = this.portfolioSnapshots[this.portfolioSnapshots.length - 1].totalValue;
        portfolioLoss4h = oldestHighValue > 0 ? ((oldestHighValue - currentValue) / oldestHighValue) * 100 : 0;
      }
    }
    
    return {
      isMonitoring: this.isMonitoring,
      recentStopLosses: recentStopLosses.length,
      maxStopLosses: this.MAX_STOP_LOSSES_30MIN,
      portfolioLoss4h: portfolioLoss4h.toFixed(2),
      maxPortfolioLoss: this.MAX_PORTFOLIO_LOSS_4H,
      portfolioSnapshots: this.portfolioSnapshots.length
    };
  }
  
  // Reset all tracking data
  public reset(): void {
    this.stopLossEvents = [];
    this.portfolioSnapshots = [];
    logger.info("Extreme stop service reset");
  }
}

// Singleton instance
export const extremeStopService = new ExtremeStopService();
