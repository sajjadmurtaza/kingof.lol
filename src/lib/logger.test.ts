import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/nextjs";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe("logger", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  it("logs info and warn in development", async () => {
    process.env.NODE_ENV = "development";
    const { logger } = await import("./logger");
    logger.info("hello", { route: "test" });
    logger.info("plain");
    logger.warn("careful", { route: "test" });
    logger.warn("plain");
    expect(console.log).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it("logs errors to console in development", async () => {
    process.env.NODE_ENV = "development";
    const { logger } = await import("./logger");
    const err = new Error("boom");
    logger.error("failed", err, { route: "test" });
    expect(console.error).toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("captures Error instances in production", async () => {
    process.env.NODE_ENV = "production";
    const { logger } = await import("./logger");
    const err = new Error("boom");
    logger.error("failed", err, { route: "test" });
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      extra: { message: "failed", route: "test" },
    });
  });

  it("captures non-Error values as messages in production", async () => {
    process.env.NODE_ENV = "production";
    const { logger } = await import("./logger");
    logger.error("failed", "string-error");
    expect(Sentry.captureMessage).toHaveBeenCalledWith("failed", {
      level: "error",
      extra: { error: "string-error" },
    });
  });

  it("does not write info or warn in production", async () => {
    process.env.NODE_ENV = "production";
    const { logger } = await import("./logger");
    logger.info("silent");
    logger.warn("silent");
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("logs errors without optional context in development", async () => {
    process.env.NODE_ENV = "development";
    const { logger } = await import("./logger");
    logger.error("failed", new Error("boom"));
    expect(console.error).toHaveBeenCalled();
  });
});
