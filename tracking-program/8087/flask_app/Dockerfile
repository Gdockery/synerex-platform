# Multi-stage: Stage 1 - Build Angular frontend
FROM node:18-slim AS angular-build
WORKDIR /build

# Copy 8087 package files and install deps
COPY 8087/package.json 8087/package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy 8087 source and build
COPY 8087/ ./
RUN npm run build

# Stage 2 - Flask app
FROM python:3.11-slim
WORKDIR /app

# Install Python deps
COPY 8087/flask_app/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask app to /app/8087-flask (rollup/errands expect sibling 8087-flask)
COPY 8087/flask_app/ /app/8087-flask/

# Copy Angular build from stage 1 (Flask serves from 8087/.tmp/public or assets)
RUN mkdir -p /app/8087
COPY --from=angular-build /build/.tmp /app/8087/.tmp
COPY 8087/assets /app/8087/assets
COPY 8087/whitelabel /app/8087/whitelabel

# Copy rollup and errands (siblings of 8087-flask)
COPY 8087-rollup/ /app/8087-rollup/
COPY 8087-errands/ /app/8087-errands/

ENV PORT=8087
ENV FLASK_ENV=production
EXPOSE 8087

# Entrypoint runs migrations then exec's the command
COPY 8087/flask_app/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default: run main Flask app from 8087-flask dir
WORKDIR /app/8087-flask
CMD ["python", "run.py"]
