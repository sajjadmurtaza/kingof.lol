import { defineConfig } from "drizzle-kit";

// drizzle-kit's bundled dotenv only reads `.env`, never `.env.local` — load it
// explicitly so the documented `.env.local` workflow (see .env.local.example)
// actually works for `db:generate` / `db:push` / `db:migrate` / `db:studio`.
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // no .env.local (e.g. CI) — fall back to real environment variables
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
