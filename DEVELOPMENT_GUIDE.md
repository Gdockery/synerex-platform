# Synerex Platform — Development & Deployment Guide

## URLs

| Environment | URL | Notes |
|---|---|---|
| **Dev / Staging** | `http://100.91.109.59:5173` | Website container, proxies all services |
| **Production** | `http://100.91.109.59:8080` | Proxy container, same services |

Both URLs hit the **same running containers** — only the entry point differs.

---

## Workflow: Dev First, Then Production

1. Make code changes in source files
2. Apply changes to dev (see per-service instructions below)
3. Test at `http://100.91.109.59:5173`
4. Tell the agent to push to production when satisfied
5. Agent rebuilds Docker image (if needed) and restarts container

---

## Services — Where Everything Lives

### Tracking Program

| | Path |
|---|---|
| **Angular source** | `tracking-program/8087/src/` |
| **Angular build output** | `tracking-program/8087/.tmp/public/` |
| **Flask (API) source** | `tracking-program/8087/flask_app/app/` |
| **Flask env config** | `tracking-program/8087/flask_app/.env.docker` |
| **Dockerfile** | `tracking-program/8087/flask_app/Dockerfile` |
| **Internal port** | `8087` |

**How it works (critical):**
The `.tmp/` directory and the Flask `app/` folder are both **mounted from the host** into the container via `docker-compose.yml` volumes:
```
./tracking-program/8087/.tmp           → /app/8087/.tmp         (Angular dist)
./tracking-program/8087/flask_app/app  → /app/8087-flask/app    (Flask code)
```
This means the **Docker image is NOT what serves the Angular app** — the host `.tmp/` directory is. When you rebuild the Docker image, the Angular files baked in are immediately overridden by the host mount.

**To apply Angular changes (dev):**
```bash
cd tracking-program/8087
npm run build
# Changes are instantly live — no Docker restart needed
```

**To apply Flask (Python) changes (dev):**
```bash
docker restart synerex-platform_tracking-program_1
# No rebuild needed — Flask code is mounted from host.
# Restart IS required — Flask loads all modules once at startup
# and does not hot-reload in production mode.
```

**When a Docker rebuild IS required:**
- Changes to `requirements.txt`
- Changes to `Dockerfile`
- Changes to files outside the two mounted paths (e.g. `node_modules`, `scripts/`)

---

### EM&V Program

| | Path |
|---|---|
| **Python source** | `emv-program/8082/` |
| **Active main file** | `emv-program/8082/main_hardened_ready_fixed.py` |
| **Config / env** | `emv-program/8082/.env` |
| **Dockerfile** | `emv-program/8082/Dockerfile` |
| **Internal port** | `8082` |

**How it works:**
The entire source directory is mounted from the host:
```
./emv-program/8082 → /app
```
Code changes are live immediately. Only a container restart (not a rebuild) is ever needed.

**To apply Python changes (dev):**
```bash
docker restart synerex-platform_emv-program_1
# No rebuild needed
```

**When a Docker rebuild IS required:**
- Changes to `requirements.txt`
- Changes to `Dockerfile`

---

### License Service

| | Path |
|---|---|
| **Python/FastAPI source** | `license-service/services/license-service/` |
| **HTML templates** | `license-service/services/license-service/app/admin/templates/` |
| **Email templates** | `license-service/templates/` |
| **Config / env** | `license-service/services/license-service/.env` |
| **Dockerfile** | `license-service/services/license-service/Dockerfile` |
| **Internal port** | `8000` |

**How it works:**
Only the `templates/` folder is mounted from the host. All Python code is **baked into the Docker image**.

```
./license-service/templates → /app/templates   (email/HTML templates only)
```

**To apply Python code changes (dev):**
```bash
cd /home/xcorp/synerex-platform
docker-compose build --no-cache license-service
# Then restart (use force-recreate workaround due to docker-compose 1.29 bug):
old_id=$(docker ps -aqf name=synerex-platform_license-service_1)
docker rm -f "$old_id"
docker-compose up --no-deps -d license-service
```

**To apply template-only changes:**
```bash
docker restart synerex-platform_license-service_1
# Templates are mounted, no rebuild needed
```

---

### Website (synerexlabs.com frontend)

| | Path |
|---|---|
| **React/Vite source** | `website/src/` |
| **Nginx config** | `website/nginx.conf` |
| **Env config** | `website/.env` |
| **Dockerfile** | `website/Dockerfile` |
| **Internal port** | `80` (exposed as `5173` externally) |

**How it works:**
Everything is baked into the Docker image. No source files are mounted. Any change requires a full rebuild.

**To apply any change (dev):**
```bash
cd /home/xcorp/synerex-platform
docker-compose build --no-cache website
old_id=$(docker ps -aqf name=synerex-platform_website_1)
docker rm -f "$old_id"
docker-compose up --no-deps -d website
```

---

## Quick Reference: What Needs a Rebuild?

| Service | Change Type | Action Needed |
|---|---|---|
| Tracking — Angular | Source edit in `src/` | `npm run build` in `tracking-program/8087/` |
| Tracking — Flask | Source edit in `flask_app/app/` | `docker restart tracking-program` |
| Tracking — Dependencies | `requirements.txt` or `Dockerfile` | Docker rebuild + restart |
| EM&V | Any `.py` file | `docker restart emv-program` |
| EM&V — Dependencies | `requirements.txt` or `Dockerfile` | Docker rebuild + restart |
| License Service — Templates | Any file in `license-service/templates/` | `docker restart license-service` |
| License Service — Code | Any `.py` file | Docker rebuild + restart |
| Website | Any source file | Docker rebuild + restart |

---

## Docker Rebuild Workaround (docker-compose 1.29 bug)

Due to a known bug in docker-compose 1.29 with newer Docker engines, `--force-recreate` fails with `KeyError: 'ContainerConfig'`. Always use this pattern instead:

```bash
old_id=$(docker ps -aqf name=<container_name>)
docker rm -f "$old_id"
docker-compose up --no-deps -d <service_name>
```

Example for tracking-program:
```bash
old_id=$(docker ps -aqf name=synerex-platform_tracking-program_1)
docker rm -f "$old_id"
docker-compose up --no-deps -d tracking-program
```

---

## Admin Credentials

| Portal | URL | Username | Password |
|---|---|---|---|
| Synerex Admin (License) | `/license/admin/login` | `admin` | `admin123` |
| Tracking (Synerex Admin) | `/tracking` | admin email | admin password |
| EM&V | `/emv/login` | admin email | admin password |
