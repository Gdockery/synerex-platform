#!/bin/bash

# SYNEREX OneForm - Stop All Services
# This script stops all SYNEREX services running on ports 8082, 8083, 8084, 8200, 8086

echo "🛑 Stopping SYNEREX OneForm Services..."

# Function to stop service on a specific port
stop_service() {
    local port=$1
    local service_name=$2
    
    echo "Checking port $port ($service_name)..."
    
    # Find process using the port
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        echo "  Found process $pid on port $port, stopping..."
        kill -TERM $pid 2>/dev/null
        
        # Wait for graceful shutdown
        sleep 2
        
        # Check if still running, force kill if necessary
        if kill -0 $pid 2>/dev/null; then
            echo "  Force killing process $pid..."
            kill -KILL $pid 2>/dev/null
        fi
        
        echo "  ✅ $service_name stopped"
    else
        echo "  ℹ️  No process found on port $port"
    fi
}

# Stop all services
stop_service 8082 "Main App"
stop_service 8083 "PDF Generator"
stop_service 8084 "HTML Reports"
stop_service 8200 "Weather Service"
stop_service 8086 "Chart Service"
stop_service 8090 "Ollama AI Backend"

echo ""
echo "✅ All SYNEREX services stopped"
echo ""

# Show final status
echo "Final port status:"
for port in 8082 8083 8084 8200 8086 8090; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "  Port $port: ❌ Still in use"
    else
        echo "  Port $port: ✅ Available"
    fi
done
