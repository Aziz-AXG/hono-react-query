import type {
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
  UseInfiniteQueryResult,
  QueryKey,
} from "@tanstack/react-query";
import type { ClientResponse } from "hono/client";

// ─── Type Extraction Helpers ─────────────────────────────────────────────────

/** Extract the JSON response data type from a Hono client method */
export type InferResponseData<T> = T extends (
  ...args: any[]
) => Promise<ClientResponse<infer R, any, any>>
  ? R
  : never;

/** Extract the input argument type from a Hono client method */
export type InferInput<T> = T extends (args: infer A, ...rest: any[]) => any
  ? A
  : void;

// (RequiredArgs removed — we use direct conditional function types for better errors)

// ─── Method Extraction (safe — returns never if not found) ───────────────────

type GetMethod<T> = T extends { $get: infer M } ? M : never;
type PostMethod<T> = T extends { $post: infer M } ? M : never;
type PutMethod<T> = T extends { $put: infer M } ? M : never;
type PatchMethod<T> = T extends { $patch: infer M } ? M : never;
type DeleteMethod<T> = T extends { $delete: infer M } ? M : never;

/** First available mutation method ($post > $put > $patch > $delete) */
type FirstMutationMethod<T> = T extends { $post: infer M }
  ? M
  : T extends { $put: infer M }
    ? M
    : T extends { $patch: infer M }
      ? M
      : T extends { $delete: infer M }
        ? M
        : never;

// ─── Mutation Hook Helper (reused for each HTTP method) ──────────────────────

/**
 * Descriptive mutate function — names the parameter based on input shape.
 * e.g. "An argument for 'jsonBody' was not provided."
 */
type DescriptiveMutateFn<TInput, TData, TError, TContext = unknown> =
  IsEmptyInput<TInput> extends true
    ? (
        input?: TInput,
        options?: {
          onSuccess?: (data: TData) => void;
          onError?: (error: TError) => void;
          onSettled?: () => void;
        },
      ) => void
    : TInput extends { query: any }
      ? (
          query: TInput,
          options?: {
            onSuccess?: (data: TData) => void;
            onError?: (error: TError) => void;
            onSettled?: () => void;
          },
        ) => void
      : TInput extends { json: any }
        ? (
            json: TInput,
            options?: {
              onSuccess?: (data: TData) => void;
              onError?: (error: TError) => void;
              onSettled?: () => void;
            },
          ) => void
        : TInput extends { param: any }
          ? (
              param: TInput,
              options?: {
                onSuccess?: (data: TData) => void;
                onError?: (error: TError) => void;
                onSettled?: () => void;
              },
            ) => void
          : (
              input: TInput,
              options?: {
                onSuccess?: (data: TData) => void;
                onError?: (error: TError) => void;
                onSettled?: () => void;
              },
            ) => void;

type DescriptiveMutateAsyncFn<TInput, TData, TError> =
  IsEmptyInput<TInput> extends true
    ? (
        input?: TInput,
        options?: {
          onSuccess?: (data: TData) => void;
          onError?: (error: TError) => void;
          onSettled?: () => void;
        },
      ) => Promise<TData>
    : TInput extends { query: any }
      ? (
          query: TInput,
          options?: {
            onSuccess?: (data: TData) => void;
            onError?: (error: TError) => void;
            onSettled?: () => void;
          },
        ) => Promise<TData>
      : TInput extends { json: any }
        ? (
            json: TInput,
            options?: {
              onSuccess?: (data: TData) => void;
              onError?: (error: TError) => void;
              onSettled?: () => void;
            },
          ) => Promise<TData>
        : TInput extends { param: any }
          ? (
              param: TInput,
              options?: {
                onSuccess?: (data: TData) => void;
                onError?: (error: TError) => void;
                onSettled?: () => void;
              },
            ) => Promise<TData>
          : (
              input: TInput,
              options?: {
                onSuccess?: (data: TData) => void;
                onError?: (error: TError) => void;
                onSettled?: () => void;
              },
            ) => Promise<TData>;

/** Override .mutate() and .mutateAsync() with descriptive param names */
type DescriptiveMutationResult<TData, TError, TInput> = Omit<
  UseMutationResult<TData, TError, TInput>,
  "mutate" | "mutateAsync"
> & {
  mutate: DescriptiveMutateFn<TInput, TData, TError>;
  mutateAsync: DescriptiveMutateAsyncFn<TInput, TData, TError>;
};

type MutationHookFn<TMethod> = <TError = Error>(
  opts?: Omit<
    UseMutationOptions<InferResponseData<TMethod>, TError, InferInput<TMethod>>,
    "mutationKey" | "mutationFn"
  >,
) => DescriptiveMutationResult<
  InferResponseData<TMethod>,
  TError,
  InferInput<TMethod>
>;

// ─── Descriptive Query Hook Signatures ────────────────────────────────────────
//
// We pick the parameter name based on the primary key in the Hono input type.
// This way TypeScript errors say e.g.:
//   "An argument for 'queryParams' was not provided."
//   "An argument for 'jsonBody' was not provided."
// instead of the generic "An argument for 'input' was not provided."

