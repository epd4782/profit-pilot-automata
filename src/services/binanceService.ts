
import { toast } from "sonner";

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

class BinanceService {
  private baseUrl: string;
  private apiKey: string | null;
  private secretKey: string | null;
  private isTestnet: boolean = true;
  private webSocket: WebSocket | null = null;

  constructor() {
    this.apiKey = localStorage.getItem("binance_api_key");
    this.secretKey = localStorage.getItem("binance_secret_key");
    this.baseUrl = this.isTestnet ? 
      "https://testnet.binance.vision/api" : 
      "https://api.binance.com";
  }

  public isConfigured(): boolean {
    return !!(this.apiKey && this.secretKey);
  }

  // Helper for signing requests
  private generateSignature(queryString: string): string {
    if (!this.secretKey) return "";
    
    // In a production app, this should use a proper HMAC SHA256 function
    // For demo purposes, we'll return a mock signature
    return "mocksignature" + Date.now().toString();
  }

  // Get account information including balances
  public async getAccountInfo() {
    try {
      if (!this.isConfigured()) {
        throw new Error("API keys are not configured");
      }

      // In a real implementation, this would call the Binance API
      // For demo purposes, returning mock data
      return {
        balances: [
          { asset: "USDT", free: "243.78", locked: "0.00" },
          { asset: "BTC", free: "0.0024", locked: "0.00" },
          { asset: "ETH", free: "0.0521", locked: "0.00" },
          { asset: "BNB", free: "0.1482", locked: "0.00" }
        ],
        permissions: ["SPOT"],
        accountType: "SPOT",
      };
    } catch (error) {
      console.error("Error fetching account info:", error);
      toast.error("Fehler beim Abrufen der Konto-Informationen");
      throw error;
    }
  }

  // Get current ticker prices for multiple symbols
  public async getTickers(symbols: string[]) {
    try {
      // In a real implementation, this would call the Binance API
      return [
        { symbol: "BTCUSDT", price: "51900.23" },
        { symbol: "ETHUSDT", price: "2465.78" },
        { symbol: "BNBUSDT", price: "440.21" }
      ].filter(ticker => !symbols.length || symbols.includes(ticker.symbol));
    } catch (error) {
      console.error("Error fetching tickers:", error);
      throw error;
    }
  }

  // Get klines (candlestick data)
  public async getKlines(symbol: string, interval: string, limit = 100) {
    try {
      // In a real implementation, this would call the Binance API
      // For demo purposes, returning mock data
      return Array.from({ length: limit }, (_, i) => {
        const baseTime = Date.now() - (limit - i) * 60000 * (interval === "1m" ? 1 : interval === "5m" ? 5 : 15);
        const closePrice = 50000 + Math.random() * 2000;
        const openPrice = closePrice - Math.random() * 100 + 50;
        const highPrice = Math.max(openPrice, closePrice) + Math.random() * 50;
        const lowPrice = Math.min(openPrice, closePrice) - Math.random() * 50;
        
        return {
          openTime: baseTime,
          open: openPrice.toFixed(2),
          high: highPrice.toFixed(2),
          low: lowPrice.toFixed(2),
          close: closePrice.toFixed(2),
          volume: (Math.random() * 10 + 1).toFixed(2),
          closeTime: baseTime + 59999,
          quoteVolume: (Math.random() * 500000 + 10000).toFixed(2),
          trades: Math.floor(Math.random() * 100 + 10),
          buyBaseVolume: (Math.random() * 5 + 0.5).toFixed(2),
          buyQuoteVolume: (Math.random() * 250000 + 5000).toFixed(2),
          ignore: "0"
        };
      });
    } catch (error) {
      console.error(`Error fetching klines for ${symbol}:`, error);
      throw error;
    }
  }

  // Place a test order
  public async createTestOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT',
    quantity: string,
    price?: string,
    stopPrice?: string
  ) {
    try {
      if (!this.isConfigured()) {
        throw new Error("API keys are not configured");
      }
      
      // In a real implementation, this would call the Binance API
      // For demo purposes, returning mock data
      return {
        symbol,
        orderId: Math.floor(Math.random() * 1000000),
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
      toast.error("Fehler beim Erstellen der Test-Order");
      throw error;
    }
  }

  // Place a real order
  public async createOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT',
    quantity: string,
    price?: string,
    stopPrice?: string
  ) {
    try {
      if (!this.isConfigured()) {
        throw new Error("API keys are not configured");
      }
      
      // In a real implementation, this would call the Binance API
      // For demo purposes, returning mock data and showing success toast
      const order = {
        symbol,
        orderId: Math.floor(Math.random() * 1000000),
        clientOrderId: `order_${Date.now()}`,
        price: price || "0.00",
        origQty: quantity,
        executedQty: quantity,
        status: "FILLED",
        timeInForce: "GTC",
        type,
        side,
        stopPrice: stopPrice || "0.00",
        time: Date.now()
      };
      
      toast.success(`${side === 'BUY' ? 'Kauf' : 'Verkauf'}-Order erfolgreich platziert`, {
        description: `${quantity} ${symbol.replace('USDT', '')} für ${price || 'Marktpreis'} USDT`
      });
      
      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Fehler beim Platzieren der Order");
      throw error;
    }
  }

  // Connect to WebSocket for real-time price updates
  public connectWebSocket(symbols: string[], callback: (data: any) => void) {
    try {
      // Close existing connection if any
      if (this.webSocket) {
        this.webSocket.close();
      }
      
      const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
      const wsUrl = this.isTestnet 
        ? `wss://testnet.binance.vision/ws/${streams}`
        : `wss://stream.binance.com:9443/ws/${streams}`;
      
      this.webSocket = new WebSocket(wsUrl);
      
      this.webSocket.onopen = () => {
        console.log('WebSocket connected');
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
      
      this.webSocket.onclose = () => {
        console.log('WebSocket connection closed');
      };
      
      return () => {
        if (this.webSocket) {
          this.webSocket.close();
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
  public disconnectWebSocket() {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }
}

// Singleton instance
export const binanceService = new BinanceService();
