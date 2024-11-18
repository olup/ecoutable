# TypeScript Project Knowledge

## Project Setup
- Node.js project with TypeScript configuration
- Source files in `src/` directory
- Compiled output in `dist/` directory

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
- `api/`: Backend API code
  - `services/`: Shared business logic and utilities
  - Handlers should be thin layers over services
  - Avoid duplicating logic between API and tRPC handlers

## Architecture Guidelines
- Centralize shared logic in service modules
- Keep API/tRPC handlers thin, delegating to services
- Async operations should use status tracking for better UX

