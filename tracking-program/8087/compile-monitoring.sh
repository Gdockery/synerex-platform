#!/bin/bash

# Script to compile monitoring TypeScript code, commit, and push
# Usage: ./compile-monitoring.sh [commit message]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Compiling monitoring TypeScript code...${NC}"

# Navigate to monitoring directory
cd maintenance/monitoring

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Compile TypeScript
echo -e "${GREEN}Running TypeScript compiler...${NC}"
npm run compile

if [ $? -ne 0 ]; then
    echo -e "${RED}Compilation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Compilation successful!${NC}"

# Go back to root
cd ../..

# Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}No changes to commit.${NC}"
    exit 0
fi

# Get commit message from argument or use default
COMMIT_MSG="${1:-Compile monitoring TypeScript code}"

# Add compiled files (if not in .gitignore) and source changes
echo -e "${GREEN}Staging changes...${NC}"
git add maintenance/monitoring/src/

# Commit
echo -e "${GREEN}Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

# Push
echo -e "${GREEN}Pushing to remote...${NC}"
git push

# Restart the monitoring service
echo -e "${GREEN}Restarting xeco-monitoring service...${NC}"
sudo systemctl restart xeco-monitoring.service

echo -e "${GREEN}Done!${NC}"
