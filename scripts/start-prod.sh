
#!/bin/bash

# Production startup script

echo "🚀 Starting Trading Bot in Production Mode..."

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install --only=production

# Start the server
echo "🚁 Starting production server..."
npm start
