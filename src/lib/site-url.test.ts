import { describe, it, expect, afterEach, vi } from "vitest";

describe("SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses www as the default canonical host", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { SITE_URL } = await import("./site-url");
    expect(SITE_URL).toBe("https://www.kingof.lol");
  });

  it("uses NEXT_PUBLIC_SITE_URL and strips trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.kingof.lol/");
    const { SITE_URL } = await import("./site-url");
    expect(SITE_URL).toBe("https://www.kingof.lol");
  });
});
