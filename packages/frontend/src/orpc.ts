import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { Router } from "../../backend/src/index";
import { createORPCReactQueryUtils } from "@orpc/react-query";

console.log("API URL", import.meta.env.VITE_API_URL);

const link = new RPCLink({
  url: `${import.meta.env.VITE_API_URL}`,
});

export const orpc: RouterClient<Router> = createORPCClient(link);
export const useOrpc = createORPCReactQueryUtils(orpc);
