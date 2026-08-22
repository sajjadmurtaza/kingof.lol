import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enApp from "@/i18n/locales/en/app.json";
import enCommon from "@/i18n/locales/en/common.json";
import { ListedWelcomeBanner } from "./listed-welcome-banner";

const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

describe("ListedWelcomeBanner", () => {
  beforeEach(() => {
    useSearchParams.mockReset();
  });

  function renderBanner() {
    return render(
      <NextIntlClientProvider locale="en" messages={{ app: enApp, common: enCommon }}>
        <ListedWelcomeBanner />
      </NextIntlClientProvider>,
    );
  }

  it("shows a single welcome message after redirect from listing", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("listed=1"));
    renderBanner();

    expect(screen.getAllByText(/YOU'RE ON KINGOF/)).toHaveLength(1);
  });

  it("renders nothing without listed=1", () => {
    useSearchParams.mockReturnValue(new URLSearchParams());
    const { container } = renderBanner();

    expect(container).toBeEmptyDOMElement();
  });
});
