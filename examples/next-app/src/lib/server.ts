import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

/**
 * Hono server app with typed routes.
 * This demonstrates the server side — all routes use validators
 * so the types are inferred by the RPC client.
 */
const app = new Hono().basePath("/api");

// ─── Define routes with chaining (required for type inference) ───────────────

const routes = app
  // GET /api/greeting?name=...
  .get(
    "/greeting",
    zValidator(
      "query",
      z.object({
        name: z.string(),
      }),
    ),
    (c) => {
      const { name } = c.req.valid("query");
      return c.json({
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
      });
    },
  )

  // GET /api/posts?page=...&limit=...
  .get(
    "/posts",
    zValidator(
      "query",
      z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
      }),
    ),
    (c) => {
      const { page, limit } = c.req.valid("query");
      const p = parseInt(page);
      const l = parseInt(limit);

      const allPosts = [
        {
          id: "1",
          title: "Getting Started with Hono",
          body: "Hono is a fast web framework...",
        },
        {
          id: "2",
          title: "Building RPC APIs",
          body: "With Hono RPC you get type safety...",
        },
        {
          id: "3",
          title: "React Query Integration",
          body: "Combine React Query with Hono...",
        },
        {
          id: "4",
          title: "Edge Computing",
          body: "Deploy to Cloudflare Workers...",
        },
        {
          id: "5",
          title: "Full-Stack TypeScript",
          body: "End-to-end type safety...",
        },
      ];

      const start = (p - 1) * l;
      const posts = allPosts.slice(start, start + l);

      return c.json({
        posts,
        total: allPosts.length,
        page: p,
        totalPages: Math.ceil(allPosts.length / l),
      });
    },
  )

  // POST /api/posts
  .post(
    "/posts",
    zValidator(
      "json",
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    ),
    (c) => {
      const { title, body } = c.req.valid("json");
      const newPost = {
        id: Math.random().toString(36).slice(2, 9),
        title,
        body,
        createdAt: new Date().toISOString(),
      };
      return c.json(newPost, 201);
    },
  )

  // PUT /api/posts — update a post (full replace)
  .put(
    "/posts",
    zValidator(
      "json",
      z.object({
        id: z.string(),
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    ),
    (c) => {
      const data = c.req.valid("json");
      return c.json({
        ...data,
        updatedAt: new Date().toISOString(),
        method: "PUT",
      });
    },
  )

  // PATCH /api/posts — partially update a post
  .patch(
    "/posts",
    zValidator(
      "json",
      z.object({
        id: z.string(),
        title: z.string().optional(),
        body: z.string().optional(),
      }),
    ),
    (c) => {
      const data = c.req.valid("json");
      return c.json({
        ...data,
        updatedAt: new Date().toISOString(),
        method: "PATCH",
      });
    },
  )

  // DELETE /api/posts — delete a post
  .delete(
    "/posts",
    zValidator(
      "json",
      z.object({
        id: z.string(),
      }),
    ),
    (c) => {
      const { id } = c.req.valid("json");
      return c.json({
        deleted: true,
        id,
        deletedAt: new Date().toISOString(),
      });
    },
  )

  // GET /api/health
  .get("/health", (c) => {
    return c.json({ status: "ok", uptime: process.uptime() });
  });

export type AppType = typeof routes;
export default app;
