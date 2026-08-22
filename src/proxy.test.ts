import { describe, it, expect } from "vitest";
import { LOCALE_MIDDLEWARE_MATCHER } from "./proxy-matcher";

describe("locale middleware matcher", () => {
  it("documents paths excluded from locale prefixing", () => {
    for (const segment of [
      "api",
      "manage",
      "payment",
      "apple-icon",
      "icon",
      "opengraph-image",
      "twitter-image",
      "manifest\\.webmanifest",
    ]) {
      expect(LOCALE_MIDDLEWARE_MATCHER).toContain(segment);
    }
  });

  it("keeps apple-icon out of locale routing at the site root", () => {
    expect(LOCALE_MIDDLEWARE_MATCHER).toMatch(/apple-icon/);
  });
});
