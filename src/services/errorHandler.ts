import { toast } from "sonner";
import { logger } from "./loggerService";

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorInfo {
  message: string;
  severity: ErrorSeverity;
  context?: string;
  data?: any;
  timestamp: number;
}

class ErrorHandlerService {
  private errorHistory: ErrorInfo[] = [];
  private maxErrorHistory: number = 100;

  // Handle different types of errors with appropriate responses
  public handleError(error: Error | string, context?: string, data?: any, severity: ErrorSeverity = 'medium'): void {
    const errorMessage = error instanceof Error ? error.message : error;
    
    const errorInfo: ErrorInfo = {
      message: errorMessage,
      severity,
      context,
      data,
      timestamp: Date.now()
    };

    this.errorHistory.push(errorInfo);
    
    // Keep only recent errors
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }

    // Log the error
    logger.error(`${context ? `[${context}] ` : ''}${errorMessage}`, { severity, data });

    // Show user notification based on severity
    this.showUserNotification(errorInfo);

    // Take action based on severity
    this.handleBySeverity(errorInfo);
  }

  private showUserNotification(errorInfo: ErrorInfo): void {
    const { message, severity, context } = errorInfo;
    
    switch (severity) {
      case 'low':
        // Don't show notification for low severity errors
        break;
      
      case 'medium':
        toast.warning(`${context ? `${context}: ` : ''}${message}`);
        break;
      
      case 'high':
        toast.error(`Fehler: ${message}`, {
          description: context ? `Kontext: ${context}` : undefined,
          duration: 10000
        });
        break;
      
      case 'critical':
        toast.error(`Kritischer Fehler: ${message}`, {
          description: "Der Bot wurde möglicherweise gestoppt. Bitte überprüfen Sie die Einstellungen.",
          duration: 15000
        });
        break;
    }
  }

  private handleBySeverity(errorInfo: ErrorInfo): void {
    switch (errorInfo.severity) {
      case 'critical':
        // For critical errors, you might want to stop the bot or take other emergency actions
        this.handleCriticalError(errorInfo);
        break;
      
      case 'high':
        // For high severity errors, maybe pause trading temporarily
        this.handleHighSeverityError(errorInfo);
        break;
      
      default:
        // For medium and low severity, just log and continue
        break;
    }
  }

  private handleCriticalError(errorInfo: ErrorInfo): void {
    logger.error("Critical error detected, taking emergency actions", errorInfo);
    
    // Here you could implement emergency actions like:
    // - Stopping the bot
    // - Closing all open positions
    // - Sending alerts to administrators
    
    // For now, we'll just log it
    console.error("CRITICAL ERROR:", errorInfo);
  }

  private handleHighSeverityError(errorInfo: ErrorInfo): void {
    logger.warn("High severity error detected", errorInfo);
    
    // Here you could implement actions like:
    // - Temporarily pausing new trades
    // - Increasing monitoring frequency
    // - Sending notifications to users
  }

  // Get recent errors for debugging
  public getRecentErrors(severity?: ErrorSeverity, limit: number = 20): ErrorInfo[] {
    let filteredErrors = this.errorHistory;
    
    if (severity) {
      filteredErrors = this.errorHistory.filter(error => error.severity === severity);
    }
    
    return filteredErrors.slice(-limit);
  }

  // Clear error history
  public clearErrorHistory(): void {
    this.errorHistory = [];
    logger.info("Error history cleared");
  }

  // Check if there are too many recent errors (circuit breaker pattern)
  public hasExcessiveErrors(timeWindowMs: number = 300000, maxErrors: number = 10): boolean {
    const cutoffTime = Date.now() - timeWindowMs;
    const recentErrors = this.errorHistory.filter(error => error.timestamp > cutoffTime);
    
    return recentErrors.length >= maxErrors;
  }

  // Handle specific error types
  public handleApiError(error: Error, endpoint: string, statusCode?: number): void {
    let severity: ErrorSeverity = 'medium';
    let context = `API Call: ${endpoint}`;
    
    if (statusCode) {
      context += ` (${statusCode})`;
      
      // Determine severity based on status code
      if (statusCode >= 500) {
        severity = 'high'; // Server errors
      } else if (statusCode === 429) {
        severity = 'medium'; // Rate limiting
      } else if (statusCode === 401 || statusCode === 403) {
        severity = 'critical'; // Authentication errors
      }
    }
    
    this.handleError(error, context, { endpoint, statusCode }, severity);
  }

  public handleTradingError(error: Error, symbol: string, action: string): void {
    this.handleError(error, `Trading: ${action} ${symbol}`, { symbol, action }, 'high');
  }

  public handleStrategyError(error: Error, strategyId: string, symbol?: string): void {
    const context = `Strategy: ${strategyId}${symbol ? ` (${symbol})` : ''}`;
    this.handleError(error, context, { strategyId, symbol }, 'medium');
  }

  public handleWebSocketError(error: Error): void {
    this.handleError(error, 'WebSocket', null, 'medium');
  }
}

export const errorHandler = new ErrorHandlerService();
