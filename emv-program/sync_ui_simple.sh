#!/bin/bash

# Simple UI sync script from remote server to localhost
# Preserves local projects and data

echo "🚀 Syncing UI from remote server to localhost"
echo "📡 Server: 134.209.14.71"
echo ""

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup in $BACKUP_DIR/"
mkdir -p "$BACKUP_DIR"

# Backup current UI files
echo "📄 Backing up current UI files..."
cp -r 8082/ "$BACKUP_DIR/" 2>/dev/null || echo "  ⚠️  8082/ not found"
cp -r common/ "$BACKUP_DIR/" 2>/dev/null || echo "  ⚠️  common/ not found"

echo ""
echo "📥 Syncing UI files from remote server..."

# Sync main application files
echo "🔄 Syncing main application..."
scp -i ~/.ssh/calc_rsa root@134.209.14.71:/root/8082/main_hardened_ready_fixed.py 8082/
scp -i ~/.ssh/calc_rsa root@134.209.14.71:/root/8082/html_head.html 8082/
scp -i ~/.ssh/calc_rsa root@134.209.14.71:/root/8082/html_body.html 8082/
scp -i ~/.ssh/calc_rsa root@134.209.14.71:/root/8082/css_styles.css 8082/
scp -i ~/.ssh/calc_rsa root@134.209.14.71:/root/8082/javascript_functions.js 8082/

# Sync complete - all files now in 8082/
echo "✅ All UI files synced to 8082/ directory"

echo ""
echo "🔒 Preserving local projects and data..."
echo "  📁 Local projects preserved in:"
echo "    - results/app.db"
echo "    - 8082/results/app.db" 
echo "    - 8082/uploads/"
echo "    - 8082/data/"
echo "    - 8084/generated_reports/"
echo "    - 8084/generated_pdfs_8084/"

echo ""
echo "✅ Sync completed!"
echo "📦 Backup created in: $BACKUP_DIR/"
echo ""
echo "🔄 Next steps:"
echo "1. Start your local Flask application"
echo "2. Test the UI functionality"
echo "3. Your local projects and data are preserved"


