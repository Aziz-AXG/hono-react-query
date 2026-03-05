import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useSuspenseQuery,
  type QueryClient,
} from "@tanstack/react-query";
import { getQueryKey } from "./query-key";

// HTTP methods that map to queries (GET) vs mutations (POST, PUT, PATCH, DELETE)
const QUERY_METHODS = new Set(["$get"]);
const MUTATION_METHODS = new Set(["$post", "$put", "$patch", "$delete"]);

/**
 * Terminal hook names that the proxy intercepts.
 * When the user accesses e.g. `api.greeting.useQuery(...)`,
 * the proxy recognizes "useQuery" as a terminal and returns a function.
 */
const HOOK_NAMES = new Set([
  "useQuery",
  "useMutation",
  "useInfiniteQuery",
  "useSuspenseQuery",
  "useUtils",
  "getQueryKey",
]);

/**
 * Utility helper names available on the useUtils proxy.
 */
const UTILS_HELPERS = new Set([
  "invalidate",
  "refetch",
  "cancel",
  "prefetch",
  "fetch",
  "ensureData",
  "setData",
  "getData",
  "setInfiniteData",
  "getInfiniteData",
  "prefetchInfinite",
  "fetchInfinite",
]);

/**
 * Navigate into a nested object following a path array.
 * e.g. resolveClientPath(client, ["posts", "list"]) => client.posts.list
 */
function resolveClientPath(client: any, path: readonly string[]): any {
  let current = client;
  for (const segment of path) {
    if (current == null) return undefined;
    current = current[segment];
  }
  return current;
}

/**
 * Find the first available query method ($get) on a client endpoint.
 */
function findQueryMethod(endpoint: any): string | undefined {
  for (const method of QUERY_METHODS) {
    if (typeof endpoint?.[method] === "function") {
      return method;
    }
  }
  return undefined;
}

/**
 * Find the first available mutation method ($post, $put, $patch, $delete) on a client endpoint.
 */
function findMutationMethod(endpoint: any): string | undefined {
  for (const method of MUTATION_METHODS) {
    if (typeof endpoint?.[method] === "function") {
      return method;
    }
  }
  return undefined;
}

/**
 * Execute a Hono RPC call and parse the JSON response.
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
 * Create the main route proxy that intercepts property access
 * and builds up a path, attaching hook functions at terminal nodes.
 */
export function createRouteProxy(hcClient: any, path: string[] = []): any {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      // ── Terminal hooks ─────────────────────────────────────────────

      if (prop === "useQuery") {
        return (input?: any, opts?: any) => {
          const endpoint = resolveClientPath(hcClient, path);
          const method = findQueryMethod(endpoint);
          if (!method) {
            throw new Error(
              `No $get method found at path "${path.join("/")}". useQuery only works with GET routes.`,
            );
          }
          const queryKey = getQueryKey(path, input, "query");
          return useQuery({
            queryKey,
            queryFn: () => executeRpcCall(endpoint, method, input),
            ...opts,
          });
        };
      }

      if (prop === "useSuspenseQuery") {
        return (input?: any, opts?: any) => {
          const endpoint = resolveClientPath(hcClient, path);
          const method = findQueryMethod(endpoint);
          if (!method) {
            throw new Error(
              `No $get method found at path "${path.join("/")}". useSuspenseQuery only works with GET routes.`,
            );
          }
          const queryKey = getQueryKey(path, input, "query");
          return useSuspenseQuery({
            queryKey,
            queryFn: () => executeRpcCall(endpoint, method, input),
            ...opts,
          });
        };
      }

      if (prop === "useInfiniteQuery") {
        return (input?: any, opts?: any) => {
          const endpoint = resolveClientPath(hcClient, path);
          const method = findQueryMethod(endpoint);
          if (!method) {
            throw new Error(
              `No $get method found at path "${path.join("/")}". useInfiniteQuery only works with GET routes.`,
            );
          }
          const queryKey = getQueryKey(path, input, "infinite");
          return useInfiniteQuery({
            queryKey,
            queryFn: ({ pageParam }) => {
              const mergedInput = input
                ? {
                    ...input,
                    query: { ...(input.query ?? {}), cursor: pageParam },
                  }
                : { query: { cursor: pageParam } };
              return executeRpcCall(endpoint, method, mergedInput);
            },
            ...opts,
          });
        };
      }

      if (prop === "useMutation") {
        return (opts?: any) => {
          const endpoint = resolveClientPath(hcClient, path);
          const method = findMutationMethod(endpoint);
          if (!method) {
            throw new Error(
              `No mutation method ($post/$put/$patch/$delete) found at path "${path.join("/")}". ` +
                `useMutation requires a non-GET route.`,
            );
          }
          const mutationKey = [path];
          return useMutation({
            mutationKey,
            mutationFn: (variables: any) =>
              executeRpcCall(endpoint, method, variables),
            ...opts,
          });
        };
      }

      // ── Per-method mutation hooks ───────────────────────────────────
      if (
        prop === "usePost" ||
        prop === "usePut" ||
        prop === "usePatch" ||
        prop === "useDelete"
      ) {
        const methodMap: Record<string, string> = {
          usePost: "$post",
          usePut: "$put",
          usePatch: "$patch",
          useDelete: "$delete",
        };
        const httpMethod = methodMap[prop];
        return (opts?: any) => {
          const endpoint = resolveClientPath(hcClient, path);
          if (typeof endpoint?.[httpMethod] !== "function") {
            throw new Error(
              `No ${httpMethod} method found at path "${path.join("/")}". ${prop} requires a ${httpMethod.slice(1).toUpperCase()} route.`,
            );
          }
          const mutationKey = [path, { method: httpMethod }];
          return useMutation({
            mutationKey,
            mutationFn: (variables: any) =>
              executeRpcCall(endpoint, httpMethod, variables),
            ...opts,
          });
        };
      }

      if (prop === "getQueryKey") {
        return (input?: any) => getQueryKey(path, input, "query");
      }

      // ── Keep building the path for nested routes ────────────────────
      return createRouteProxy(hcClient, [...path, prop]);
    },

    // Support calling the proxy as a function (edge case)
    apply(_target, _thisArg, args) {
      return createRouteProxy(hcClient, [...path, ...args]);
    },
  });
}

