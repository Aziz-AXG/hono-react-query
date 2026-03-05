"use client";

import React, { createContext, useContext, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface HonoQueryContextValue {
  /** The hc client instance (any because the generic type is resolved at the proxy level) */
  hcClient: any;
}

const HonoQueryContext = createContext<HonoQueryContextValue | null>(null);

export function useHonoQueryContext(): HonoQueryContextValue {
  const ctx = useContext(HonoQueryContext);
  if (!ctx) {
    throw new Error(
      "useHonoQueryContext must be used within a HonoQueryProvider. " +
        "Wrap your app with <HonoQueryProvider>.",
    );
  }
  return ctx;
}

export interface HonoQueryProviderProps {
  children: React.ReactNode;
  /** A TanStack QueryClient instance */
  queryClient: QueryClient;
  /** The hc client instance (created internally by createHonoQuery) */
  hcClient: any;
}

/**
 * Provider component that wraps QueryClientProvider and supplies the Hono
 * client to all hooks. This is created and returned by `createHonoQuery()`.
 */
export function HonoQueryProvider({
  children,
  queryClient,
  hcClient,
}: HonoQueryProviderProps) {
  const value = useMemo(() => ({ hcClient }), [hcClient]);

  return (
    <HonoQueryContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </HonoQueryContext.Provider>
  );
}
