import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DEFAULT_THEME,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  getStoredTheme,
  isTheme,
} from "./theme";

describe("theme helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it("validates theme values", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("light")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("returns default when storage is empty", () => {
    expect(getStoredTheme()).toBe(DEFAULT_THEME);
  });

  it("reads stored theme", () => {
    vi.mocked(localStorage.getItem).mockReturnValue("light");
    expect(getStoredTheme()).toBe("light");
  });

  it("falls back when localStorage throws", () => {
    vi.mocked(localStorage.getItem).mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getStoredTheme()).toBe(DEFAULT_THEME);
  });

  it("exports init script with storage key", () => {
    expect(THEME_INIT_SCRIPT).toContain(THEME_STORAGE_KEY);
    expect(THEME_INIT_SCRIPT).toContain("data-theme");
  });

  it("returns default theme on the server", async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    vi.resetModules();
    const { getStoredTheme: getTheme } = await import("./theme");
    expect(getTheme()).toBe(DEFAULT_THEME);
    globalThis.window = originalWindow;
  });
});
