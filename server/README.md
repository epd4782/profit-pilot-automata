
# Trading Bot Backend Server

## Overview
Express.js backend server for the Trading Bot application with simulated trading capabilities.

## Features
- REST API endpoints for trading operations
- Account management
- Strategy management  
- Market data simulation
- Trade execution simulation
- Portfolio tracking

## API Endpoints

### Health
- `GET /api/health` - Server health check

### Account
- `GET /api/account` - Get account information and balances

### Trading
- `GET /api/trades` - Get recent trades
- `POST /api/trades` - Place a new trade

### Strategies
- `GET /api/strategies` - Get all strategies
- `POST /api/strategies` - Create new strategy
- `PUT /api/strategies/:id` - Update strategy
- `DELETE /api/strategies/:id` - Delete strategy

### Market Data
- `GET /api/price/:symbol` - Get current price for symbol
- `GET /api/market/:symbol` - Get market data for symbol

### Portfolio
- `GET /api/portfolio` - Get portfolio summary

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Notes

This server uses in-memory storage for simplicity. In production, you should integrate with a proper database like PostgreSQL or MongoDB.
