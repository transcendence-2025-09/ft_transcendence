FROM node:22-slim as builder

WORKDIR /app

COPY apps/frontend/package.json ./package.json
RUN npm install --no-fund --no-audit

COPY apps/frontend/. .

RUN npm run build

# Stage 2: Nginx for serving the built files
FROM nginx:alpine

# Copy built files to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]


