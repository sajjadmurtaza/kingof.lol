import { describe, it, expect } from "vitest";
import { tracesSampler } from "./sentry-shared";

describe("tracesSampler", () => {
  it("samples payment-critical routes at 100%", () => {
    expect(tracesSampler({ name: "GET /api/webhooks/stripe" })).toBe(1.0);
    expect(tracesSampler({ name: "POST /api/submit" })).toBe(1.0);
  });

  it("samples other routes at 10%", () => {
    expect(tracesSampler({ name: "GET /en" })).toBe(0.1);
    expect(tracesSampler({})).toBe(0.1);
  });
});