/**
 * Create a utils proxy for cache management via useUtils().
 * Exposes helpers like: utils.greeting.invalidate(), utils.greeting.getData(), etc.
 */
export function createUtilsProxy(
  queryClient: QueryClient,
  path: string[] = [],
): any {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      // Terminal utility helpers
      if (UTILS_HELPERS.has(prop)) {
        return (...args: any[]) => {
          const queryKey = path;

          switch (prop) {
            case "invalidate":
              return queryClient.invalidateQueries({
                queryKey: [queryKey],
                ...args[0],
              });
            case "refetch":
              return queryClient.refetchQueries({
                queryKey: [queryKey],
                ...args[0],
              });
            case "cancel":
              return queryClient.cancelQueries({
                queryKey: [queryKey],
                ...args[0],
              });
            case "prefetch":
              return queryClient.prefetchQuery({
                queryKey: getQueryKey(queryKey, args[0], "query"),
                ...args[1],
              });
            case "fetch":
              return queryClient.fetchQuery({
                queryKey: getQueryKey(queryKey, args[0], "query"),
                ...args[1],
              });
            case "ensureData":
              return queryClient.ensureQueryData({
                queryKey: getQueryKey(queryKey, args[0], "query"),
                ...args[1],
              });
            case "setData": {
              const [input, updater, options] = args;
              return queryClient.setQueryData(
                getQueryKey(queryKey, input, "query"),
                updater,
                options,
              );
            }
            case "getData": {
              const [input] = args;
              return queryClient.getQueryData(
                getQueryKey(queryKey, input, "query"),
              );
            }
            case "setInfiniteData": {
              const [input, updater, options] = args;
              return queryClient.setQueryData(
                getQueryKey(queryKey, input, "infinite"),
                updater,
                options,
              );
            }
            case "getInfiniteData": {
              const [input] = args;
              return queryClient.getQueryData(
                getQueryKey(queryKey, input, "infinite"),
              );
            }
            case "prefetchInfinite":
              return queryClient.prefetchInfiniteQuery({
                queryKey: getQueryKey(queryKey, args[0], "infinite"),
                ...args[1],
              });
            case "fetchInfinite":
              return queryClient.fetchInfiniteQuery({
                queryKey: getQueryKey(queryKey, args[0], "infinite"),
                ...args[1],
              });
            default:
              throw new Error(`Unknown utility helper: ${prop}`);
          }
        };
      }

      // Keep building path for nested routes
      return createUtilsProxy(queryClient, [...path, prop]);
    },
  });
}
