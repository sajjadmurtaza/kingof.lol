import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it("throws when required vars are missing", async () => {
    delete process.env.DATABASE_URL;
    const { env } = await import("./env");
    expect(() => env.DATABASE_URL).toThrow("Missing env var: DATABASE_URL");
  });

  it("returns configured values", async () => {
    process.env.DATABASE_URL = "postgres://test";
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec";
    process.env.RESEND_API_KEY = "re_test";
    process.env.CRON_SECRET = "cron";
    delete process.env.NEXT_PUBLIC_SITE_URL;

    vi.resetModules();
    const { env } = await import("./env");

    expect(env.DATABASE_URL).toBe("postgres://test");
    expect(env.STRIPE_SECRET_KEY).toBe("sk_test");
    expect(env.STRIPE_WEBHOOK_SECRET).toBe("whsec");
    expect(env.RESEND_API_KEY).toBe("re_test");
    expect(env.CRON_SECRET).toBe("cron");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });
});
