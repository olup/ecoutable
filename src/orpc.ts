import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { Router } from "../functions/api/[[route]]";
import { createORPCReactQueryUtils } from "@orpc/react-query";

const link = new RPCLink({
  url: `${location.origin}/api`,
});

export const orpc: RouterClient<Router> = createORPCClient(link);
export const useOrpc = createORPCReactQueryUtils(orpc);
