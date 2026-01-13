# SYNEREX OneForm - Mac Setup

## Quick Start

### 1. Start All Services
```bash
./start_services.sh
```

### 2. Check Service Status
```bash
./check_services.sh
```

### 3. Stop All Services
```bash
./stop_services.sh
```

## What the Scripts Do

### `start_services.sh`
- Automatically stops any existing services first
- Creates Python virtual environment if needed
- Installs required dependencies
- Starts all 5 services in background:
  - Main App (8082)
  - PDF Generator (8083) 
  - HTML Reports (8084)
  - Weather Service (8200)
  - Chart Service (8086)
- Opens main application in browser

### `stop_services.sh`
- Finds and stops all services on ports 8082, 8083, 8084, 8200, 8086
- Gracefully terminates processes
- Shows final port status

### `check_services.sh`
- Checks if all services are running
- Tests health endpoints
- Shows port usage
- Lists log files

## Service URLs

Once running, access:
- **Main App**: http://127.0.0.1:8082
- **PDF Service**: http://127.0.0.1:8083
- **HTML Reports**: http://127.0.0.1:8084
- **Weather Service**: http://127.0.0.1:8200
- **Chart Service**: http://127.0.0.1:8086

## Troubleshooting

### Python Not Found
```bash
# Install Python 3.8+ from https://python.org
# Or use Homebrew:
brew install python
```

### Port Already in Use
```bash
# Check what's using the port:
lsof -ti:8082

# Kill the process:
kill -9 $(lsof -ti:8082)
```

### Services Won't Start
```bash
# Check logs:
ls -la logs/

# View specific service log:
tail -f logs/main_app.log
```

## Manual Service Management

### Start Individual Services
```bash
# Main App
cd 8082 && python3 main_hardened_ready_refactored.py

# PDF Generator  
cd 8083 && python3 enhanced_pdf_service.py

# HTML Reports
cd 8084 && python3 html_report_service.py

# Weather Service
cd 8085 && python3 weather_service.py

# Chart Service
cd 8086 && python3 chart_service.py
```

### Check Service Health
```bash
curl http://127.0.0.1:8082/api/health
curl http://127.0.0.1:8083/health
curl http://127.0.0.1:8084/health
curl http://127.0.0.1:8200/health
curl http://127.0.0.1:8086/health
```

## Files Created

- `start_services.sh` - Start all services (Mac)
- `stop_services.sh` - Stop all services (Mac)  
- `check_services.sh` - Check service status (Mac)
- `test_setup.sh` - Test system setup
- `logs/` - Service log files

## Windows Compatibility

All existing Windows `.bat` files are preserved for Windows users:
- `launch_synerex_8000.bat`
- `start_services.bat`
- `stop_services.bat`
- `services.yaml`



