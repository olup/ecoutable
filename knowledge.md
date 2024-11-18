# TypeScript Project Knowledge

## Project Setup
- Node.js project with TypeScript configuration
- Source files in `src/` directory
- Compiled output in `dist/` directory
- Deployed on Cloudflare Pages
  - Uses Workers for API endpoints
  - Replace Vercel Blob with Cloudflare R2 for storage
  - Development using wrangler
  - Requires wrangler.toml for configuration:
    - Compatibility flags
    - Environment variables
    - R2 bucket bindings
    - KV namespace bindings

[REST OF FILE UNCHANGED]
