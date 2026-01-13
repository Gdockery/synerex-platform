# SYNEREX Power Analysis System - Quick Start

## 🚀 Easy Launch Options

### Option 1: Double-Click Launcher (Recommended)
1. **Double-click** `launch_synerex_8000.bat`
2. The system will:
   - Check if Python is installed
   - Start the web service
   - Automatically open your browser to the application
   - Display the service URL

### Option 2: Manual Launch
1. Open Command Prompt
2. Navigate to the 8082 folder
3. Run: `python main_hardened_ready_fixed.py`
4. Open browser to: `http://127.0.0.1:8082`

## 📋 Prerequisites
- **Python 3.8 or higher** must be installed
- Python must be in your system PATH
- Port 8082 should be available

## 🌐 Access URLs
Once running, the system is available at:
- **Main App**: http://127.0.0.1:8082
- **PDF Service (Envelope)**: http://127.0.0.1:8083
- **PDF Service (Standard)**: http://127.0.0.1:8084
- **Weather Service**: http://127.0.0.1:8085
- **Chart Service**: http://127.0.0.1:8086

## 🛑 Stopping the Service
- Press **Ctrl+C** in the command window
- Or close the command window

## 🔧 Troubleshooting
- **"Python not found"**: Install Python from https://python.org
- **"Port in use"**: Another instance might be running, or another app is using port 8000
- **"File not found"**: Make sure you're running from the 8082 directory

## 📁 What's Included
- `launch_synerex_8000.bat` - Main launcher (starts all services)
- `start_services.bat` - Alternative launcher
- `stop_services.bat` - Stop all services
- Individual service launchers:
  - `start_main_app.bat` (Port 8082)
  - `start_pdf_service.bat` (Port 8083)
  - `start_html_service.bat` (Port 8084)
  - `start_weather_service.bat` (Port 8085)
  - `start_chart_service.bat` (Port 8086)
- `uploads/` - File upload storage
- `static/` - Images and assets

## 🎯 Quick Start Workflow
1. **Launch**: Double-click `launch_synerex_8000.bat`
2. **Upload Data**: Use the CSV upload feature
3. **Configure**: Set your analysis parameters
4. **Generate Report**: Click "Generate Report"
5. **Download**: Get your HTML report and audit package
6. **Stop**: Press Ctrl+C when done
