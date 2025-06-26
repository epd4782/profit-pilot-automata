
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Account endpoints
  async getAccountInfo() {
    return this.request('/account');
  }

  // Trading endpoints
  async getTrades(limit: number = 50) {
    return this.request(`/trades?limit=${limit}`);
  }

  async placeTrade(tradeData: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price?: number;
    type?: string;
  }) {
    return this.request('/trades', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
  }

  // Strategy endpoints
  async getStrategies() {
    return this.request('/strategies');
  }

  async createStrategy(strategyData: any) {
    return this.request('/strategies', {
      method: 'POST',
      body: JSON.stringify(strategyData),
    });
  }

  async updateStrategy(id: string, strategyData: any) {
    return this.request(`/strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(strategyData),
    });
  }

  async deleteStrategy(id: string) {
    return this.request(`/strategies/${id}`, {
      method: 'DELETE',
    });
  }

  // Market data endpoints
  async getPrice(symbol: string) {
    return this.request(`/price/${symbol}`);
  }

  async getMarketData(symbol: string) {
    return this.request(`/market/${symbol}`);
  }

  // Portfolio endpoints
  async getPortfolio() {
    return this.request('/portfolio');
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
