import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { GoogleAnalytics } from "./google-analytics";

vi.mock("next/script", () => ({
  default: ({ id, src, children }: { id?: string; src?: string; children?: string }) => (
    // Test double only — production uses next/script with afterInteractive.
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script id={id} src={src}>
      {children}
    </script>
  ),
}));

describe("GoogleAnalytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing when measurement id is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    const { container } = render(<GoogleAnalytics />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders gtag scripts when measurement id is set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-QMS46ZG5EQ");
    const { container } = render(<GoogleAnalytics />);
    expect(container.querySelector('script[src*="G-QMS46ZG5EQ"]')).not.toBeNull();
    expect(container.querySelector("#google-analytics")?.textContent).toContain(
      "gtag('config', 'G-QMS46ZG5EQ')",
    );
  });
});
