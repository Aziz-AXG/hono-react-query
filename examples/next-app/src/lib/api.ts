import { hc } from "hono/client";
import { createHonoQuery } from "@aziz-axg/hono-react-query";
import type { AppType } from "./server";

/**
 * Create the typed API client.
 *
 * Step 1: Create the hc client with your AppType (this gives full type inference)
 * Step 2: Pass it to createHonoQuery — the proxy mirrors the route structure
 *
 * Because the server uses .basePath('/api'), the client structure is:
 *   client.api.greeting.$get(...)
 *   client.api.posts.$get(...)
 *
 * We pass `client.api` to createHonoQuery so the usage is:
 *   api.greeting.useQuery(...)
 *   api.posts.useMutation(...)
 */
const client = hc<AppType>("http://localhost:3000");

export const api = createHonoQuery(client.api);
