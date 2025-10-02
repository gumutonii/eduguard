#!/bin/bash

# EduGuard Backend Startup Script

echo "🚀 Starting EduGuard Backend..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   mongod"
    echo ""
    echo "   Or install MongoDB if not installed:"
    echo "   brew install mongodb-community (macOS)"
    echo "   sudo apt-get install mongodb (Ubuntu)"
    exit 1
fi

# Set environment variables
export NODE_ENV=development
export PORT=3000
export MONGODB_URI=mongodb://localhost:27017/eduguard
export JWT_SECRET=eduguard-super-secret-jwt-key-2024-development
export JWT_EXPIRE=7d
export FRONTEND_URL=http://localhost:5173

echo "📊 Environment: $NODE_ENV"
echo "🔗 MongoDB: $MONGODB_URI"
echo "🌐 Port: $PORT"
echo ""

# Start the server
node server.js
