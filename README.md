# Ecoutable Monorepo

Full-stack application with React frontend and Node.js backend.

## Project Structure

```
.
├── packages/
│   ├── frontend/     # React frontend (Firebase hosted)
│   └── backend/      # Node.js backend (Cloud Run)
└── infra/           # Pulumi infrastructure code
```

## Development

```bash
# Install dependencies
pnpm install

# Start backend development server
pnpm --filter backend dev

# Start frontend development server
pnpm --filter frontend dev
```

## Infrastructure Setup

The application uses:
- Google Cloud Run for the backend API
- Firebase Hosting for the frontend
- Pulumi for infrastructure management

### Prerequisites

1. Install required tools:
   ```bash
   npm install -g firebase-tools pulumi
   ```

2. Configure GCP:
   ```bash
   # Login to GCP
   gcloud auth application-default login
   
   # Set project
   gcloud config set project YOUR_PROJECT_ID
   ```

3. Initialize Pulumi:
   ```bash
   cd infra
   pulumi stack init dev
   pulumi config set gcp:project YOUR_PROJECT_ID
   ```

### Deployment

1. Deploy infrastructure:
   ```bash
   cd infra
   pulumi up
   ```

2. Build and deploy frontend:
   ```bash
   # Build frontend
   pnpm --filter frontend build
   
   # Deploy to Firebase (replace with your project ID from Pulumi output)
   cd packages/frontend
   firebase use YOUR_PROJECT_ID
   firebase deploy
   ```

The application will be available at:
- Frontend: https://[project-id].web.app
- Backend API: https://backend-[hash].run.app

## API Routing

Firebase Hosting is configured to route:
- `/api/*` requests to the Cloud Run backend service
- All other requests to the frontend SPA

Backend API endpoints are available at:
- Health check: `GET /api/health`
- API v1: `GET /api/v1/example/hello`

## Environment Variables

### Backend
See `packages/backend/.env.example` for required environment variables.

### Frontend
Frontend environment variables should be configured in Firebase:
```bash
firebase functions:config:set backend.url="YOUR_BACKEND_URL"
```

## Contributing

1. Create a new branch for your feature
2. Make changes and test locally
3. Submit a pull request

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter backend test
pnpm --filter frontend test