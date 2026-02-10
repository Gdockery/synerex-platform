#!/bin/bash

# Script to switch Tailscale network
# Usage: sudo ./switch-tailscale-network.sh <new-auth-key>
# 
# This script will disconnect from current Tailscale network and connect to a new one.
# If the new connection fails, it will restore the old state so you can reconnect.

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: sudo $0 <new-auth-key>"
    echo "Example: sudo $0 tskey-auth-xxxxx-xxxxx"
    exit 1
fi

NEW_AUTH_KEY="$1"
STATE_FILE="/var/lib/tailscale/tailscaled.state"
BACKUP_FILE="$HOME/tailscaled.state.backup.$(date +%Y%m%d_%H%M%S)"
RESTORE_FILE="$HOME/tailscaled.state.backup.latest"
RESTORE_NEEDED=0

# Function to restore previous state if something goes wrong
restore_state() {
    if [ "$RESTORE_NEEDED" = "1" ] && [ -f "$RESTORE_FILE" ]; then
        echo ""
        echo "  Restoring previous Tailscale state..."
        cp "$RESTORE_FILE" "$STATE_FILE" 2>/dev/null && {
            chown tailscale:tailscale "$STATE_FILE" 2>/dev/null || true
            systemctl restart tailscaled
            sleep 3
            tailscale up --accept-routes 2>&1 || true
            echo "  ✓ Previous state restored"
        } || echo "  ✗ Failed to restore state"
    fi
}

# Set trap to restore on exit if we've disconnected
trap restore_state EXIT INT TERM

echo "=== Tailscale Network Switch Script ==="
echo ""

# Step 1: Save current state to home directory
echo "Step 1: Saving current Tailscale state..."
if [ -f "$STATE_FILE" ]; then
    cp "$STATE_FILE" "$BACKUP_FILE" 2>/dev/null || {
        echo "  Error: Failed to backup state file"
        exit 1
    }
    # Also create a "latest" backup for easy restore
    cp "$STATE_FILE" "$RESTORE_FILE" 2>/dev/null || true
    echo "  ✓ State saved to: $BACKUP_FILE"
    echo "  ✓ Also saved to: $RESTORE_FILE (for restore)"
else
    echo "  No state file found (not currently connected)"
    BACKUP_FILE=""
fi

# Step 2: Check current status (before disconnecting)
if tailscale status &>/dev/null; then
    CURRENT_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
    echo "  Current Tailscale IP: $CURRENT_IP"
fi

# Step 3: Disconnect from current network
echo ""
echo "Step 2: Disconnecting from current Tailscale network..."
tailscale down 2>&1 || echo "  (Already disconnected or error - continuing)"
RESTORE_NEEDED=1  # Mark that we need to restore if this fails

# Step 4: Remove state file for clean switch
echo ""
echo "Step 3: Removing old state file..."
if [ -f "$STATE_FILE" ]; then
    rm -f "$STATE_FILE"
    echo "  ✓ State file removed"
else
    echo "  No state file to remove"
fi

# Step 5: Restart tailscaled service
echo ""
echo "Step 4: Restarting Tailscale service..."
systemctl restart tailscaled
sleep 3

# Step 6: Connect to new network
echo ""
echo "Step 5: Connecting to new Tailscale network..."
echo "  Using auth key: ${NEW_AUTH_KEY:0:20}..."
echo ""
echo "  NOTE: You will lose SSH connection after this point."
echo "  If connection fails, the script will restore the old state."
echo "  Wait a few minutes, then try to reconnect via SSH."
echo ""

# Try to connect - if this fails, we'll restore in the trap
if ! tailscale up --authkey="$NEW_AUTH_KEY" --accept-routes 2>&1; then
    echo ""
    echo "  ✗ Failed to connect with new auth key"
    echo "  Restoring previous state..."
    
    # Restore the old state
    if [ -f "$RESTORE_FILE" ]; then
        cp "$RESTORE_FILE" "$STATE_FILE" 2>/dev/null || {
            echo "  Error: Failed to restore state file"
            exit 1
        }
        chown tailscale:tailscale "$STATE_FILE" 2>/dev/null || true
        systemctl restart tailscaled
        sleep 3
        tailscale up --accept-routes 2>&1 || true
        echo "  ✓ Previous state restored - you should be able to reconnect"
    else
        echo "  Error: No backup state file found to restore"
    fi
    exit 1
fi

# If we get here, connection succeeded
# Wait a bit and verify
sleep 5
if tailscale status &>/dev/null; then
    # Success - disable restore trap and remove restore file
    RESTORE_NEEDED=0
    rm -f "$RESTORE_FILE" 2>/dev/null || true
    echo "  ✓ Successfully connected to new network!"
    echo "  You can now reconnect via SSH using the new Tailscale IP"
    exit 0
else
    # Connection didn't stick - restore will happen via trap
    echo "  ✗ Connection verification failed"
    exit 1
fi
