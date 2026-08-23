import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { renderWithIntl } from "../../tests/helpers/render-intl";
import { EmailStep } from "./email-step";

function EmailStepHarness(
  props: Omit<Parameters<typeof EmailStep>[0], "promoCode" | "onPromoCodeChange"> & {
    initialPromoCode?: string;
  },
) {
  const { initialPromoCode = "", ...rest } = props;
  const [promoCode, setPromoCode] = useState(initialPromoCode);

  return <EmailStep {...rest} promoCode={promoCode} onPromoCodeChange={setPromoCode} />;
}

describe("EmailStep promo UI", () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    onSubmit.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function renderStep(overrides: Partial<Parameters<typeof EmailStepHarness>[0]> = {}) {
    return renderWithIntl(
      <EmailStepHarness onSubmit={onSubmit} loading={false} bidCents={2500} {...overrides} />,
    );
  }

  it("shows a clickable promo toggle instead of the input by default", () => {
    renderStep();

    expect(screen.getByRole("button", { name: "Have a promo code?" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Promo code (optional)")).toBeNull();
  });

  it("reveals the promo field when the toggle is clicked", () => {
    renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Have a promo code?" }));

    expect(screen.getByLabelText("Promo code (optional)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
  });

  it("hides the promo field and clears the code when Hide is clicked", () => {
    renderStep({ initialPromoCode: "PH2X" });

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByLabelText("Promo code (optional)")).toBeNull();
    expect(screen.getByRole("button", { name: "Have a promo code?" })).toBeInTheDocument();
  });

  it("does not show promo UI for free listings", () => {
    renderStep({ bidCents: 0 });

    expect(screen.queryByRole("button", { name: "Have a promo code?" })).toBeNull();
  });

  it("does not show promo UI on bid increases", () => {
    renderStep({ promoContext: "bid_increase" });

    expect(screen.queryByRole("button", { name: "Have a promo code?" })).toBeNull();
  });

  it("validates promo codes after email and code are entered", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          valid: true,
          bidCreditCents: 5000,
          amountPaidCents: 2500,
          multiplier: 200,
        }),
        { status: 200 },
      ),
    );

    renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Have a promo code?" }));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "founder@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Promo code (optional)"), {
      target: { value: "PH2X" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/promo/validate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          code: "PH2X",
          email: "founder@example.com",
          paymentCents: 2500,
          context: "new_listing",
        }),
      }),
    );

    expect(screen.getByText("Pay $25 · climb as $50")).toBeInTheDocument();
  });

  it("shows a translated error and blocks submit for invalid promo codes", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "PROMO_ALREADY_USED" }), { status: 400 }),
    );

    renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Have a promo code?" }));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "founder@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Promo code (optional)"), {
      target: { value: "PH2X" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("You have already used this promo code.");

    fireEvent.click(screen.getByRole("button", { name: "CONTINUE →" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("opens the promo field automatically when a code is already set", () => {
    renderStep({ initialPromoCode: "PH2X" });

    expect(screen.getByLabelText("Promo code (optional)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Have a promo code?" })).toBeNull();
  });
});
