# Dockerfile for Next.js application
# Uses a multi-stage build for a lean production image.

# 1. Base Stage: Install dependencies
FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# 2. Builder Stage: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm db:generate

# Build Next.js app
RUN pnpm build

# 3. Runner Stage: Production image
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# You may need to open up the folder permissions for Next.js
# to be able to create cache files.
# See https://github.com/vercel/next.js/issues/40601
RUN chown -R node:node /app

USER node

# Copy built assets
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
