#!/bin/bash

# SYNEREX OneForm - Start All Services
# This script starts all 5 SYNEREX services

echo "🚀 Starting SYNEREX OneForm Services..."

# First, stop any existing services
echo "Step 1: Stopping any existing services..."
./stop_services.sh

echo ""
echo "Step 2: Checking prerequisites..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies from all requirements files
echo "Installing dependencies..."
echo "  Installing numpy first (required for pandas)..."
pip install "numpy>=1.26.0"
echo "  Installing main app dependencies..."
pip install -r 8082/requirements.txt || {
    echo "    ⚠️  Main app dependencies failed, trying with updated versions..."
    pip install flask==2.3.3 werkzeug==2.3.7 openpyxl==3.1.2 "numpy>=1.26.0" "pandas>=2.2.0" "matplotlib>=3.8.0" "seaborn>=0.13.0" "scipy>=1.11.0" requests==2.31.0 urllib3==2.0.4
}
echo "  Installing service manager dependencies..."
pip install -r requirements_service_manager.txt
echo "  Installing PDF service dependencies..."
if [ -f "8083/requirements.txt" ]; then
    pip install -r 8083/requirements.txt || {
        echo "    ⚠️  PDF service dependencies failed, trying with updated versions..."
        pip install "reportlab>=4.0.0" "Pillow>=10.0.0" "lxml>=6.0.0" || echo "    ⚠️  PDF dependencies partially failed, continuing..."
    }
else
    echo "    (8083 requirements.txt not found, skipping)"
fi
echo "  Installing weather service dependencies..."
if [ -f "8085/requirements.txt" ]; then
    pip install -r 8085/requirements.txt || echo "    ⚠️  Weather service dependencies failed, but continuing..."
else
    echo "    (8085 requirements.txt not found, skipping)"
fi
echo "  Installing Ollama AI dependencies..."
if [ -f "8082/requirements_ollama.txt" ]; then
    pip install -r 8082/requirements_ollama.txt || echo "    ⚠️  Ollama dependencies failed, but continuing..."
else
    echo "    (Ollama requirements.txt not found, skipping)"
fi
echo "✅ All dependencies installed"

echo ""
echo "Step 3: Starting services..."

# Create logs directory
mkdir -p logs

# Function to start a service
start_service() {
    local port=$1
    local service_name=$2
    local script_path=$3
    local log_file="logs/$(echo "$service_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '_').log"
    
    echo "Starting $service_name on port $port..."
    
    # Start service in background
    cd "$(dirname "$script_path")"
    python3 "$(basename "$script_path")" > "../$log_file" 2>&1 &
    local pid=$!
    cd - > /dev/null
    
    # Wait a moment for startup
    sleep 2
    
    # Check if service is running
    if kill -0 $pid 2>/dev/null; then
        echo "  ✅ $service_name started (PID: $pid)"
        echo "  📝 Log: $log_file"
    else
        echo "  ❌ $service_name failed to start"
        echo "  📝 Check log: $log_file"
    fi
}

# Start all services
start_service 8082 "Main App" "8082/main_hardened_ready_refactored.py"
start_service 8083 "PDF Generator" "8083/enhanced_pdf_service.py"
start_service 8084 "HTML Reports" "8084/html_report_service.py"
start_service 8200 "Weather Service" "8085/weather_service.py"
start_service 8086 "Chart Service" "8086/chart_service.py"
start_service 8090 "Ollama AI Backend" "8082/ollama_ai_backend.py"

echo ""
echo "Step 4: Waiting for services to initialize..."
sleep 5

echo ""
echo "🎉 SYNEREX OneForm Services Started!"
echo ""
echo "📋 Service URLs:"
echo "  Main App:     $EMV_BASE_URL"
echo "  PDF Service:  $PDF_SERVICE_URL"
echo "  HTML Reports: $HTML_REPORT_URL"
echo "  Weather:      $WEATHER_SERVICE_URL"
echo "  Charts:       $CHART_SERVICE_URL"
echo "  Ollama AI:    $OLLAMA_AI_URL"
echo ""
echo "📝 Logs are in the 'logs/' directory"
echo ""
echo "🛑 To stop all services, run: ./stop_services.sh"
echo "🔍 To check service status, run: ./check_services.sh"
echo ""
# Try to open browser (works on macOS, skip on Linux)
if command -v xdg-open &> /dev/null; then
    echo "🌐 Opening main application in browser..."
    xdg-open $EMV_BASE_URL 2>/dev/null || true
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🌐 Opening main application in browser..."
    open $EMV_BASE_URL 2>/dev/null || true
fi
