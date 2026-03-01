FROM oven/bun:1.2 AS base
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY dataset dataset

EXPOSE 3000

CMD ["bun", "run", "apps/api/src/index.ts"]
