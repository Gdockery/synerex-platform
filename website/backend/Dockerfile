FROM node:18-slim
WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm install --omit=dev
COPY . /app
EXPOSE 3001
CMD ["node", "server.js"]
