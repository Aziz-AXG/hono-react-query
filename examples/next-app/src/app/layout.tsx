import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "hono-react-query Demo",
  description:
    "Example app demonstrating tRPC-like DX with Hono RPC + React Query",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          background: "#0a0a0a",
          color: "#ededed",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
