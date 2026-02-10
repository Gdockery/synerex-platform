FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json* /app/
RUN npm install --omit=dev --legacy-peer-deps

COPY . /app

ENV NODE_ENV=production
EXPOSE 8087

CMD ["node", "app.js"]
