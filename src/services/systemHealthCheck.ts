
import { binanceService } from './binanceService';
import { strategyService } from './strategyService';
import { tradeService } from './tradeService';
import { logger } from './loggerService';
import { tradingConfig } from '../config/tradingConfig';

export interface SystemHealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  checks: {
    apiConnection: boolean;
    apiKeysValid: boolean;
    accountAccess: boolean;
    strategiesLoaded: boolean;
    configValid: boolean;
    tradingPermissions: boolean;
  };
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

class SystemHealthService {
  
  public async performFullHealthCheck(): Promise<SystemHealthReport> {
    const report: SystemHealthReport = {
      overall: 'healthy',
      checks: {
        apiConnection: false,
        apiKeysValid: false,
        accountAccess: false,
        strategiesLoaded: false,
        configValid: false,
        tradingPermissions: false
      },
      warnings: [],
      errors: [],
      recommendations: []
    };

    logger.info("Starting comprehensive system health check...");

    // Check 1: API Configuration
    await this.checkApiConfiguration(report);
    
    // Check 2: API Connection
    await this.checkApiConnection(report);
    
    // Check 3: Account Access
    await this.checkAccountAccess(report);
    
    // Check 4: Trading Permissions
    await this.checkTradingPermissions(report);
    
    // Check 5: Strategy Configuration
    await this.checkStrategyConfiguration(report);
    
    // Check 6: Trading Configuration
    await this.checkTradingConfiguration(report);

    // Determine overall health
    const criticalChecks = Object.values(report.checks);
    const failedCritical = criticalChecks.filter(check => !check).length;
    
    if (failedCritical === 0) {
      report.overall = 'healthy';
    } else if (failedCritical <= 2) {
      report.overall = 'warning';
    } else {
      report.overall = 'critical';
    }

    logger.info("System health check completed", {
      overall: report.overall,
      failedChecks: failedCritical,
      warnings: report.warnings.length,
      errors: report.errors.length
    });

    return report;
  }

  private async checkApiConfiguration(report: SystemHealthReport): Promise<void> {
    try {
      const isConfigured = binanceService.isConfigured();
      report.checks.apiKeysValid = isConfigured;
      
      if (!isConfigured) {
        report.errors.push("API-Keys nicht konfiguriert");
        report.recommendations.push("Bitte konfiguriere deine Binance API-Keys");
      } else {
        logger.info("API keys configuration check passed");
      }
    } catch (error) {
      report.errors.push("Fehler bei API-Key-Überprüfung");
      logger.error("API configuration check failed", error);
    }
  }

  private async checkApiConnection(report: SystemHealthReport): Promise<void> {
    try {
      const serverTime = await binanceService.getServerTime();
      report.checks.apiConnection = true;
      
      // Check time sync (should be within 5 minutes)
      const timeDiff = Math.abs(Date.now() - serverTime);
      if (timeDiff > 5 * 60 * 1000) {
        report.warnings.push("Systemzeit weicht stark von Binance-Serverzeit ab");
        report.recommendations.push("Überprüfe die Systemzeit deines Servers");
      }
      
      logger.info("API connection check passed", { serverTime, localTime: Date.now() });
    } catch (error) {
      report.checks.apiConnection = false;
      report.errors.push("Keine Verbindung zur Binance API möglich");
      report.recommendations.push("Überprüfe Internetverbindung und Firewall-Einstellungen");
      logger.error("API connection check failed", error);
    }
  }

  private async checkAccountAccess(report: SystemHealthReport): Promise<void> {
    try {
      const accountInfo = await binanceService.getAccountInfo();
      report.checks.accountAccess = true;
      
      // Check account type and permissions
      if (!accountInfo.canTrade) {
        report.errors.push("Trading auf diesem Account nicht erlaubt");
        report.recommendations.push("Aktiviere Trading-Berechtigung in deinen API-Einstellungen");
      }
      
      // Check USDT balance
      const usdtBalance = accountInfo.balances.find(b => b.asset === 'USDT');
      const availableUsdt = usdtBalance ? parseFloat(usdtBalance.free) : 0;
      
      if (availableUsdt < tradingConfig.trading.minTradeAmount) {
        report.warnings.push(`Geringes USDT-Guthaben: ${availableUsdt} USDT`);
        report.recommendations.push(`Mindestens ${tradingConfig.trading.minTradeAmount} USDT für Trading erforderlich`);
      }
      
      logger.info("Account access check passed", {
        canTrade: accountInfo.canTrade,
        availableUsdt,
        balanceCount: accountInfo.balances.length
      });
      
    } catch (error) {
      report.checks.accountAccess = false;
      report.errors.push("Kein Zugriff auf Account-Informationen");
      report.recommendations.push("Überprüfe API-Key-Berechtigungen (SPOT Trading erforderlich)");
      logger.error("Account access check failed", error);
    }
  }

