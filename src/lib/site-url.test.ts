import { describe, it, expect, afterEach, vi } from "vitest";

describe("SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses apex kingof.lol as the default canonical host", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { SITE_URL } = await import("./site-url");
    expect(SITE_URL).toBe("https://kingof.lol");
  });

  it("uses NEXT_PUBLIC_SITE_URL and strips trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kingof.lol/");
    const { getSiteUrl } = await import("./site-url");
    expect(getSiteUrl()).toBe("https://kingof.lol");
  });

  it("ignores localhost when running on Vercel", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const { getSiteUrl } = await import("./site-url");
    expect(getSiteUrl()).toBe("https://kingof.lol");
  });
});
