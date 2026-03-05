import { hc } from "hono/client";
import { createHonoQueryServer } from "hono-react-query/server";
import type { AppType } from "./server";

/**
 * Server-side API client.
 * Use this in Server Components, Server Actions, and API routes.
 *
 * @example
 * const greeting = await serverApi.greeting.query({ query: { name: "John" } })
 * const newPost = await serverApi.posts.mutate({ json: { title: "Hi", body: "..." } })
 * const updated = await serverApi.posts.$put({ json: { id: "1", title: "Updated", body: "..." } })
 */
const client = hc<AppType>("http://localhost:3000");

export const serverApi = createHonoQueryServer(client.api);
