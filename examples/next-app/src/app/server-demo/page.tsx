import { serverApi } from "@/lib/server-api";

/**
 * Server Component — fetches data server-side using createHonoQueryServer.
 * No React hooks, just plain async/await.
 */
export default async function ServerDemoPage() {
  const greeting = await serverApi.greeting.query({
    query: { name: "Server" },
  });
  const posts = await serverApi.posts.query({
    query: { page: "1", limit: "3" },
  });

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "'Inter', sans-serif",
        color: "#ededed",
      }}
    >
      <a
        href="/"
        style={{ color: "#667eea", textDecoration: "none", fontSize: "0.9rem" }}
      >
        ← Back to Client Demo
      </a>

      <header style={{ textAlign: "center", margin: "2rem 0" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, #10b981, #059669)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 0.5rem",
          }}
        >
          Server-Side API Demo
        </h1>
        <p style={{ color: "#888", fontSize: "1rem", margin: 0 }}>
          Data fetched with <code>createHonoQueryServer</code> — no React hooks
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>
          <span
            style={{
              ...badgeStyle,
              background: "linear-gradient(135deg, #10b981, #059669)",
            }}
          >
            .query()
          </span>
          Server Greeting
        </h2>
        <p style={descStyle}>
          <code>
            await serverApi.greeting.query({"{"} query: {"{"} name:
            &quot;Server&quot; {"}"} {"}"})
          </code>
        </p>
        <div style={resultStyle}>
          <pre style={preStyle}>{JSON.stringify(greeting, null, 2)}</pre>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>
          <span
            style={{
              ...badgeStyle,
              background: "linear-gradient(135deg, #10b981, #059669)",
            }}
          >
            .query()
          </span>
          Server Posts
        </h2>
        <p style={descStyle}>
          <code>
            await serverApi.posts.query({"{"} query: {"{"} page: &quot;1&quot;,
            limit: &quot;3&quot; {"}"} {"}"})
          </code>
        </p>
        <div style={resultStyle}>
          <pre style={preStyle}>{JSON.stringify(posts, null, 2)}</pre>
        </div>
      </section>

      <section style={{ ...sectionStyle, borderColor: "#333" }}>
        <h2 style={headingStyle}>Available Server Methods</h2>
        <p style={{ ...descStyle, marginBottom: 0 }}>
          All methods are typed async functions — no React hooks needed:
        </p>
        <ul
          style={{ color: "#a5b4fc", fontSize: "0.85rem", lineHeight: "1.8" }}
        >
          <li>
            <code>serverApi.greeting.query(input)</code> — GET
          </li>
          <li>
            <code>serverApi.posts.mutate(input)</code> — POST (default mutation)
          </li>
          <li>
            <code>serverApi.posts.$put(input)</code> — PUT
          </li>
          <li>
            <code>serverApi.posts.$patch(input)</code> — PATCH
          </li>
          <li>
            <code>serverApi.posts.$delete(input)</code> — DELETE
          </li>
        </ul>
      </section>
    </main>
  );
}

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
  color: "#fff",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const descStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#888",
  margin: "0 0 1rem",
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