  private async checkTradingPermissions(report: SystemHealthReport): Promise<void> {
    try {
      // Test order placement (test order)
      await binanceService.createTestOrder('BTCUSDT', 'BUY', 'MARKET', '0.001');
      report.checks.tradingPermissions = true;
      logger.info("Trading permissions check passed");
    } catch (error) {
      report.checks.tradingPermissions = false;
      report.errors.push("Keine Trading-Berechtigung");
      report.recommendations.push("Aktiviere Trading-Berechtigung für deinen API-Key");
      logger.error("Trading permissions check failed", error);
    }
  }

  private async checkStrategyConfiguration(report: SystemHealthReport): Promise<void> {
    try {
      const strategies = strategyService.getAllStrategies();
      report.checks.strategiesLoaded = strategies.length > 0;
      
      const activeStrategies = strategies.filter(s => s.isActive);
      
      if (strategies.length === 0) {
        report.errors.push("Keine Handelsstrategien konfiguriert");
        report.recommendations.push("Erstelle mindestens eine Handelsstrategie");
      } else if (activeStrategies.length === 0) {
        report.warnings.push("Keine aktiven Handelsstrategien");
        report.recommendations.push("Aktiviere mindestens eine Handelsstrategie");
      }
      
      // Validate strategy settings
      strategies.forEach(strategy => {
        if (strategy.symbols.length === 0) {
          report.warnings.push(`Strategie "${strategy.name}" hat keine Handelspaare konfiguriert`);
        }
        if (strategy.riskPerTrade > 5) {
          report.warnings.push(`Hoher Risiko-Prozentsatz in Strategie "${strategy.name}": ${strategy.riskPerTrade}%`);
        }
      });
      
      logger.info("Strategy configuration check completed", {
        totalStrategies: strategies.length,
        activeStrategies: activeStrategies.length
      });
      
    } catch (error) {
      report.errors.push("Fehler beim Laden der Strategien");
      logger.error("Strategy configuration check failed", error);
    }
  }

  private async checkTradingConfiguration(report: SystemHealthReport): Promise<void> {
    try {
      const config = tradingConfig;
      report.checks.configValid = true;
      
      // Validate configuration
      if (config.trading.enableRealTrading && config.binance.testnet) {
        report.warnings.push("Real Trading aktiviert aber Testnet-Modus eingeschaltet");
        report.recommendations.push("Deaktiviere Testnet für Live-Trading oder deaktiviere Real Trading für Tests");
      }
      
      if (config.trading.maxTradeAmount < config.trading.minTradeAmount) {
        report.errors.push("Maximaler Trade-Betrag ist kleiner als minimaler Trade-Betrag");
      }
      
      if (config.trading.defaultRiskPerTrade > 10) {
        report.warnings.push(`Sehr hoher Standard-Risiko-Prozentsatz: ${config.trading.defaultRiskPerTrade}%`);
        report.recommendations.push("Erwäge niedrigeren Risiko-Prozentsatz für besseres Risikomanagement");
      }
      
      logger.info("Trading configuration check passed", {
        testnet: config.binance.testnet,
        realTrading: config.trading.enableRealTrading,
        defaultRisk: config.trading.defaultRiskPerTrade
      });
      
    } catch (error) {
      report.checks.configValid = false;
      report.errors.push("Fehler in Trading-Konfiguration");
      logger.error("Trading configuration check failed", error);
    }
  }
}

export const systemHealthService = new SystemHealthService();
