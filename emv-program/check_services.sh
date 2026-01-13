#!/bin/bash

# SYNEREX OneForm - Check Service Status
# This script checks if all SYNEREX services are running and healthy

echo "🔍 SYNEREX OneForm Service Status Check"
echo "======================================"
echo ""

# Function to check a service
check_service() {
    local port=$1
    local service_name=$2
    local health_url=$3
    
    echo -n "Checking $service_name (port $port)... "
    
    # Check if port is in use
    if ! lsof -ti:$port >/dev/null 2>&1; then
        echo "❌ NOT RUNNING"
        return 1
    fi
    
    # Check health endpoint
    if curl -s "$health_url" >/dev/null 2>&1; then
        echo "✅ RUNNING & HEALTHY"
        return 0
    else
        echo "⚠️  RUNNING BUT UNHEALTHY"
        return 1
    fi
}

# Check all services
echo "Service Status:"
echo "---------------"

check_service 8082 "Main App" "http://127.0.0.1:8082/api/health"
check_service 8083 "PDF Generator" "http://127.0.0.1:8083/health"
check_service 8084 "HTML Reports" "http://127.0.0.1:8084/health"
check_service 8200 "Weather Service" "http://127.0.0.1:8200/health"
check_service 8086 "Chart Service" "http://127.0.0.1:8086/health"

echo ""
echo "Port Usage Summary:"
echo "-------------------"

# Show what's using each port
for port in 8082 8083 8084 8200 8086; do
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        local process=$(ps -p $pid -o comm= 2>/dev/null)
        echo "Port $port: PID $pid ($process)"
    else
        echo "Port $port: Available"
    fi
done

echo ""
echo "Log Files (if services are running):"
echo "------------------------------------"
if [ -d "logs" ]; then
    for log in logs/*.log; do
        if [ -f "$log" ]; then
            echo "📝 $(basename "$log"): $(wc -l < "$log") lines"
        fi
    done
else
    echo "No logs directory found"
fi

echo ""
echo "Quick Commands:"
echo "---------------"
echo "🛑 Stop all services: ./stop_services.sh"
echo "🚀 Start all services: ./start_services.sh"
echo "🌐 Open main app: open http://127.0.0.1:8082"



