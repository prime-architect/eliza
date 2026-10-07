/** Authenticated enrollment only: neither static API keys nor local bypass establish a Cloud user. */
import type http from "node:http";
import { getCloudRuntimeRequestIdentity } from "@elizaos/contracts";
import type { IAgentRuntime } from "@elizaos/core";
import { readRequestBodyBuffer } from "@elizaos/host";
import type { CloudGoogleDelegationService } from "@elizaos/plugin-elizacloud/services/cloud-google-delegation";
import { authStoreForRuntime } from "../services/auth-store";
import { resolveAuthorizedRouteRole } from "./auth";
export async function handleCloudGoogleDelegationRoute(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  _runtime: IAgentRuntime | null,
): Promise<boolean> {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  if (!path.startsWith("/api/workflow/hosted/cloud-delegation/")) return false;
  res.statusCode = 410;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(
    JSON.stringify({
      error: "Cloud delegation is disabled in autonomous offline mode",
    }),
  );
  return true;
}
