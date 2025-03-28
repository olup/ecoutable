# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN npm install -g pnpm

# Copy only necessary files for build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/backend/src ./packages/backend/src/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the TypeScript backend
WORKDIR /app/packages/backend
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only the necessary files from the builder
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./

# Install only production dependencies
RUN npm install -g pnpm@latest-10
RUN pnpm install -P 
RUN npm remove -g pnpm

# Expose the backend port
EXPOSE 3000

# Start the backend server
CMD ["node", "dist/index.js"]
