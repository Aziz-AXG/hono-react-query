// hono-react-query
// tRPC-like React Query integration for Hono RPC

// ── Client-side (React hooks) ────────────────────────────────────────────────
export { createHonoQuery } from "./create-hono-query";

export { HonoQueryProvider, useHonoQueryContext } from "./provider";
export type { HonoQueryProviderProps } from "./provider";

export { getQueryKey } from "./query-key";

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  HonoQueryConfig,
  CreateHonoQueryReturn,
  CreateServerReturn,
  HonoQueryProxy,
  ServerProxy,
  UtilsProxy,
  InferResponseData,
  InferInput,
} from "./types";
