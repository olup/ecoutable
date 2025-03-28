# Ecoutable Backend

Node.js backend service built with Fastify and TypeScript.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

## Docker

The backend can be run using Docker:

```bash
# Build the image
pnpm docker:build

# Run the container
pnpm docker:run
```

Or using docker-compose:

```bash
# Start all services
docker compose up

# Start in detached mode
docker compose up -d

# Stop all services
docker compose down
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /v1/api/example/hello` - Example hello endpoint
- `POST /v1/api/example/echo` - Echo back the sent message

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)

## Project Structure

```
src/
├── index.ts        # Application entry point
├── routes/         # API route handlers
├── types/          # TypeScript type definitions
└── services/       # Business logic and external service integrations