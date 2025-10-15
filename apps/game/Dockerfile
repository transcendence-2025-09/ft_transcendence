FROM node:22-slim AS base

RUN corepack enable

FROM base AS pruner
WORKDIR /pruner

COPY . ./
RUN npx turbo@2.5.6 prune --scope=game --docker

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
RUN pnpm deploy --filter game --prod /prod/game

FROM base AS runner
WORKDIR /app

# ビルドされたプロダクション用のファイルのみをコピー
COPY --from=builder /prod/game .

EXPOSE 3000
CMD ["node", "dist/index.js"]
