# Article Processing Service

A service that converts articles to audio and generates summaries.

## Features
- Converts web articles to markdown
- Generates audio versions using Edge TTS
- Creates AI summaries using GPT-4
- Tracks processing status

## Setup
```bash
npm install
```

## Development
```bash
# Start Vite dev server
npm run dev

# Start Vercel dev server (API)
npm run vercel-dev
```

## Environment Variables
Required environment variables:
- `DATABASE_URL`: Neon database connection string
- `OPENAI_API_KEY`: OpenAI API key

## Testing
```bash
npm test
```
