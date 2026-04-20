# Synerex Platform — Development & Deployment Guide

---

## SSH Access (Production)

```bash
ssh -i ~/.ssh/synerex root@synerexlabs.com
```

- Docker binary is at **`/snap/bin/docker`** — never just `docker` on this server.
- All `docker compose` commands must be run from `/root/synerex-platform/`.
- Container names use **hyphens**, e.g. `synerex-platform-tracking-program-1`  
  (NOT underscores — old compose used `_`, new compose uses `-`).

---

## The Standard Deploy Workflow

**Always follow this order:**

```
1. Edit source files locally
2. git commit && git push
3. SSH to server: cd /root/synerex-platform && git pull origin master
4. Run only the step needed for the change type (see table below)
```

### ⚠️ Critical: git pull changes file inodes — restart affected containers

When `git pull` updates a file that is bind-mounted into a running container,
Docker still reads from the OLD inode. **Restarting the container re-establishes
the bind mount to the new inode.** Always restart the relevant container after
a `git pull` — do not just reload (e.g. `nginx -s reload` is NOT enough for
nginx.conf changes after a pull).

---

## What to do for each change type

| What changed | Command on server |
|---|---|
| Flask Python code (`flask_app/app/`) | `git pull && /snap/bin/docker restart synerex-platform-tracking-program-1` |
| `nginx.conf` | `git pull && /snap/bin/docker restart synerex-platform-proxy-1` |
| Angular source (`.ts`, `.html`, `.scss`) | Patch compiled bundle (see below) OR full webpack build |
| EM&V Python (`emv-program/8082/`) | `git pull && /snap/bin/docker restart synerex-platform-emv-program-1` |
| License Service Python | `git pull && rebuild license-service image` (see below) |
| `requirements.txt` or `Dockerfile` | Rebuild image + recreate container (see below) |

---

## Services — Where Everything Lives

### Tracking Program

| | Path |
|---|---|
| **Angular source** | `tracking-program/8087/src/` |
| **Angular compiled bundles** | `tracking-program/8087/.tmp/public/js/` |
| **Flask API source** | `tracking-program/8087/flask_app/app/` |
| **Flask env config** | `tracking-program/8087/flask_app/.env.docker` |
| **Dockerfile** | `tracking-program/8087/flask_app/Dockerfile` |
| **Container name** | `synerex-platform-tracking-program-1` |

**Volume mounts (host → container):**
```
./tracking-program/8087/.tmp           → /app/8087/.tmp         (Angular bundles)
./tracking-program/8087/flask_app/app  → /app/8087-flask/app    (Flask code)
```

---

### ⚠️ PROD vs DEV — Angular Build (Critical)

Angular TypeScript is **pre-compiled** into minified JS bundles in `.tmp/public/js/`.
Editing `.ts` source files does NOT change what the browser runs.
The Docker image does NOT serve the Angular app — the host `.tmp/` mount does.
Rebuilding the Docker image does nothing for Angular changes.

**Option A — Quick fix: patch the compiled bundle directly (no restart needed)**

The `.tmp/` directory is bind-mounted from the host, so patching via `docker exec`
writes to the host filesystem. No container restart is needed.

```bash
# Find which chunk contains your code
ssh -i ~/.ssh/synerex root@synerexlabs.com \
  "grep -rl 'some unique string' /root/synerex-platform/tracking-program/8087/.tmp/public/js/ | grep -v '\.map'"

# Patch it with Python (avoids shell quoting problems with backticks/quotes)
/snap/bin/docker exec synerex-platform-tracking-program-1 python3 -c "
path = '/app/8087/.tmp/public/js/3.chunk.js'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
count = content.count('OLD_STRING')
print('Occurrences:', count)
content = content.replace('OLD_STRING', 'NEW_STRING', 1)
with open(path, 'w', encoding='utf-8') as f: f.write(content)
print('Done')
"
# No restart needed — user must hard-refresh browser (Cmd+Shift+R)
```

**Option B — Full webpack build (for large or structural changes)**

