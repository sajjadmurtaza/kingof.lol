import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../tests/helpers/mock-db";
import type { ProductPreview } from "./metadata";

const mock = createMockDb();

vi.mock("@/db", () => ({
  tryGetDb: vi.fn(() => mock.db),
}));

import { tryGetDb } from "@/db";
import { getCachedMetadata, setCachedMetadata } from "./metadata-cache";

const preview: ProductPreview = {
  name: "Acme",
  tagline: "Build",
  iconUrl: null,
  ogImageUrl: null,
  category: "saas",
  categoryConfidence: "high",
};

describe("metadata cache", () => {
  beforeEach(() => {
    mock.reset();
    vi.mocked(tryGetDb).mockReturnValue(mock.db);
  });

  it("returns null when db is unavailable", async () => {
    vi.mocked(tryGetDb).mockReturnValue(null);
    await expect(getCachedMetadata("acme.com")).resolves.toBeNull();
  });

  it("returns null when no cache row exists", async () => {
    mock.enqueue([]);
    await expect(getCachedMetadata("acme.com")).resolves.toBeNull();
  });

  it("returns null when cache row is expired", async () => {
    mock.enqueue([
      {
        normalizedDomain: "acme.com",
        payload: JSON.stringify(preview),
        fetchedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      },
    ]);
    await expect(getCachedMetadata("acme.com")).resolves.toBeNull();
  });

  it("returns parsed preview when cache is fresh", async () => {
    mock.enqueue([
      {
        normalizedDomain: "acme.com",
        payload: JSON.stringify(preview),
        fetchedAt: new Date(),
      },
    ]);
    await expect(getCachedMetadata("acme.com")).resolves.toEqual(preview);
  });

  it("returns null when cache read throws", async () => {
    mock.enqueue(Promise.reject(new Error("db down")));
    await expect(getCachedMetadata("acme.com")).resolves.toBeNull();
  });

  it("writes cache best-effort", async () => {
    await expect(setCachedMetadata("acme.com", preview)).resolves.toBeUndefined();
    expect(mock.db.insert).toHaveBeenCalled();
  });

  it("swallows write failures", async () => {
    mock.db.insert.mockImplementationOnce(() => {
      throw new Error("write failed");
    });
    await expect(setCachedMetadata("acme.com", preview)).resolves.toBeUndefined();
  });

  it("no-ops when db is unavailable on write", async () => {
    vi.mocked(tryGetDb).mockReturnValue(null);
    await expect(setCachedMetadata("acme.com", preview)).resolves.toBeUndefined();
    expect(mock.db.insert).not.toHaveBeenCalled();
  });
});
