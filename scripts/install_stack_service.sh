#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

sudo tee /etc/systemd/system/synerex-stack.service >/dev/null <<EOF
[Unit]
Description=Synerex Platform Docker Stack
After=network-online.target docker.service
Wants=network-online.target docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${ROOT_DIR}
ExecStart=/usr/bin/docker-compose up --build -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable synerex-stack.service
sudo systemctl start synerex-stack.service
sudo systemctl status synerex-stack.service --no-pager
