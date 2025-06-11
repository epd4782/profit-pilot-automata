
import { toast } from "sonner";
import CryptoJS from 'crypto-js';

// Types for Binance API responses
export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface BinanceTicker {
  symbol: string;
  price: string;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  buyBaseVolume: string;
  buyQuoteVolume: string;
  ignore: string;
}

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  time: number;
}

export interface BinanceAccountInfo {
  balances: BinanceBalance[];
  permissions: string[];
  accountType: string;
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
}

class BinanceService {
  private baseUrl: string;
  private apiKey: string | null;
  private secretKey: string | null;
  private isTestnet: boolean = true; // Start with testnet for safety
  private webSocket: WebSocket | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.apiKey = this.getStoredApiKey();
    this.secretKey = this.getStoredSecretKey();
    this.baseUrl = this.isTestnet ? 
      "https://testnet.binance.vision/api" : 
      "https://api.binance.com/api";
  }

  private getStoredApiKey(): string | null {
    try {
      return localStorage.getItem("binance_api_key");
    } catch (error) {
      console.error("Error retrieving API key:", error);
      return null;
    }
  }

  private getStoredSecretKey(): string | null {
    try {
      return localStorage.getItem("binance_secret_key");
    } catch (error) {
      console.error("Error retrieving secret key:", error);
      return null;
    }
  }

  public isConfigured(): boolean {
    return !!(this.apiKey && this.secretKey);
  }

  public setTestnet(isTestnet: boolean): void {
    this.isTestnet = isTestnet;
    this.baseUrl = isTestnet ? 
      "https://testnet.binance.vision/api" : 
      "https://api.binance.com/api";
  }

  // Generate HMAC SHA256 signature for authenticated requests
  private generateSignature(queryString: string): string {
    if (!this.secretKey) {
      throw new Error("Secret key not available for signature generation");
    }
    
    return CryptoJS.HmacSHA256(queryString, this.secretKey).toString();
  }

  // Create query string with timestamp and signature
  private createSignedQuery(params: Record<string, any> = {}): string {
    const timestamp = Date.now();
    const queryParams = {
      ...params,
      timestamp: timestamp,
      recvWindow: 5000
    };
    
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
    
    const signature = this.generateSignature(queryString);
    return `${queryString}&signature=${signature}`;
  }

  // Make authenticated API request with retry logic
  private async makeAuthenticatedRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    params: Record<string, any> = {}
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error("API keys are not configured");
    }

    const signedQuery = this.createSignedQuery(params);
    const url = `${this.baseUrl}${endpoint}?${signedQuery}`;
    
    const headers = {
      'X-MBX-APIKEY': this.apiKey!,
      'Content-Type': 'application/json'
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
          
          // Handle specific Binance error codes
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait before making more requests.');
          }
          
          if (response.status === 401) {
            throw new Error('Invalid API credentials. Please check your API keys.');
          }
          
          throw new Error(`API Error ${response.status}: ${errorData.msg || errorData.message || 'Unknown error'}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`API request attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Make public API request (no authentication needed)
  private async makePublicRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Public API Error ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Public API request attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Get account information including balances
  public async getAccountInfo(): Promise<BinanceAccountInfo> {
    try {
      console.log("Fetching real account info from Binance...");
      
      const accountData = await this.makeAuthenticatedRequest('/v3/account');
      
      console.log("Account data received:", {
        balanceCount: accountData.balances?.length,
        permissions: accountData.permissions,
        canTrade: accountData.canTrade
      });
      
      return accountData;
    } catch (error) {
      console.error("Error fetching account info:", error);
      toast.error("Fehler beim Abrufen der Konto-Informationen", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
      throw error;
    }
  }

  // Get current ticker prices for multiple symbols
  public async getTickers(symbols: string[] = []): Promise<BinanceTicker[]> {
    try {
      const endpoint = '/v3/ticker/price';
      let tickers;
      
      if (symbols.length > 0) {
        // Get specific symbols
        const symbolsParam = `["${symbols.join('","')}"]`;
        tickers = await this.makePublicRequest(endpoint, { symbols: symbolsParam });
      } else {
        // Get all tickers
        tickers = await this.makePublicRequest(endpoint);
      }
      
      return Array.isArray(tickers) ? tickers : [tickers];
    } catch (error) {
      console.error("Error fetching tickers:", error);
      throw error;
    }
  }

  // Get klines (candlestick data)
  public async getKlines(symbol: string, interval: string, limit = 100): Promise<BinanceKline[]> {
    try {
      const rawKlines = await this.makePublicRequest('/v3/klines', {
        symbol,
        interval,
        limit
      });
      
      // Transform raw kline data to our interface
      return rawKlines.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteVolume: kline[7],
        trades: kline[8],
        buyBaseVolume: kline[9],
        buyQuoteVolume: kline[10],
        ignore: kline[11]
      }));
    } catch (error) {
      console.error(`Error fetching klines for ${symbol}:`, error);
      throw error;
    }
  }

  // Place a test order (for testing without real trades)
  public async createTestOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT',
    quantity: string,
    price?: string,
    stopPrice?: string
  ): Promise<BinanceOrder> {
    try {
      const orderParams: any = {
        symbol,
        side,
        type,
        quantity
      };
      
      if (price && (type === 'LIMIT' || type === 'STOP_LOSS' || type === 'TAKE_PROFIT')) {
        orderParams.price = price;
        orderParams.timeInForce = 'GTC';
      }
      
      if (stopPrice && (type === 'STOP_LOSS' || type === 'TAKE_PROFIT')) {
        orderParams.stopPrice = stopPrice;
      }
      
      console.log("Creating test order:", orderParams);
      
      const orderResult = await this.makeAuthenticatedRequest('/v3/order/test', 'POST', orderParams);
      
      // Test endpoint returns empty object on success, so we create a mock response
      return {
        symbol,
        orderId: Date.now(), // Mock order ID
        clientOrderId: `test_${Date.now()}`,
        price: price || "0.00",
        origQty: quantity,
        executedQty: "0.00",
        status: "TEST",
        timeInForce: "GTC",
        type,
        side,
        stopPrice: stopPrice || "0.00",
        time: Date.now()
      };
    } catch (error) {
      console.error("Error creating test order:", error);
      toast.error("Fehler beim Erstellen der Test-Order", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
      throw error;
    }
  }

  // Place a real order (USE WITH CAUTION!)
  public async createOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT',
    quantity: string,
    price?: string,
    stopPrice?: string
  ): Promise<BinanceOrder> {
    try {
      const orderParams: any = {
        symbol,
        side,
        type,
        quantity
      };
      
      if (price && (type === 'LIMIT' || type === 'STOP_LOSS' || type === 'TAKE_PROFIT')) {
        orderParams.price = price;
        orderParams.timeInForce = 'GTC';
      }
      
      if (stopPrice && (type === 'STOP_LOSS' || type === 'TAKE_PROFIT')) {
        orderParams.stopPrice = stopPrice;
      }
      
      console.log("Creating REAL order:", orderParams);
      
      // WARNING: This places a real order with real money!
      const orderResult = await this.makeAuthenticatedRequest('/v3/order', 'POST', orderParams);
      
      toast.success(`${side === 'BUY' ? 'Kauf' : 'Verkauf'}-Order erfolgreich platziert`, {
        description: `${quantity} ${symbol.replace('USDT', '')} ${price ? `für ${price} USDT` : 'zum Marktpreis'}`
      });
      
      return orderResult;
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Fehler beim Platzieren der Order", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
      throw error;
    }
  }

  // Connect to WebSocket for real-time price updates with reconnection logic
  public connectWebSocket(symbols: string[], callback: (data: any) => void): () => void {
    try {
      this.disconnectWebSocket();
      
      const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
      const wsUrl = this.isTestnet 
        ? `wss://testnet.binance.vision/ws/${streams}`
        : `wss://stream.binance.com:9443/ws/${streams}`;
      
      console.log("Connecting to WebSocket:", wsUrl);
      
      const connect = () => {
        this.webSocket = new WebSocket(wsUrl);
        
        this.webSocket.onopen = () => {
          console.log('WebSocket connected successfully');
          toast.success("WebSocket verbunden", {
            description: "Echtzeit-Preisdaten werden empfangen"
          });
        };
        
        this.webSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            callback(data);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };
        
        this.webSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast.error("WebSocket-Verbindungsfehler");
        };
        
        this.webSocket.onclose = (event) => {
          console.log('WebSocket connection closed', event.code, event.reason);
          
          // Attempt to reconnect after 5 seconds if not manually closed
          if (event.code !== 1000) {
            setTimeout(() => {
              console.log('Attempting to reconnect WebSocket...');
              connect();
            }, 5000);
          }
        };
      };
      
      connect();
      
      return () => {
        if (this.webSocket) {
          this.webSocket.close(1000, 'Manual disconnect');
          this.webSocket = null;
        }
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      toast.error("Fehler beim Verbinden zum WebSocket");
      throw error;
    }
  }
  
  // Disconnect WebSocket
  public disconnectWebSocket(): void {
    if (this.webSocket) {
      this.webSocket.close(1000, 'Manual disconnect');
      this.webSocket = null;
    }
  }

  // Test API connection
  public async testConnection(): Promise<boolean> {
    try {
      await this.makeAuthenticatedRequest('/v3/account');
      return true;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  }

  // Get server time (useful for debugging timestamp issues)
  public async getServerTime(): Promise<number> {
    try {
      const result = await this.makePublicRequest('/v3/time');
      return result.serverTime;
    } catch (error) {
      console.error("Error getting server time:", error);
      throw error;
    }
  }
}

// Singleton instance
export const binanceService = new BinanceService();
