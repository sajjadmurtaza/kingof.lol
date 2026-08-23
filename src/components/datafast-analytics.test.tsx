import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { DataFastAnalytics } from "./datafast-analytics";

vi.mock("next/script", () => ({
  default: (props: Record<string, string | boolean | undefined>) => {
    const { id, src, defer, ...rest } = props;
    return <script id={id} src={src} defer={defer ? true : undefined} {...rest} />;
  },
}));

vi.mock("@/lib/site-url", () => ({
  getSiteUrl: () => "https://kingof.lol",
}));

describe("DataFastAnalytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing when website id is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_DATAFAST_WEBSITE_ID", "");
    const { container } = render(<DataFastAnalytics />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the cookieless script when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_DATAFAST_WEBSITE_ID", "dfid_rAyIRc4Yo2SJRq8FjeOEu");
    vi.stubEnv("NEXT_PUBLIC_DATAFAST_DOMAIN", "www.kingof.lol");
    const { container } = render(<DataFastAnalytics />);
    const script = container.querySelector("#datafast-analytics");
    expect(script).not.toBeNull();
    expect(script).toHaveAttribute("src", "https://datafa.st/js/script.cookieless.js");
    expect(script).toHaveAttribute("data-website-id", "dfid_rAyIRc4Yo2SJRq8FjeOEu");
    expect(script).toHaveAttribute("data-domain", "www.kingof.lol");
    expect(script).toHaveAttribute("defer");
  });

  it("falls back to the site hostname when domain is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_DATAFAST_WEBSITE_ID", "dfid_test");
    vi.stubEnv("NEXT_PUBLIC_DATAFAST_DOMAIN", "");
    const { container } = render(<DataFastAnalytics />);
    expect(container.querySelector("#datafast-analytics")).toHaveAttribute(
      "data-domain",
      "kingof.lol",
    );
  });
});
