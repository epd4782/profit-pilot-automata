
#!/bin/bash

# Railway Deployment Script
# Requires: Railway CLI installed and logged in

set -e

PROJECT_NAME="trading-bot"

echo "🚄 Starting Railway deployment..."

# Check if project exists
if railway status > /dev/null 2>&1; then
    echo "✅ Railway project exists"
else
    echo "📦 Creating new Railway project..."
    railway init $PROJECT_NAME
    railway login
fi

# Deploy
echo "🚀 Deploying to Railway..."
railway up

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set VITE_TRADING_MODE=production

echo "🔐 Please set these environment variables in Railway dashboard:"
echo "  - VITE_BINANCE_API_KEY"
echo "  - VITE_BINANCE_SECRET_KEY"
echo "  - VITE_BINANCE_TESTNET=false"
echo "  - VITE_ENABLE_REAL_TRADING=true"

# Get deployment URL
RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)

echo "🎉 Railway deployment finished!"
echo "🌐 Trading Bot URL: $RAILWAY_URL"
echo "🔧 Railway Dashboard: https://railway.app/dashboard"
