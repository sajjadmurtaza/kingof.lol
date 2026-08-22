import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "4rem", fontWeight: 900, color: "#fbbf24", margin: 0 }}>
            404
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#888", marginTop: "0.5rem" }}>
            This page doesn&apos;t exist on KINGOF.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: "2rem",
              padding: "0.75rem 2rem",
              background: "#fbbf24",
              color: "#0a0a0a",
              borderRadius: "0.75rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Back to KINGOF
          </Link>
        </div>
      </body>
    </html>
  );
}
