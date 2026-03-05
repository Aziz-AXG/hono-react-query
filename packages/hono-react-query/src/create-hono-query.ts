"use client";

import { createRouteProxy, createUtilsProxy } from "./create-proxy";
import { useQueryClient } from "@tanstack/react-query";
import type { CreateHonoQueryReturn } from "./types";

/**
 * Create a tRPC-like typed query client from a Hono RPC client.
 *
 * Pass in your `hc<AppType>(...)` client directly — TypeScript will
 * infer the full route structure and provide typed hooks.
 *
 * @example
 * ```ts
 * import { hc } from 'hono/client'
 * import { createHonoQuery } from 'hono-react-query'
 * import type { AppType } from './server'
 *
 * const client = hc<AppType>('http://localhost:3000/')
 * export const api = createHonoQuery(client)
 *
 * // In components — fully typed:
 * const { data } = api.api.greeting.useQuery({ query: { name: "John" } })
 * //                       ^--- data is { message: string; timestamp: string }
 * ```
 */
export function createHonoQuery<TClient extends Record<string, any>>(
  client: TClient,
): CreateHonoQueryReturn<TClient> {
  // Create the main proxy that mirrors the hc client route structure
  const proxy = createRouteProxy(client);

  // Wrap with a top-level handler to add useUtils
  const handler: ProxyHandler<any> = {
    get(_target, prop: string) {
      if (prop === "useUtils") {
        return () => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const queryClient = useQueryClient();
          return createUtilsProxy(queryClient);
        };
      }

      // Delegate to the route proxy
      return (proxy as any)[prop];
    },
  };

  return new Proxy({} as any, handler);
}
