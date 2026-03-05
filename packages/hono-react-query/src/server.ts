import type { CreateServerReturn } from "./types";

/**
 * Execute a Hono RPC call and parse the JSON response (server-side).
 */
async function executeRpcCall(
  endpoint: any,
  method: string,
  input?: any,
): Promise<any> {
  const fn = endpoint[method];
  if (typeof fn !== "function") {
    throw new Error(`Method ${method} not found on endpoint`);
  }

  const res = await fn(input ?? {});

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(
      `Hono RPC Error: ${res.status} ${res.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
    );
  }

  return res.json();
}

/**
 * Navigate into a nested object following a path array.
 */
function resolveClientPath(client: any, path: readonly string[]): any {
  let current = client;
  for (const segment of path) {
    if (current == null) return undefined;
    current = current[segment];
  }
  return current;
}

const QUERY_METHODS = ["$get"];
const MUTATION_METHODS = ["$post", "$put", "$patch", "$delete"];

/**
 * Create a server-side typed API from a Hono RPC client.
 *
 * This is for use in server components, API routes, and server actions —
 * no React hooks, just plain async functions.
 *
 * @example
 * ```ts
 * import { hc } from 'hono/client'
 * import { createHonoQueryServer } from 'hono-react-query/server'
 * import type { AppType } from './server'
 *
 * const client = hc<AppType>('http://localhost:3000')
 * const serverApi = createHonoQueryServer(client.api)
 *
 * // In a server component:
 * const greeting = await serverApi.greeting.query({ query: { name: "John" } })
 * const newPost = await serverApi.posts.mutate({ json: { title: "Hi", body: "..." } })
 * const updated = await serverApi.posts.$put({ json: { title: "Updated" } })
 * const deleted = await serverApi.posts.$delete({ param: { id: "123" } })
 * ```
 */
export function createHonoQueryServer<TClient extends Record<string, any>>(
  client: TClient,
): CreateServerReturn<TClient> {
  return createServerProxy(client) as any;
}

function createServerProxy(hcClient: any, path: string[] = []): any {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      // ── query() — calls $get ────────────────────────────────────────
      if (prop === "query") {
        return async (input?: any) => {
          const endpoint = resolveClientPath(hcClient, path);
          const method = QUERY_METHODS.find(
            (m) => typeof endpoint?.[m] === "function",
          );
          if (!method) {
            throw new Error(
              `No $get method at path "${path.join("/")}". query() requires a GET route.`,
            );
          }
          return executeRpcCall(endpoint, method, input);
        };
      }

      // ── mutate() — calls first mutation method ──────────────────────
      if (prop === "mutate") {
        return async (input?: any) => {
          const endpoint = resolveClientPath(hcClient, path);
          const method = MUTATION_METHODS.find(
            (m) => typeof endpoint?.[m] === "function",
          );
          if (!method) {
            throw new Error(
              `No mutation method at path "${path.join("/")}". mutate() requires a non-GET route.`,
            );
          }
          return executeRpcCall(endpoint, method, input);
        };
      }

      // ── $post / $put / $patch / $delete — explicit method calls ────
      if (
        prop === "$post" ||
        prop === "$put" ||
        prop === "$patch" ||
        prop === "$delete"
      ) {
        return async (input?: any) => {
          const endpoint = resolveClientPath(hcClient, path);
          if (typeof endpoint?.[prop] !== "function") {
            throw new Error(`No ${prop} method at path "${path.join("/")}".`);
          }
          return executeRpcCall(endpoint, prop, input);
        };
      }

      // ── Keep building path for nested routes ───────────────────────
      return createServerProxy(hcClient, [...path, prop]);
    },
  });
}
