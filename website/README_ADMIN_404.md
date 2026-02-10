# Why /admin Returns 404 and How to Fix It

## What the error means

**"Failed to load resource: the server responded with a status of 404 (Not Found) admin:1"**

- The browser requested the URL `/admin` (either directly or via the proxy).
- The server (nginx in the website container) responded with **404 Not Found** instead of serving the page.
- So the **document** for the admin page is missing as far as the server is concerned.

## Why it happens

The site is a **single-page app (SPA)**. The route `/admin` exists only in the React router; there is no file on disk named `admin` or `admin/index.html`. By default, nginx looks for a matching file, doesn't find one, and returns 404.

The fix is to tell nginx: "for any path that isn't a real file, serve `index.html`" so the React app loads and can show `/admin`. That is done with:

```nginx
try_files $uri $uri/ /index.html;
```

## What was changed in this repo

- **`website/nginx.conf`** – Added the `try_files` rule and set as the default server config.
- **`website/Dockerfile`** – Copies `nginx.conf` into the image as `/etc/nginx/conf.d/default.conf`.

So the **image** must be **rebuilt** for the running container to use this config.

## Fix: Rebuild and restart the website container

From the repo root:

```bash
docker-compose build website
docker-compose up -d website
```

Or with hyphen:

```bash
docker-compose build website
docker-compose up -d website
```

Then open (or hard-refresh):

- **Via proxy:** http://localhost:8080/admin  
- **Direct:** http://localhost:5173/admin  

You should get the Admin Dashboard instead of 404.

## Verify the container is using the new config

Check that the website container’s nginx config contains `try_files`:

```bash
docker-compose exec website cat /etc/nginx/conf.d/default.conf
```

You should see a line like `try_files $uri $uri/ /index.html;`. If you don’t, the image wasn’t rebuilt or the wrong image is running.
