
#!/bin/bash

echo "🔨 Building Trading Bot for Production..."

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
npm install

echo "🎨 Building frontend..."
npm run build

# Install server dependencies
echo "📡 Installing server dependencies..."
cd server && npm install --omit=dev && cd ..

echo "🚀 Starting production server..."
node server/index.js
