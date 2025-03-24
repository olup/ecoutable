import type { CloudflareResponseBody } from 'vite-plugin-cloudflare-functions/worker';

import 'vite-plugin-cloudflare-functions/client';

declare module 'vite-plugin-cloudflare-functions/client' {
  interface PagesResponseBody {
    '/files/**:files': {
      ALL: CloudflareResponseBody<typeof import('functions/files/[[files]]')['onRequest']>;
    };
    '/trpc/:trpc': {
      ALL: CloudflareResponseBody<typeof import('functions/trpc/[trpc]')['onRequest']>;
    };
  }
}
