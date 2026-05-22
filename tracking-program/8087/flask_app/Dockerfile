# Multi-stage: Stage 1 - Build Angular frontend
FROM node:18-slim AS angular-build
WORKDIR /build

# Optional post-build JS obfuscation. Default 0 = plain `npm run build` (safe rollback).
# Enable with: docker build --build-arg ENABLE_JS_OBFUSCATION=1 ...
ARG ENABLE_JS_OBFUSCATION=0

# Copy 8087 package files and install deps
COPY 8087/package.json 8087/package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy 8087 source and build (NODE_ENV=production enables minification)
COPY 8087/ ./
ENV NODE_ENV=production
RUN if [ "$ENABLE_JS_OBFUSCATION" = "1" ]; then npm run build:obfuscate; else npm run build; fi

# Stage 2 - Flask app
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      nodejs \
      libpango-1.0-0 libpangocairo-1.0-0 libcairo2 \
      libffi8 shared-mime-info \
      fonts-dejavu-core \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
      libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
      libxfixes3 libxrandr2 libgbm1 libasound2 \
      libx11-xcb1 libxcb-dri3-0 && \
    rm -rf /var/lib/apt/lists/*

COPY 8087/flask_app/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    playwright install chromium --with-deps

# Copy Flask app to /app/8087-flask (rollup/errands expect sibling 8087-flask)
COPY 8087/flask_app/ /app/8087-flask/

# Copy Angular build from stage 1 (Flask serves from 8087/.tmp/public or assets)
RUN mkdir -p /app/8087
COPY --from=angular-build /build/.tmp /app/8087/.tmp
COPY 8087/assets /app/8087/assets
COPY 8087/whitelabel /app/8087/whitelabel

# Node api + scripts + node_modules for pdf-bridge (original Bill Analytic Report)
COPY --from=angular-build /build/api /app/8087/api
COPY --from=angular-build /build/scripts /app/8087/scripts
COPY --from=angular-build /build/node_modules /app/8087/node_modules

# Copy rollup and errands (siblings of 8087-flask)
COPY 8087-rollup/ /app/8087-rollup/
COPY 8087-errands/ /app/8087-errands/

ENV PORT=8087
ENV FLASK_ENV=production
ENV PDF_BRIDGE_PATH=/app/8087/scripts/pdf-bridge.js
EXPOSE 8087

# Entrypoint runs migrations then exec's the command
COPY 8087/flask_app/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default: run main Flask app from 8087-flask dir
WORKDIR /app/8087-flask
CMD ["python", "run.py"]
