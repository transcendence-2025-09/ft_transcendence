FROM node:22-slim AS base

RUN corepack enable

FROM base AS pruner
WORKDIR /pruner

COPY . ./
RUN npx turbo@2.5.6 prune --scope=frontend --docker

FROM base AS builder

WORKDIR /builder
COPY --from=pruner /pruner/out/json ./
COPY --from=pruner /pruner/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /pruner/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --no-frozen-lockfile

COPY --from=pruner /pruner/out/full/ .
RUN pnpm turbo run build

RUN pnpm config set inject-workspace-packages=true
RUN pnpm install --no-frozen-lockfile
RUN pnpm deploy --filter frontend --prod /prod/frontend

FROM nginx:alpine

# Copy built files to nginx html directory
COPY --from=builder /prod/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY --from=builder /prod/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]


