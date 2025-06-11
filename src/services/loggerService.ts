type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isDevelopment: boolean = true; // Set to false in production

  constructor() {
    // In production, you might want to send logs to a remote service
    this.isDevelopment = import.meta.env.DEV;
  }

  private addLog(level: LogLevel, message: string, data?: any, source?: string): void {
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
      source
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      switch (level) {
        case 'debug':
          console.debug(logMessage, data);
          break;
        case 'info':
          console.info(logMessage, data);
          break;
        case 'warn':
          console.warn(logMessage, data);
          break;
        case 'error':
          console.error(logMessage, data);
          break;
      }
    }

    // In production, you could send critical logs to a remote service
    if (!this.isDevelopment && (level === 'error' || level === 'warn')) {
      this.sendToRemoteLogger(logEntry);
    }
  }

  public debug(message: string, data?: any, source?: string): void {
    this.addLog('debug', message, data, source);
  }

  public info(message: string, data?: any, source?: string): void {
    this.addLog('info', message, data, source);
  }

  public warn(message: string, data?: any, source?: string): void {
    this.addLog('warn', message, data, source);
  }

  public error(message: string, data?: any, source?: string): void {
    this.addLog('error', message, data, source);
  }

  public getRecentLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  public clearLogs(): void {
    this.logs = [];
  }

  // Log trading-specific events
  public logTrade(action: string, symbol: string, data: any): void {
    this.info(`Trade ${action}: ${symbol}`, data, 'TradeService');
  }

  public logStrategy(strategyId: string, action: string, data?: any): void {
    this.info(`Strategy ${strategyId}: ${action}`, data, 'StrategyService');
  }

  public logApiCall(endpoint: string, method: string, success: boolean, data?: any): void {
    if (success) {
      this.debug(`API Call: ${method} ${endpoint}`, data, 'BinanceService');
    } else {
      this.error(`API Call Failed: ${method} ${endpoint}`, data, 'BinanceService');
    }
  }

  // Send critical logs to remote service (implement based on your needs)
  private async sendToRemoteLogger(logEntry: LogEntry): Promise<void> {
    try {
      // Example: Send to a logging service like LogRocket, Sentry, or custom endpoint
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }
}

export const logger = new LoggerService();
