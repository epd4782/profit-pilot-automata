
#!/bin/bash

echo "🚀 Starting Trading Bot in Development Mode..."

# Check if server dependencies are installed
if [ ! -d "server/node_modules" ]; then
  echo "📦 Installing server dependencies..."
  cd server && npm install && cd ..
fi

# Start the backend server in development mode
echo "📡 Starting backend server..."
cd server && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start the frontend development server
echo "🎨 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "🌐 Frontend: http://localhost:8080"
echo "📡 Backend API: http://localhost:3001/api"
echo "🔍 Health Check: http://localhost:3001/api/health"

# Handle cleanup on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Wait for processes
wait
