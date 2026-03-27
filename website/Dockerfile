FROM node:18-slim AS build

# Build-time args for Vite (inlined at build). All paths are relative so the
# built app works from any host/IP (local, Tailscale, VPN, custom domain).
ARG VITE_LICENSE_SERVICE_URL=/license
ARG VITE_EMV_URL=/emv
ARG VITE_TRACKING_PROGRAM_URL=/tracking
ARG VITE_SERVICE_MANAGER_URL=/service-manager
ARG VITE_WEBSITE_FRONTEND_URL=
ARG VITE_WEBSITE_BACKEND_URL=
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

