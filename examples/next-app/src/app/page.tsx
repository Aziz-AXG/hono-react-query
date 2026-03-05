"use client";

import { useState } from "react";
import { api } from "@/lib/api";

// ─── Greeting Demo (useQuery) ────────────────────────────────────────────────

function GreetingDemo() {
  const [name, setName] = useState("World");
  const greeting = api.greeting.useQuery({ query: { name } });

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>
        <span style={badgeStyle}>useQuery</span>
        Greeting
      </h2>
      <p style={descStyle}>
        <code>
          api.greeting.useQuery({"{"} query: {"{"} name {"}"} {"}"})
        </code>
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name..."
          style={inputStyle}
        />
      </div>

      {greeting.isLoading && <p style={mutedStyle}>Loading...</p>}
      {greeting.error && (
        <p style={errorStyle}>Error: {greeting.error.message}</p>
      )}
      {greeting.data && (
        <div style={resultStyle}>
          <pre style={preStyle}>{JSON.stringify(greeting.data, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

// ─── Posts List Demo (useQuery) ──────────────────────────────────────────────

function PostsListDemo() {
  const posts = api.posts.useQuery({ query: { page: "1", limit: "3" } });

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>
        <span style={badgeStyle}>useQuery</span>
        Posts List
      </h2>
      <p style={descStyle}>
        <code>
          api.posts.useQuery({"{"} query: {"{"} page: "1", limit: "3" {"}"}{" "}
          {"}"})
        </code>
      </p>

      {posts.isLoading && <p style={mutedStyle}>Loading posts...</p>}
      {posts.error && <p style={errorStyle}>Error: {posts.error.message}</p>}
      {posts.data && (
        <div style={resultStyle}>
          <p
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "0.85rem",
              color: "#888",
            }}
          >
            Page {posts.data.page} of {posts.data.totalPages} (
            {posts.data.total} total)
          </p>
          {posts.data.posts.map((post: any) => (
            <div key={post.id} style={cardStyle}>
              <strong>{post.title}</strong>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.85rem",
                  color: "#999",
                }}
              >
                {post.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Create Post Demo (useMutation) ─────────────────────────────────────────

function CreatePostDemo() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const createPost = api.posts.useMutation();

  const handleSubmit = () => {
    if (!title || !body) return;
    createPost.mutate(
      {
        json: {
          title,
          body,
        },
      },
      {
        onSuccess: (data) => {
          setTitle("");
          setBody("");
        },
      },
    );
  };

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>
        <span
          style={{
            ...badgeStyle,
            background: "linear-gradient(135deg, #e44d26, #f7b731)",
          }}
        >
          useMutation
        </span>
        Create Post
      </h2>
      <p style={descStyle}>
        <code>api.posts.useMutation()</code>
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title..."
          style={inputStyle}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Post body..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <button
          onClick={handleSubmit}
          disabled={createPost.isPending || !title || !body}
          style={buttonStyle}
        >
          {createPost.isPending ? "Creating..." : "Create Post"}
        </button>
      </div>

      {createPost.error && (
        <p style={errorStyle}>Error: {createPost.error.message}</p>
      )}
      {createPost.data && (
        <div style={resultStyle}>
          <p style={{ margin: 0, color: "#4ade80" }}>
            ✓ Post created successfully!
          </p>
          <pre style={preStyle}>{JSON.stringify(createPost.data, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

// ─── Update Post Demo (usePut) ───────────────────────────────────────────────

function UpdatePostDemo() {
  const [id, setId] = useState("1");
  const [title, setTitle] = useState("Updated Title");
  const [body, setBody] = useState("Updated body content");
  const updatePost = api.posts.usePut();

  const handleSubmit = () => {
    if (!id || !title || !body) return;
    updatePost.mutate({ json: { id, title, body } });
  };

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>
        <span
          style={{
            ...badgeStyle,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          }}
        >
          usePut
        </span>
        Update Post (PUT)
      </h2>
      <p style={descStyle}>
        <code>api.posts.usePut()</code>
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Post ID..."
          style={inputStyle}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New title..."
          style={inputStyle}
        />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="New body..."
          style={inputStyle}
        />
        <button
          onClick={handleSubmit}
          disabled={updatePost.isPending}
          style={{
            ...buttonStyle,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          }}
        >
          {updatePost.isPending ? "Updating..." : "PUT Update"}
        </button>
      </div>
      {updatePost.data && (
        <div style={resultStyle}>
          <p style={{ margin: 0, color: "#60a5fa" }}>✓ Updated via PUT</p>
          <pre style={preStyle}>{JSON.stringify(updatePost.data, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

// ─── Patch Post Demo (usePatch) ──────────────────────────────────────────────

function PatchPostDemo() {
  const [id, setId] = useState("1");
  const [title, setTitle] = useState("Patched Title");
  const patchPost = api.posts.usePatch();

  const handleSubmit = () => {
    if (!id) return;
    patchPost.mutate({ json: { id, title: title || undefined } });
  };

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>
        <span
          style={{
            ...badgeStyle,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
          }}
        >
          usePatch
        </span>
        Patch Post (PATCH)
      </h2>
      <p style={descStyle}>
        <code>api.posts.usePatch()</code>
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Post ID..."
          style={inputStyle}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New title (optional)..."
          style={inputStyle}
        />
        <button
          onClick={handleSubmit}
          disabled={patchPost.isPending}
          style={{
            ...buttonStyle,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
          }}
        >
          {patchPost.isPending ? "Patching..." : "PATCH Update"}
        </button>
      </div>
      {patchPost.data && (
        <div style={resultStyle}>
          <p style={{ margin: 0, color: "#fbbf24" }}>✓ Patched via PATCH</p>
          <pre style={preStyle}>{JSON.stringify(patchPost.data, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

// ─── Delete Post Demo (useDelete) ────────────────────────────────────────────

function DeletePostDemo() {
  const [id, setId] = useState("1");
  const deletePost = api.posts.useDelete();

  const handleSubmit = () => {
    if (!id) return;
    deletePost.mutate({ json: { id } });
  };

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>
        <span
          style={{
            ...badgeStyle,
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
          }}
        >
          useDelete
        </span>
        Delete Post (DELETE)
      </h2>
      <p style={descStyle}>
        <code>api.posts.useDelete()</code>
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Post ID to delete..."
          style={inputStyle}
        />
        <button
          onClick={handleSubmit}
          disabled={deletePost.isPending}
          style={{
            ...buttonStyle,
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
          }}
        >
          {deletePost.isPending ? "Deleting..." : "DELETE"}
        </button>
      </div>
      {deletePost.data && (
        <div style={resultStyle}>
          <p style={{ margin: 0, color: "#f87171" }}>✓ Deleted via DELETE</p>
          <pre style={preStyle}>{JSON.stringify(deletePost.data, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

// ─── Health Check Demo (useQuery) ────────────────────────────────────────────

function HealthDemo() {
  const health = api.health.useQuery(undefined, { refetchInterval: 5000 });

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>
        <span
          style={{
            ...badgeStyle,
            background: "linear-gradient(135deg, #10b981, #059669)",
          }}
        >
          useQuery
        </span>
        Health Check
      </h2>
      <p style={descStyle}>
        <code>
          api.health.useQuery(undefined, {"{"} refetchInterval: 5000 {"}"})
        </code>
      </p>

      {health.isLoading && <p style={mutedStyle}>Checking...</p>}
      {health.data && (
        <div style={resultStyle}>
          <pre style={preStyle}>{JSON.stringify(health.data, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 0.5rem",
          }}
        >
          hono-react-query
        </h1>
        <p style={{ color: "#888", fontSize: "1.1rem", margin: "0 0 1rem" }}>
          tRPC-like DX for Hono RPC + TanStack React Query
        </p>
        <a
          href="/server-demo"
          style={{
            color: "#10b981",
            textDecoration: "none",
            fontSize: "0.9rem",
            padding: "0.4rem 1rem",
            border: "1px solid #10b981",
            borderRadius: "999px",
          }}
        >
          View Server-Side Demo →
        </a>
      </header>

      <GreetingDemo />
      <PostsListDemo />
      <CreatePostDemo />
      <UpdatePostDemo />
      <PatchPostDemo />
      <DeletePostDemo />
      <HealthDemo />

      <footer
        style={{
          textAlign: "center",
          marginTop: "3rem",
          color: "#555",
          fontSize: "0.85rem",
        }}
      >
        <p>
          Built with <strong>Hono</strong> +{" "}
          <strong>@tanstack/react-query</strong> +{" "}
          <strong>hono-react-query</strong>
        </p>
      </footer>
    </main>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  background: "#111",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  border: "1px solid #222",
};

const headingStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
  margin: "0 0 0.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
};

const badgeStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  padding: "0.2rem 0.6rem",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  color: "#fff",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const descStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#888",
  margin: "0 0 1rem",
};

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "8px",
  padding: "0.6rem 0.8rem",
  color: "#ededed",
  fontSize: "0.9rem",
  fontFamily: "'Inter', sans-serif",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  border: "none",
  borderRadius: "8px",
  padding: "0.6rem 1.2rem",
  color: "#fff",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Inter', sans-serif",
};

const resultStyle: React.CSSProperties = {
  background: "#0d0d0d",
  borderRadius: "8px",
  padding: "1rem",
  border: "1px solid #1a1a1a",
};

const preStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.8rem",
  color: "#a5b4fc",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const mutedStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "0.9rem",
};

const errorStyle: React.CSSProperties = {
  color: "#ef4444",
  fontSize: "0.9rem",
};

const cardStyle: React.CSSProperties = {
  background: "#151515",
  borderRadius: "8px",
  padding: "0.75rem",
  marginBottom: "0.5rem",
  border: "1px solid #222",
};
