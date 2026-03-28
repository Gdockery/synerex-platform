# GPU Server — Access & Operations

## Machine Info

| Property | Value |
|---|---|
| Tailscale IP | `100.106.19.30` (stable — use this for all config) |
| Local IP | `100.106.19.30` (DHCP — changes; use Tailscale instead) |
| SSH User | `synerex` |
| SSH Key | `~/.ssh/id_ed25520` (on the Xeon/dev machine) |
| Nginx port | `8300` (video static file server) |
| Ollama port | `11434` (AI model server) |
| Video root | `/var/www/synerex-videos/videos/` |

> **Use the Tailscale IP** (`100.106.19.30`) in all configs — it is stable across reboots and network changes.
> The local LAN IP is DHCP and can change. All `nginx.conf`, `website/nginx.conf`, `docker-compose.yml`, and `emv-program/8082/.env` already point to the Tailscale IP.

---

## SSH Access

```bash
ssh -i ~/.ssh/id_ed25520 synerex@100.106.19.30
```

---

## Transfer Files TO the GPU Server

```bash
# Single file
scp -i ~/.ssh/id_ed25520 /local/path/to/file synerex@100.106.19.30:/remote/path/

# Replace a video (overwrite in place)
scp -i ~/.ssh/id_ed25520 /home/xcorp/synerex-platform/website/public/videos/background_720p_web.mp4 \
    synerex@100.106.19.30:/var/www/synerex-videos/videos/background_720p.mp4

# Directory (recursive)
scp -i ~/.ssh/id_ed25520 -r /local/dir/ synerex@100.106.19.30:/remote/dir/
```

---

## Transfer Files FROM the GPU Server

```bash
scp -i ~/.ssh/id_ed25520 synerex@100.106.19.30:/remote/path/file /local/path/
```

---

## What Runs on the GPU Server

| Service | Port | Purpose |
|---|---|---|
| nginx | `8300` | Serves static video files from `/var/www/synerex-videos/` |
| Ollama | `11434` | AI model server (`qwen2.5vl:32b`, `nomic-embed-text`) |

### Video File Structure on GPU Server
```
/var/www/synerex-videos/
└── videos/
    └── background_720p.mp4    ← website homepage background video
```

### How Videos Are Routed
```
Browser (localhost:8080)
  → Nginx reverse proxy (main nginx.conf)
    → Website container nginx (website/nginx.conf, port 5173/80)
      → proxy_pass http://100.106.19.30:8300  (GPU server nginx)
        → /var/www/synerex-videos/videos/background_720p.mp4
```

Videos are **not** bundled in the website Docker image (`public/videos/` is in `.dockerignore`).
They are always fetched live from the GPU server.

---

## Re-encoding Videos for Web (faststart)

When adding or replacing a background video, always re-encode with `+faststart` so the browser can start playing immediately:

```bash
ffmpeg -y -i input.mp4 \
  -c:v libx264 \
  -profile:v baseline \
  -level 3.0 \
  -crf 28 \
  -vf "scale=1280:720,fps=fps=24" \
  -movflags +faststart \
  -an \
  -pix_fmt yuv420p \
  output_web.mp4
```

Then copy to GPU server:
```bash
scp -i ~/.ssh/id_ed25520 output_web.mp4 synerex@100.106.19.30:/var/www/synerex-videos/videos/background_720p.mp4
```

Verify it's live:
```bash
curl -o /dev/null -w "%{http_code} %{size_download} bytes\n" http://100.106.19.30:8300/videos/background_720p.mp4
# Should return: 200 XXXXXXX bytes
```

After replacing a video, users need to hard-refresh (`Ctrl+Shift+R`) to bypass the 7-day browser cache (`max-age=604800`).

---

## Ollama Model Management

```bash
# List loaded models
ssh -i ~/.ssh/id_ed25520 synerex@100.106.19.30 "ollama list"

# Pull a new model
ssh -i ~/.ssh/id_ed25520 synerex@100.106.19.30 "ollama pull <model-name>"

# Check Ollama service status
ssh -i ~/.ssh/id_ed25520 synerex@100.106.19.30 "systemctl status ollama"
```
