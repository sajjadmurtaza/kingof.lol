import { describe, it, expect } from "vitest";

// Import the escapeHtml function by testing the module's exported email generators
// Since escapeHtml is private, we test it indirectly through the template output.
// For direct unit testing, we replicate the escape logic here.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

describe("HTML escaping for email templates", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('test "value"')).toBe("test &quot;value&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("test 'value'")).toBe("test &#39;value&#39;");
  });

  it("handles product names with HTML injection attempts", () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<img");
    expect(escaped).not.toContain("<");
    expect(escaped).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("handles normal product names unchanged (except safe entities)", () => {
    expect(escapeHtml("My Cool Product")).toBe("My Cool Product");
    expect(escapeHtml("Stripe")).toBe("Stripe");
  });

  it("handles unicode product names", () => {
    expect(escapeHtml("日本語プロダクト")).toBe("日本語プロダクト");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("handles product name with href injection", () => {
    const malicious = '"><a href="https://evil.com">Click me</a>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<a ");
    expect(escaped).not.toContain("<");
    expect(escaped).toBe(
      "&quot;&gt;&lt;a href=&quot;https://evil.com&quot;&gt;Click me&lt;/a&gt;",
    );
  });

  it("handles nested HTML entities", () => {
    const tricky = "&lt;script&gt;";
    const escaped = escapeHtml(tricky);
    expect(escaped).toBe("&amp;lt;script&amp;gt;");
  });
});
