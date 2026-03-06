# hono-react-query

A lightweight, tRPC-like React Query integration specifically tailored for [Hono RPC](https://hono.dev/guides/rpc).

`hono-react-query` brings the exceptional developer experience of end-to-end type safety to your React applications. By combining the speed of Hono for the backend and the power of TanStack Query (React Query) for data fetching, building full-stack applications has never been smoother.

## Features

- 🔒 **End-to-End Type Safety**: Share your Hono API types explicitly with your React frontend. Catch errors at compile-time instead of runtime.
- 🚀 **tRPC-like DX**: Call your API routes as if they were local asynchronous functions using standard React Query hooks like `useQuery`, `useMutation`, and `useInfiniteQuery`.
- ⚡ **First-class Hono Support**: Built efficiently to integrate transparently with `hono/rpc` and `hc`.
- 🔋 **Next.js App Router Ready**: Includes full support for React Server Components directly out of the box with `createHonoQueryServer`.
- 🚀 **Zero-latency SSR & SSG**: Configure the server API to bypass network requests natively for incredible Next.js static generation speeds using Hono's `app.request`.
- 🪶 **Lightweight**: A minimal wrapper around TanStack Query, ensuring your bundle size remains small and performant.

## Method Mapping

`hono-react-query` intelligently maps standard Hono RPC HTTP methods into intuitive React Query hooks (client) and standard async functions (server).

| Hono RPC   | hono-react-query Client | hono-react-query Server |
| :--------- | :---------------------- | :---------------------- |
| `.$get`    | `.useQuery`             | `.query`                |
| `.$post`   | `.useMutation`          | `.mutate`               |
| `.$put`    | `.usePut`               | `.$put`                 |
| `.$patch`  | `.usePatch`             | `.$patch`               |
| `.$delete` | `.useDelete`            | `.$delete`              |

## Installation

You need to install `@AXG/hono-react-query`, along with its peer dependencies: `hono` and `@tanstack/react-query`.

```bash
# npm
npm install @AXG/hono-react-query @tanstack/react-query hono

# pnpm
pnpm add @AXG/hono-react-query @tanstack/react-query hono

# yarn
yarn add @AXG/hono-react-query @tanstack/react-query hono
```

## Quick Start (Next.js App Router Example)

Here is a full guide to integrating `hono-react-query` inside a Next.js application using the App Router.

### 1. Set up your Hono Server

First, define your Hono app, the routes context, and export its type definitions.

```typescript
// src/lib/server.ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const app = new Hono().basePath("/api");

const routes = app
  .get(
    "/greeting",
    zValidator("query", z.object({ name: z.string() })),
    (c) => {
      const { name } = c.req.valid("query");
      return c.json({
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
      });
    },
  )
  .post(
    "/posts",
    zValidator("json", z.object({ title: z.string(), body: z.string() })),
    (c) => {
      const { title, body } = c.req.valid("json");
      return c.json({ success: true, title, body }, 201);
    },
  );

export type AppType = typeof routes;
export default app;
```

### 2. Create the Client API (For Client Components)

Create a typed React Query client combining TanStack Query and standard `hc`. Our smart proxy abstracts away the HTTP methods when passing them into React Query!

```typescript
// src/lib/api.ts
import { hc } from "hono/client";
import { createHonoQuery } from "@AXG/hono-react-query";
import type { AppType } from "./server";

const client = hc<AppType>("http://localhost:3000");

// Expose the React Query hooks
export const api = createHonoQuery(client.api);
```

### 3. Setup Providers

Wrap your application in the standard TanStack Query `QueryClientProvider`.

```tsx
// src/app/providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 1000 } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### 4. Create the Server API (For Server Components)

`hono-react-query/server` safely extends Hono for fully typed server-side fetches. Ideal for Server Components, Server Actions, and API routes.

For the **ultimate** Next.js Server Component performance, we can configure our server client to pass `app.request` into `hc`'s `fetch` option. **This passes requests directly into Hono's memory**—completely bypassing network latency and allowing flawless Next.js Static Site Generation (SSG) at build time without needing a live development server running!

```typescript
// src/lib/server-api.ts
import { hc } from "hono/client";
import { createHonoQueryServer } from "@AXG/hono-react-query/server";
import type { AppType } from "./server";
// Import the actual Hono app definition
import app from "./server";

const client = hc<AppType>("http://localhost:3000", {
  // Pass the raw request locally to achieve 0ms network latency for SSR/SSG!
  fetch: app.request,
});

// Expose standard async functions for server environments
export const serverApi = createHonoQueryServer(client.api);
```

### 5. Fetch your Data! (Client and Server)

Now query and mutate your backend with perfect intellisense and streamlined syntax!

**In a Server Component (using `query` and `mutate`):**

```tsx
// src/app/server-demo/page.tsx
import { serverApi } from "@/lib/server-api";

export default async function ServerDemoPage() {
  // Executes on the server using the `.query()` method wrapper
  const greeting = await serverApi.greeting.query({
    query: { name: "Server" },
  });

  // Notice we use `.mutate()` instead of raw `.post()`
  const newPost = await serverApi.posts.mutate({
    json: { title: "First Server Post", body: "Hello World" },
  });

  return <h1>{greeting.message}</h1>;
}
```

**In a Client Component (using `.useQuery` and `.useMutation` directly):**

```tsx
// src/components/ClientDemo.tsx
"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export function ClientDemoComponent() {
  const [name, setName] = useState("World");

  // Directly use `.useQuery` on the route abstraction!
  const greeting = api.greeting.useQuery({
    query: { name },
  });

  // Directly use `.useMutation` for POST requests
  const createPost = api.posts.useMutation({
    onSuccess: (data) => console.log("Successfully posted!", data),
  });

  // Additional methods are cleanly mapped!
  // const updatePost = api.posts.usePut();
  // const patchPost = api.posts.usePatch();
  // const deletePost = api.posts.useDelete();

  if (greeting.isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Message: {greeting.data?.message}</h1>
      <button
        onClick={() =>
          createPost.mutate({ json: { title: "First Post", body: "..." } })
        }
        disabled={createPost.isPending}
      >
        {createPost.isPending ? "Creating..." : "Create Post"}
      </button>
    </div>
  );
}
```

## Documentation & Examples

For a larger setup context or Next.js examples, feel free to dive into the [GitHub repository](https://github.com/Aziz-AXG/hono-react-query/tree/main/examples).

## License

MIT License. See [LICENSE](https://github.com/Aziz-AXG/hono-react-query/blob/main/LICENSE) for more information.