```bash
ssh -i ~/.ssh/synerex root@synerexlabs.com "
  /snap/bin/docker run --rm \
    -v /root/synerex-platform/tracking-program/8087:/app \
    -w /app \
    node:18-slim \
    sh -c 'npm install --legacy-peer-deps && NODE_ENV=production npm run build'
"
# No restart needed — bundles land directly in the volume-mounted .tmp/
```

**After any bundle change, the user must hard-refresh their browser:**  
`Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux).
Log out / log in is NOT needed. A hard refresh is sufficient.

---

### Flask API changes

Flask source is bind-mounted from the host. No rebuild needed, only restart.

```bash
ssh -i ~/.ssh/synerex root@synerexlabs.com "
  cd /root/synerex-platform && git pull origin master &&
  /snap/bin/docker restart synerex-platform-tracking-program-1
"
```

---

### nginx.conf changes

```bash
ssh -i ~/.ssh/synerex root@synerexlabs.com "
  cd /root/synerex-platform && git pull origin master &&
  /snap/bin/docker restart synerex-platform-proxy-1
"
```

**Do NOT use `nginx -s reload` after a `git pull`** — git creates a new inode,
the container bind-mount still points to the old inode, so reload reads stale config.
A full container restart is required to re-bind to the new inode.

---

### EM&V Program

| | Path |
|---|---|
| **Python source** | `emv-program/8082/` |
| **Config / env** | `emv-program/8082/.env` |
| **Container name** | `synerex-platform-emv-program-1` |

```bash
ssh -i ~/.ssh/synerex root@synerexlabs.com "
  cd /root/synerex-platform && git pull origin master &&
  /snap/bin/docker restart synerex-platform-emv-program-1
"
```

---

### License Service

| | Path |
|---|---|
| **Python/FastAPI source** | `license-service/services/license-service/` |
| **Email templates** | `license-service/templates/` |
| **Container name** | `synerex-platform-license-service-1` |

Python code is **baked into the image** (not mounted). Any `.py` change requires a rebuild.

```bash
ssh -i ~/.ssh/synerex root@synerexlabs.com "
  cd /root/synerex-platform && git pull origin master &&
  /snap/bin/docker compose build --no-cache license-service &&
  /snap/bin/docker rm -f synerex-platform-license-service-1 &&
  /snap/bin/docker compose up --no-deps -d license-service
"
```

Template-only changes (no rebuild):
```bash
/snap/bin/docker restart synerex-platform-license-service-1
```

---

## Running Containers (reference)

```
synerex-platform-tracking-program-1   (Flask + serves Angular bundles, port 8087)
synerex-platform-tracking-errands-1   (cron errands)
synerex-platform-tracking-rollup-1    (rollup cron)
synerex-platform-tracking-cron-1      (main cron)
synerex-platform-proxy-1              (nginx reverse proxy, ports 8080/8443)
synerex-platform-emv-program-1        (EM&V, port 8082)
synerex-platform-license-service-1    (License/SSO, port 8000)
synerex-platform-mysql-tracking-1     (MySQL for tracking)
synerex-platform-mysql-1              (MySQL main)
synerex-platform-website-1            (marketing website)
```

---

## Quick Sanity Checks

```bash
# Check all containers are running
ssh -i ~/.ssh/synerex root@synerexlabs.com "/snap/bin/docker ps --format '{{.Names}}\t{{.Status}}'"

# Tail tracking logs (Flask errors, 500s, etc.)
ssh -i ~/.ssh/synerex root@synerexlabs.com "/snap/bin/docker logs synerex-platform-tracking-program-1 --tail 50"

# Verify nginx config before restarting
ssh -i ~/.ssh/synerex root@synerexlabs.com "/snap/bin/docker exec synerex-platform-proxy-1 nginx -t"
```

---

## Admin Credentials

| Portal | URL | Notes |
|---|---|---|
| Synerex Admin (License) | `/license/admin/login` | user: `admin`, pass: `admin123` |
| Tracking | `/tracking` | login as synerex admin user |
| EM&V | `/emv/login` | login as synerex admin user |
