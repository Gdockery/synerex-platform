#!/bin/bash

echo "🌤️  Starting Weather Service on port 8200..."

# Kill any existing weather service processes
echo "Stopping existing weather service processes..."
pkill -f weather_service.py 2>/dev/null || echo "No existing processes found"

# Wait a moment
sleep 2

# Start the weather service
echo "Starting weather service..."
cd /Users/euphoria/Downloads/oneform/8085
nohup python3 weather_service.py > weather_service.log 2>&1 &

# Wait for service to start
sleep 3

# Check if service is running
echo "Checking service status..."
if curl -s http://localhost:8200/health > /dev/null; then
    echo "✅ Weather service is running and healthy"
    echo "🌐 Weather Service: http://localhost:8200"
    echo "📋 Health Check: http://localhost:8200/health"
    echo "📊 Status: http://localhost:8200/status"
else
    echo "❌ Weather service failed to start"
    echo "📋 Check logs: tail -f /Users/euphoria/Downloads/oneform/8085/weather_service.log"
fi

