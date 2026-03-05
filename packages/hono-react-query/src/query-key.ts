import type { QueryKey } from "@tanstack/react-query";

/**
 * Generate a stable query key from a path and optional input.
 *
 * Follows the tRPC convention:
 *   [["path", "segments"], { input: ..., type: "query" }]
 *
 * @example
 * getQueryKey(["greeting"], { query: { name: "John" } })
 * // => [["greeting"], { input: { query: { name: "John" } }, type: "query" }]
 *
 * getQueryKey(["posts"])
 * // => [["posts"]]
 */
export function getQueryKey(
  path: readonly string[],
  input?: unknown,
  type: "query" | "infinite" | "mutation" = "query",
): QueryKey {
  if (input === undefined || input === null) {
    return [path];
  }
  return [path, { input, type }];
}
