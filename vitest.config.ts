import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["src/domains/**/*.ts", "src/lib/**/*.ts", "src/db/index.ts"],
      exclude: ["**/*.test.ts", "**/*.tsx", "src/db/schema.ts", "src/db/seed.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