/** Query opts helper — shortens the conditional type below */
type QueryOpts<TData, TError> = Omit<
  UseQueryOptions<TData, TError>,
  "queryKey" | "queryFn"
>;
type SuspenseOpts<TData, TError> = Omit<
  UseSuspenseQueryOptions<TData, TError>,
  "queryKey" | "queryFn"
>;

/**
 * Check if input is "empty" — either void or {} (no validators).
 * Hono routes without validators produce {} as input type.
 */
type IsEmptyInput<T> = [T] extends [void]
  ? true
  : keyof T extends never
    ? true
    : false;

/** Pick a descriptive function signature based on the input shape */
type DescriptiveQueryFn<TInput, TData, TError> =
  // No input needed (void or {}) → optional
  IsEmptyInput<TInput> extends true
    ? (
        input?: TInput,
        opts?: QueryOpts<TData, TError>,
      ) => UseQueryResult<TData, TError>
    : // Has { query: ... } → name it queryParams
      TInput extends { query: any }
      ? (
          query: TInput,
          opts?: QueryOpts<TData, TError>,
        ) => UseQueryResult<TData, TError>
      : // Has { json: ... } → name it jsonBody
        TInput extends { json: any }
        ? (
            json: TInput,
            opts?: QueryOpts<TData, TError>,
          ) => UseQueryResult<TData, TError>
        : // Has { param: ... } → name it routeParams
          TInput extends { param: any }
          ? (
              param: TInput,
              opts?: QueryOpts<TData, TError>,
            ) => UseQueryResult<TData, TError>
          : // Fallback
            (
              input: TInput,
              opts?: QueryOpts<TData, TError>,
            ) => UseQueryResult<TData, TError>;

type DescriptiveSuspenseFn<TInput, TData, TError> =
  IsEmptyInput<TInput> extends true
    ? (
        input?: TInput,
        opts?: SuspenseOpts<TData, TError>,
      ) => UseSuspenseQueryResult<TData, TError>
    : TInput extends { query: any }
      ? (
          query: TInput,
          opts?: SuspenseOpts<TData, TError>,
        ) => UseSuspenseQueryResult<TData, TError>
      : TInput extends { json: any }
        ? (
            json: TInput,
            opts?: SuspenseOpts<TData, TError>,
          ) => UseSuspenseQueryResult<TData, TError>
        : TInput extends { param: any }
          ? (
              param: TInput,
              opts?: SuspenseOpts<TData, TError>,
            ) => UseSuspenseQueryResult<TData, TError>
          : (
              input: TInput,
              opts?: SuspenseOpts<TData, TError>,
            ) => UseSuspenseQueryResult<TData, TError>;

type DescriptiveInfiniteFn<TInput, TData, TError> =
  IsEmptyInput<TInput> extends true
    ? (input?: TInput, opts?: any) => UseInfiniteQueryResult<TData, TError>
    : TInput extends { query: any }
      ? (
          query: TInput,
          opts?: any,
        ) => UseInfiniteQueryResult<TData, TError>
      : TInput extends { json: any }
        ? (
            json: TInput,
            opts?: any,
          ) => UseInfiniteQueryResult<TData, TError>
        : TInput extends { param: any }
          ? (
              param: TInput,
              opts?: any,
            ) => UseInfiniteQueryResult<TData, TError>
          : (
              input: TInput,
              opts?: any,
            ) => UseInfiniteQueryResult<TData, TError>;

type QueryHooks<T> = [GetMethod<T>] extends [never]
  ? {}
  : {
      /**
       * Fetch data via $get.
       * @example api.greeting.useQuery({ query: { name: "John" } })
       */
      useQuery: DescriptiveQueryFn<
        InferInput<GetMethod<T>>,
        InferResponseData<GetMethod<T>>,
        Error
      >;

      /** Suspense-compatible query via $get. */
      useSuspenseQuery: DescriptiveSuspenseFn<
        InferInput<GetMethod<T>>,
        InferResponseData<GetMethod<T>>,
        Error
      >;

      /** Infinite/paginated query via $get. */
      useInfiniteQuery: DescriptiveInfiniteFn<
        InferInput<GetMethod<T>>,
        InferResponseData<GetMethod<T>>,
        Error
      >;
    };

// ─── Mutation Hooks (one generic + per-method specifics) ─────────────────────

/** useMutation — defaults to first available method ($post > $put > $patch > $delete) */
type DefaultMutationHook<T> = [FirstMutationMethod<T>] extends [never]
  ? {}
  : { useMutation: MutationHookFn<FirstMutationMethod<T>> };

/** usePost — only when $post exists */
type PostHook<T> = [PostMethod<T>] extends [never]
  ? {}
  : { usePost: MutationHookFn<PostMethod<T>> };

/** usePut — only when $put exists */
type PutHook<T> = [PutMethod<T>] extends [never]
  ? {}
  : { usePut: MutationHookFn<PutMethod<T>> };

/** usePatch — only when $patch exists */
type PatchHook<T> = [PatchMethod<T>] extends [never]
  ? {}
  : { usePatch: MutationHookFn<PatchMethod<T>> };

