import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../functions/trpc/router";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
      fetch: (url, options) =>
        fetch(url, {
          ...options,
          credentials: "same-origin",
        }),
    }),
  ],
});
