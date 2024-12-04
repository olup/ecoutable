import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { httpBatchLink } from "@trpc/react-query";
import { FC, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./lib/trpc";

const queryClient = new QueryClient();

export const WithTrpcClient: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getToken } = useKindeAuth();

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: `${import.meta.env.VITE_API_URL}trpc`,
        headers: async () => {
          const token = await getToken?.();
          return {
            Authorization: `Bearer ${token}`,
          };
        },

        fetch: (url, options) =>
          fetch(url, {
            ...options,
            credentials: "same-origin",
          }),
      }),
    ],
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
