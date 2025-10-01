FROM node:22-slim

WORKDIR /app

COPY apps/backend/package.json ./package.json
RUN npm install --no-fund --no-audit

COPY apps/backend/. .

RUN npm run build

EXPOSE 3000

VOLUME ["/app/src/database/storage"]

CMD ["node", "dist/index.js"]
