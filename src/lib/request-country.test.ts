import { describe, it, expect } from "vitest";
import { getRequestCountryCode } from "./request-country";

describe("getRequestCountryCode", () => {
  it("reads Vercel header", () => {
    const request = new Request("https://kingof.lol", {
      headers: { "x-vercel-ip-country": "de" },
    });
    expect(getRequestCountryCode(request)).toBe("DE");
  });

  it("reads Netlify header", () => {
    const request = new Request("https://kingof.lol", {
      headers: { "x-country": "jp" },
    });
    expect(getRequestCountryCode(request)).toBe("JP");
  });

  it("reads Cloudflare header", () => {
    const request = new Request("https://kingof.lol", {
      headers: { "cf-ipcountry": "us" },
    });
    expect(getRequestCountryCode(request)).toBe("US");
  });

  it("returns null when no geo header is present", () => {
    const request = new Request("https://kingof.lol");
    expect(getRequestCountryCode(request)).toBeNull();
  });
});
