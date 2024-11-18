# TypeScript Project Knowledge

## Project Setup
- Node.js project with TypeScript configuration
- Source files in `src/` directory
- Compiled output in `dist/` directory

## Documentation Requirements
- Maintain README.md with:
  - Project overview and purpose
  - Setup instructions
  - Development commands
  - API documentation if applicable
- Keep documentation in sync with code changes

## Available Scripts
- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run the compiled JavaScript
- `npm run dev`: Watch mode - recompile on file changes

## Project Structure
- `src/`: TypeScript source files
- `dist/`: Compiled JavaScript (gitignored)
- `tsconfig.json`: TypeScript configuration
- `api/`: Backend API code
  - `services/`: Shared business logic and utilities
  - Handlers should be thin layers over services
  - Avoid duplicating logic between API and tRPC handlers

## Architecture Guidelines
- Centralize shared logic in service modules
- Keep API/tRPC handlers thin, delegating to services
- Async operations should use status tracking for better UX
- Use tRPC exclusively for API endpoints - no REST endpoints
- Client uses wouter for routing with a SPA architecture
- Article sharing follows /share?url=<encoded-url> pattern
- Use tRPC exclusively for API endpoints - no REST endpoints
- Client uses wouter for routing with a SPA architecture
- Article sharing follows /share?url=<encoded-url> pattern
- Prefer simple, working solutions over premature optimizations
- Use existing libraries as intended unless there's a clear performance bottleneck
- `api/`: Backend API code
  - `services/`: Shared business logic and utilities
  - Handlers should be thin layers over services
  - Avoid duplicating logic between API and tRPC handlers

## Architecture Guidelines
- Centralize shared logic in service modules
- Keep API/tRPC handlers thin, delegating to services
- Async operations should use status tracking for better UX

