#!/bin/bash

# Minimal deployment script for SYNEREX Power Analysis System
set -e

SERVER_HOST="134.209.14.71"
SERVER_USER="root"
SSH_KEY="C:\\Users\\Admin\\.ssh\\calc_rsa"
SERVER_BASE_PATH="/root/oneform"

echo "🚀 Starting minimal SYNEREX deployment..."

# Test connection
echo "🔐 Testing SSH connection..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "echo 'Connected'"

# Clean and create directories
echo "📁 Setting up directories..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "rm -rf ${SERVER_BASE_PATH} && mkdir -p ${SERVER_BASE_PATH}/{8082,8083,8084,logs,8082/results}"

# Deploy main app files
echo "📄 Deploying main application..."
cd /Users/euphoria/Downloads/Xeco/oneform/8082
scp -i ${SSH_KEY} -o ConnectTimeout=5 main_hardened_ready_fixed.py ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8082/
scp -i ${SSH_KEY} -o ConnectTimeout=5 html_body.html ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8082/
scp -i ${SSH_KEY} -o ConnectTimeout=5 html_head.html ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8082/
scp -i ${SSH_KEY} -o ConnectTimeout=5 javascript_functions.js ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8082/
scp -i ${SSH_KEY} -o ConnectTimeout=5 css_styles.css ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8082/

# Deploy static files if they exist
if [ -d "static" ] && [ "$(ls -A static 2>/dev/null)" ]; then
    echo "🖼️ Deploying static files..."
    ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_BASE_PATH}/8082/static"
    scp -i ${SSH_KEY} -o ConnectTimeout=5 -r static/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8082/static/
    echo "✅ Static files deployed"
fi

# Deploy PDF services
echo "📄 Deploying PDF services..."
cd /Users/euphoria/Downloads/Xeco/oneform/8083
scp -i ${SSH_KEY} -o ConnectTimeout=5 pdf_generator_8083.py ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8083/
scp -i ${SSH_KEY} -o ConnectTimeout=5 generate_envelope_report.py ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8083/

cd /Users/euphoria/Downloads/Xeco/oneform/8084
scp -i ${SSH_KEY} -o ConnectTimeout=5 pdf_generator_8084.py ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8084/
scp -i ${SSH_KEY} -o ConnectTimeout=5 generate_styled_html.py ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8084/

# Deploy requirements
echo "📚 Deploying requirements..."
cd /Users/euphoria/Downloads/Xeco/oneform/common
scp -i ${SSH_KEY} -o ConnectTimeout=5 requirements.txt ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/

# Deploy local database
echo "🗄️ Deploying local database..."
cd /Users/euphoria/Downloads/Xeco/oneform/8082/results
scp -i ${SSH_KEY} -o ConnectTimeout=5 app.db ${SERVER_USER}@${SERVER_HOST}:${SERVER_BASE_PATH}/8082/results/
echo "✅ Database deployed"

# Set permissions
echo "🔐 Setting permissions..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "chmod +x ${SERVER_BASE_PATH}/8082/main_hardened_ready_fixed.py"
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "chmod +x ${SERVER_BASE_PATH}/8083/pdf_generator_8083.py"
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "chmod +x ${SERVER_BASE_PATH}/8084/pdf_generator_8084.py"

# Install dependencies
echo "📚 Installing dependencies..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_BASE_PATH} && pip3 install -r requirements.txt --break-system-packages || echo 'Deps done'"

# Start main app
echo "🚀 Starting main application..."
ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_BASE_PATH}/8082 && nohup python3 main_hardened_ready_fixed.py > ${SERVER_BASE_PATH}/logs/main_app.log 2>&1 &"

echo "✅ Deployment complete!"
echo "🌐 Main App: http://${SERVER_HOST}:8082"
echo "💡 Check status: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} 'ps aux | grep main_hardened_ready_fixed'"
