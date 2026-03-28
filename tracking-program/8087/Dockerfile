# ── Stage 1: build Angular bundle ────────────────────────────────────────────
FROM node:18-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* /app/
# Install ALL deps (including devDependencies) so webpack is available
RUN npm install --legacy-peer-deps

COPY . /app

# Compile Angular in production mode (minified, enableProdMode active)
RUN NODE_ENV=production npm run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json* /app/
# Only runtime deps — no webpack/devtools in the final image
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app /app

ENV NODE_ENV=production
EXPOSE 8087

CMD ["node", "app.js"]
