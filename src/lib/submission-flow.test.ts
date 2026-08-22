import { describe, it, expect } from "vitest";
import {
  looksLikeUrl,
  extractDomain,
  emptyPreview,
  slugFromProductName,
  resolveSubmitOutcome,
  resolvePreviewPhase,
  shouldShowSubmitPageHeader,
} from "./submission-flow";

describe("looksLikeUrl", () => {
  it("accepts https URLs", () => {
    expect(looksLikeUrl("https://kingof.lol")).toBe(true);
  });

  it("accepts bare domains", () => {
    expect(looksLikeUrl("kingof.lol")).toBe(true);
  });

  it("rejects short input", () => {
    expect(looksLikeUrl("ab")).toBe(false);
  });

  it("rejects non-url text", () => {
    expect(looksLikeUrl("hello")).toBe(false);
  });
});

describe("extractDomain", () => {
  it("strips www", () => {
    expect(extractDomain("https://www.kingof.lol/path")).toBe("kingof.lol");
  });

  it("returns input on invalid URL", () => {
    expect(extractDomain("not a url!!!")).toBe("not a url!!!");
  });
});

describe("emptyPreview", () => {
  it("uses domain as fallback name", () => {
    const preview = emptyPreview("https://kingof.lol");
    expect(preview.name).toBe("kingof.lol");
    expect(preview.existing).toBeNull();
  });
});

describe("slugFromProductName", () => {
  it("slugifies product names", () => {
    expect(slugFromProductName("KINGOF")).toBe("kingof");
    expect(slugFromProductName("My Cool App!")).toBe("my-cool-app");
  });
});

describe("resolveSubmitOutcome", () => {
  const fallback = "Payment could not be started. Please try again.";

  it("returns error on failed API response (regression: no fake success)", () => {
    expect(
      resolveSubmitOutcome(
        { ok: false, data: { error: "This product is already listed" } },
        { bidCents: 0, productName: "KINGOF", fallbackError: fallback },
      ),
    ).toEqual({ type: "error", message: "This product is already listed" });
  });

  it("returns error on 500 without message", () => {
    expect(
      resolveSubmitOutcome(
        { ok: false, data: {} },
        { bidCents: 0, productName: "KINGOF", fallbackError: fallback },
      ),
    ).toEqual({ type: "error", message: fallback });
  });

  it("redirects free listings to product page (regression: no inline success card)", () => {
    expect(
      resolveSubmitOutcome(
        { ok: true, data: { slug: "kingof", overallRank: 26, categoryRank: 7 } },
        { bidCents: 0, productName: "KINGOF", fallbackError: fallback },
      ),
    ).toEqual({ type: "redirect_product", slug: "kingof" });
  });

  it("derives slug when API omits it", () => {
    expect(
      resolveSubmitOutcome(
        { ok: true, data: {} },
        { bidCents: 0, productName: "KINGOF", fallbackError: fallback },
      ),
    ).toEqual({ type: "redirect_product", slug: "kingof" });
  });

  it("redirects paid listings to Stripe checkout", () => {
    expect(
      resolveSubmitOutcome(
        { ok: true, data: { slug: "kingof", checkoutUrl: "https://checkout.stripe.com/pay" } },
        { bidCents: 2500, productName: "KINGOF", fallbackError: fallback },
      ),
    ).toEqual({ type: "redirect_checkout", url: "https://checkout.stripe.com/pay" });
  });

  it("returns fallback error when slug cannot be derived", () => {
    expect(
      resolveSubmitOutcome(
        { ok: true, data: {} },
        { bidCents: 0, productName: "!!!", fallbackError: fallback },
      ),
    ).toEqual({ type: "error", message: fallback });
  });
});

describe("resolvePreviewPhase", () => {
  const base = emptyPreview("https://acme.com");

  it("routes existing URLs to existing flow", () => {
    expect(
      resolvePreviewPhase({
        ...base,
        name: "Acme",
        existing: {
          name: "Acme",
          slug: "acme",
          rank: 7,
          totalBid: 500,
          categorySlug: "saas",
          categoryEmoji: "☁️",
        },
      }),
    ).toBe("existing");
  });

  it("routes sparse metadata to fallback", () => {
    expect(resolvePreviewPhase({ ...base, name: "acme.com", domain: "acme.com" })).toBe("fallback");
  });

  it("routes rich metadata to preview", () => {
    expect(
      resolvePreviewPhase({ ...base, name: "Acme", domain: "acme.com", description: "Build" }),
    ).toBe("preview");
  });
});

describe("shouldShowSubmitPageHeader", () => {
  it("hides marketing header during bid and email steps", () => {
    expect(shouldShowSubmitPageHeader("bid")).toBe(false);
    expect(shouldShowSubmitPageHeader("email")).toBe(false);
    expect(shouldShowSubmitPageHeader("existing")).toBe(false);
  });

  it("shows marketing header during URL entry", () => {
    expect(shouldShowSubmitPageHeader("idle")).toBe(true);
    expect(shouldShowSubmitPageHeader("preview")).toBe(true);
  });
});
