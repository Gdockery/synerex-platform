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

EMV_PORT=$(echo "$EMV_BASE_URL" | awk -F: '{print $3}')
PDF_PORT=$(echo "$PDF_SERVICE_URL" | awk -F: '{print $3}')
HTML_PORT=$(echo "$HTML_REPORT_URL" | awk -F: '{print $3}')
WEATHER_PORT=$(echo "$WEATHER_SERVICE_URL" | awk -F: '{print $3}')
CHART_PORT=$(echo "$CHART_SERVICE_URL" | awk -F: '{print $3}')

check_service $EMV_PORT "Main App" "$EMV_BASE_URL/api/health"
check_service $PDF_PORT "PDF Generator" "$PDF_SERVICE_URL/health"
check_service $HTML_PORT "HTML Reports" "$HTML_REPORT_URL/health"
check_service $WEATHER_PORT "Weather Service" "$WEATHER_SERVICE_URL/health"
check_service $CHART_PORT "Chart Service" "$CHART_SERVICE_URL/health"

echo ""
echo "Port Usage Summary:"
echo "-------------------"

# Show what's using each port
for port in $EMV_PORT $PDF_PORT $HTML_PORT $WEATHER_PORT $CHART_PORT; do
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
echo "🌐 Open main app: open $EMV_BASE_URL"