/** useDelete — only when $delete exists */
type DeleteHook<T> = [DeleteMethod<T>] extends [never]
  ? {}
  : { useDelete: MutationHookFn<DeleteMethod<T>> };

// ─── Base Hooks (always available) ───────────────────────────────────────────

type BaseHooks = {
  /** Get the query key for manual React Query operations */
  getQueryKey: (input?: any) => QueryKey;
};

// ─── Recursive Client-Side Proxy Type ────────────────────────────────────────

type ChildRoutes<T> = {
  [K in Exclude<keyof T, `$${string}` | symbol | number>]: T[K] extends Record<
    string,
    any
  >
    ? HonoQueryProxy<T[K]>
    : never;
};

/** Full client-side proxy: child routes + all hook types */
export type HonoQueryProxy<T> = ChildRoutes<T> &
  QueryHooks<T> &
  DefaultMutationHook<T> &
  PostHook<T> &
  PutHook<T> &
  PatchHook<T> &
  DeleteHook<T> &
  BaseHooks;

// ─── Server-Side Proxy Type ─────────────────────────────────────────────────

type ServerChildRoutes<T> = {
  [K in Exclude<keyof T, `$${string}` | symbol | number>]: T[K] extends Record<
    string,
    any
  >
    ? ServerProxy<T[K]>
    : never;
};

/** Descriptive server function — picks param name based on input shape */
type DescriptiveServerFn<TInput, TData> =
  IsEmptyInput<TInput> extends true
    ? (input?: TInput) => Promise<TData>
    : TInput extends { query: any }
      ? (query: TInput) => Promise<TData>
      : TInput extends { json: any }
        ? (json: TInput) => Promise<TData>
        : TInput extends { param: any }
          ? (param: TInput) => Promise<TData>
          : (input: TInput) => Promise<TData>;

/** Server query function — for $get */
type ServerQueryFn<T> = [GetMethod<T>] extends [never]
  ? {}
  : {
      /** Call $get and return typed JSON. @example await serverApi.greeting.query({ query: { name: "John" } }) */
      query: DescriptiveServerFn<
        InferInput<GetMethod<T>>,
        InferResponseData<GetMethod<T>>
      >;
    };

/** Server mutation helper type */
type ServerMutationFn<TMethod> = DescriptiveServerFn<
  InferInput<TMethod>,
  InferResponseData<TMethod>
>;

/** Server mutation functions — one per available method */
type ServerMutationFns<T> = ([FirstMutationMethod<T>] extends [never]
  ? {}
  : { mutate: ServerMutationFn<FirstMutationMethod<T>> }) &
  ([PostMethod<T>] extends [never]
    ? {}
    : { $post: ServerMutationFn<PostMethod<T>> }) &
  ([PutMethod<T>] extends [never]
    ? {}
    : { $put: ServerMutationFn<PutMethod<T>> }) &
  ([PatchMethod<T>] extends [never]
    ? {}
    : { $patch: ServerMutationFn<PatchMethod<T>> }) &
  ([DeleteMethod<T>] extends [never]
    ? {}
    : { $delete: ServerMutationFn<DeleteMethod<T>> });

/** Full server-side proxy: child routes + query/mutate functions */
export type ServerProxy<T> = ServerChildRoutes<T> &
  ServerQueryFn<T> &
  ServerMutationFns<T>;

// ─── Utils Proxy Type ────────────────────────────────────────────────────────

type UtilsChildRoutes<T> = {
  [K in Exclude<keyof T, `$${string}` | symbol | number>]: T[K] extends Record<
    string,
    any
  >
    ? UtilsProxy<T[K]>
    : never;
};

interface UtilsHelpers {
  invalidate: (opts?: any) => Promise<void>;
  refetch: (opts?: any) => Promise<void>;
  cancel: (opts?: any) => Promise<void>;
  prefetch: (input?: any, opts?: any) => Promise<void>;
  fetch: (input?: any, opts?: any) => Promise<any>;
  ensureData: (input?: any, opts?: any) => Promise<any>;
  setData: (input: any, updater: any, opts?: any) => void;
  getData: (input?: any) => any;
  setInfiniteData: (input: any, updater: any, opts?: any) => void;
  getInfiniteData: (input?: any) => any;
  prefetchInfinite: (input?: any, opts?: any) => Promise<void>;
  fetchInfinite: (input?: any, opts?: any) => Promise<any>;
}

export type UtilsProxy<T> = UtilsChildRoutes<T> & UtilsHelpers;

// ─── Top-level Return Types ─────────────────────────────────────────────────

/** Return type of createHonoQuery (client-side) */
export type CreateHonoQueryReturn<TClient> = HonoQueryProxy<TClient> & {
  useUtils: () => UtilsProxy<TClient>;
};

/** Return type of createHonoQueryServer (server-side) */
export type CreateServerReturn<TClient> = ServerProxy<TClient>;

// ─── Config ──────────────────────────────────────────────────────────────────

export interface HonoQueryConfig {
  baseUrl: string;
  headers?:
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>);
  fetch?: typeof globalThis.fetch;
  init?: RequestInit;
}
