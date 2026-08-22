import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("db index", () => {
  const original = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  });

  it("getDb throws when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const { getDb } = await import("./index");
    expect(() => getDb()).toThrow("DATABASE_URL is not set");
  });

  it("tryGetDb returns null when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const { tryGetDb } = await import("./index");
    expect(tryGetDb()).toBeNull();
  });

  it("getDb reuses a singleton connection", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/kingof_test";
    const { getDb } = await import("./index");
    expect(getDb()).toBe(getDb());
  });
});
