#!/bin/bash

# Setup systemd services for SYNEREX Power Analysis System
set -e

SERVER_HOST="134.209.14.71"
SERVER_USER="root"
SSH_KEY="~/.ssh/calc_rsa"
SERVER_BASE_PATH="/root/oneform"

echo "🔧 Setting up systemd services for SYNEREX..."

# Test connection
echo "🔐 Testing SSH connection..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "echo 'Connected'"

# Create systemd service files
echo "📄 Creating systemd service files..."

# Main Application Service (8082)
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "cat > /etc/systemd/system/synerex-main.service << 'EOF'
[Unit]
Description=SYNEREX Power Analysis System - Main Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${SERVER_BASE_PATH}/8082
ExecStart=/usr/bin/python3 ${SERVER_BASE_PATH}/8082/main_hardened_ready_refactored.py
Restart=always
RestartSec=10
StandardOutput=append:${SERVER_BASE_PATH}/logs/main_app.log
StandardError=append:${SERVER_BASE_PATH}/logs/main_app.log
Environment=PYTHONPATH=${SERVER_BASE_PATH}/8082
Environment=FLASK_ENV=production

[Install]
WantedBy=multi-user.target
EOF"

# PDF Service 8083 (Envelope)
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "cat > /etc/systemd/system/synerex-pdf-8083.service << 'EOF'
[Unit]
Description=SYNEREX Power Analysis System - PDF Generator (Envelope) (Envelope)
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${SERVER_BASE_PATH}/8083
ExecStart=/usr/bin/python3 ${SERVER_BASE_PATH}/8083/pdf_generator_8083.py
Restart=always
RestartSec=10
StandardOutput=append:${SERVER_BASE_PATH}/logs/pdf_8083.log
StandardError=append:${SERVER_BASE_PATH}/logs/pdf_8083.log
Environment=PYTHONPATH=${SERVER_BASE_PATH}/8083

[Install]
WantedBy=multi-user.target
EOF"

# PDF Service 8084 (Standard)
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "cat > /etc/systemd/system/synerex-pdf-8084.service << 'EOF'
[Unit]
Description=SYNEREX Power Analysis System - PDF Generator (Standard) (Standard)
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${SERVER_BASE_PATH}/8084
ExecStart=/usr/bin/python3 ${SERVER_BASE_PATH}/8084/pdf_generator_8084.py
Restart=always
RestartSec=10
StandardOutput=append:${SERVER_BASE_PATH}/logs/pdf_8084.log
StandardError=append:${SERVER_BASE_PATH}/logs/pdf_8084.log
Environment=PYTHONPATH=${SERVER_BASE_PATH}/8084

[Install]
WantedBy=multi-user.target
EOF"

# Reload systemd
echo "🔄 Reloading systemd..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl daemon-reload"

# Stop any existing processes
echo "🛑 Stopping existing processes..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "pkill -f main_hardened_ready_refactored.py || true"
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "pkill -f pdf_generator_8083.py || true"
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "pkill -f pdf_generator_8084.py || true"

# Enable and start services
echo "🚀 Enabling and starting services..."

# Enable services
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl enable synerex-main.service"
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl enable synerex-pdf-8083.service"
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl enable synerex-pdf-8084.service"

# Start services
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl start synerex-main.service"
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl start synerex-pdf-8083.service"
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl start synerex-pdf-8084.service"

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Check service status
echo "🔍 Checking service status..."

# Check main service
if ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl is-active synerex-main.service" | grep -q "active"; then
    echo "✅ Main application service is running"
else
    echo "❌ Main application service failed to start"
    ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl status synerex-main.service"
fi

# Check PDF service 8083
if ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl is-active synerex-pdf-8083.service" | grep -q "active"; then
    echo "✅ PDF service 8083 is running"
else
    echo "❌ PDF service 8083 failed to start"
    ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl status synerex-pdf-8083.service"
fi

# Check PDF service 8084
if ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl is-active synerex-pdf-8084.service" | grep -q "active"; then
    echo "✅ PDF service 8084 is running"
else
    echo "❌ PDF service 8084 failed to start"
    ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "systemctl status synerex-pdf-8084.service"
fi

# Test HTTP endpoints
echo "🌐 Testing HTTP endpoints..."
if curl -s --connect-timeout 5 http://${SERVER_HOST}:8000/health > /dev/null 2>&1; then
    echo "✅ Main app health check passed"
else
    echo "⚠️  Main app health check failed"
fi

if curl -s --connect-timeout 5 http://${SERVER_HOST}:8101/health > /dev/null 2>&1; then
    echo "✅ PDF service 8083 health check passed"
else
    echo "⚠️  PDF service 8083 health check failed"
fi

if curl -s --connect-timeout 5 http://${SERVER_HOST}:8102/health > /dev/null 2>&1; then
    echo "✅ PDF service 8084 health check passed"
else
    echo "⚠️  PDF service 8084 health check failed"
fi

echo ""
echo "🎉 Systemd services setup complete!"
echo "=================================="
echo "🌐 Main App: http://${SERVER_HOST}:8082"
echo "📄 PDF 8083: http://${SERVER_HOST}:8083"
echo "📄 PDF 8084: http://${SERVER_HOST}:8084"
echo ""
echo "💡 Management Commands:"
echo "  📊 Check status: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} 'systemctl status synerex-*'"
echo "  🛑 Stop all: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} 'systemctl stop synerex-*'"
echo "  🚀 Start all: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} 'systemctl start synerex-*'"
echo "  🔄 Restart all: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} 'systemctl restart synerex-*'"
echo "  📋 View logs: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} 'journalctl -u synerex-main -f'"
echo ""
echo "✅ Services will now automatically start on boot and restart if they crash!"
