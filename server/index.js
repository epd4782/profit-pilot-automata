
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// In-memory storage (replace with database in production)
let trades = [];
let strategies = [];
let accountData = {
  totalBalance: 1000,
  availableBalance: 1000,
  totalPnL: 0
};

// Binance API simulation
const simulateBinanceAPI = {
  getAccountInfo: () => ({
    balances: [
      { asset: 'USDT', free: accountData.availableBalance.toString(), locked: '0' },
      { asset: 'BTC', free: '0', locked: '0' }
    ]
  }),
  
  getPrice: (symbol) => {
    // Simulate price data
    const prices = {
      'BTCUSDT': (50000 + Math.random() * 10000).toFixed(2),
      'ETHUSDT': (3000 + Math.random() * 1000).toFixed(2),
      'ADAUSDT': (0.5 + Math.random() * 0.5).toFixed(4)
    };
    return { symbol, price: prices[symbol] || '100.00' };
  },
  
  placeOrder: (orderData) => {
    const orderId = Date.now().toString();
    const trade = {
      id: orderId,
      symbol: orderData.symbol,
      side: orderData.side,
      quantity: parseFloat(orderData.quantity),
      price: parseFloat(orderData.price || '0'),
      status: 'FILLED',
      timestamp: new Date().toISOString(),
      pnl: (Math.random() - 0.5) * 100 // Random PnL for simulation
    };
    
    trades.push(trade);
    
    // Update account balance
    if (orderData.side === 'BUY') {
      accountData.availableBalance -= trade.quantity * trade.price;
    } else {
      accountData.availableBalance += trade.quantity * trade.price;
    }
    
    accountData.totalPnL += trade.pnl;
    
    return trade;
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/account', (req, res) => {
  try {
    const accountInfo = simulateBinanceAPI.getAccountInfo();
    res.json({
      ...accountInfo,
      totalPnL: accountData.totalPnL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/price/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const priceData = simulateBinanceAPI.getPrice(symbol);
    res.json(priceData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trades', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const recentTrades = trades.slice(-limit).reverse();
  res.json(recentTrades);
});

app.post('/api/trades', (req, res) => {
  try {
    const { symbol, side, quantity, price, type = 'MARKET' } = req.body;
    
    if (!symbol || !side || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const trade = simulateBinanceAPI.placeOrder({
      symbol,
      side,
      quantity,
      price,
      type
    });
    
    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/strategies', (req, res) => {
  res.json(strategies);
});

app.post('/api/strategies', (req, res) => {
  try {
    const strategy = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      isActive: false
    };
    
    strategies.push(strategy);
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/strategies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const strategyIndex = strategies.findIndex(s => s.id === id);
    
    if (strategyIndex === -1) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    strategies[strategyIndex] = {
      ...strategies[strategyIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json(strategies[strategyIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/strategies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const strategyIndex = strategies.findIndex(s => s.id === id);
    
    if (strategyIndex === -1) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    strategies.splice(strategyIndex, 1);
    res.json({ message: 'Strategy deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Market data endpoint
app.get('/api/market/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const priceData = simulateBinanceAPI.getPrice(symbol);
    
    // Simulate additional market data
    const marketData = {
      ...priceData,
      change24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 1000000,
      high24h: parseFloat(priceData.price) * (1 + Math.random() * 0.1),
      low24h: parseFloat(priceData.price) * (1 - Math.random() * 0.1),
      timestamp: new Date().toISOString()
    };
    
    res.json(marketData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Portfolio summary endpoint
app.get('/api/portfolio', (req, res) => {
  try {
    const completedTrades = trades.filter(t => t.status === 'FILLED');
    const totalTrades = completedTrades.length;
    const profitableTrades = completedTrades.filter(t => t.pnl > 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    
    const portfolio = {
      totalBalance: accountData.totalBalance,
      availableBalance: accountData.availableBalance,
      totalPnL: accountData.totalPnL,
      totalTrades,
      profitableTrades,
      winRate: winRate.toFixed(2),
      activeStrategies: strategies.filter(s => s.isActive).length,
      timestamp: new Date().toISOString()
    };
    
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Trading Bot Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

module.exports = app;
