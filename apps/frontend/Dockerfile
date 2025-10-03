FROM node:22-slim

WORKDIR /app

COPY apps/frontend/package.json ./package.json
RUN npm install --no-fund --no-audit

COPY apps/frontend/. .

RUN npm run build

RUN npm install --global http-server@14.1.1 --no-fund --no-audit

EXPOSE 5173

CMD ["http-server", "dist", "-p", "5173", "-a", "0.0.0.0"]


