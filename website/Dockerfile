FROM node:18-slim AS build

# Build-time args for Vite (inlined at build). Fallbacks match local dev defaults.
ARG VITE_LICENSE_SERVICE_URL=http://localhost:8080/license
ARG VITE_EMV_URL=http://localhost:8082
ARG VITE_TRACKING_PROGRAM_URL=http://localhost:8087
ARG VITE_SERVICE_MANAGER_URL=http://localhost:9000
ARG VITE_WEBSITE_FRONTEND_URL=http://localhost:8080
ARG VITE_WEBSITE_BACKEND_URL=http://localhost:3001
ENV VITE_LICENSE_SERVICE_URL=$VITE_LICENSE_SERVICE_URL
ENV VITE_EMV_URL=$VITE_EMV_URL
ENV VITE_TRACKING_PROGRAM_URL=$VITE_TRACKING_PROGRAM_URL
ENV VITE_SERVICE_MANAGER_URL=$VITE_SERVICE_MANAGER_URL
ENV VITE_WEBSITE_FRONTEND_URL=$VITE_WEBSITE_FRONTEND_URL
ENV VITE_WEBSITE_BACKEND_URL=$VITE_WEBSITE_BACKEND_URL

WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm install

COPY . /app
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

