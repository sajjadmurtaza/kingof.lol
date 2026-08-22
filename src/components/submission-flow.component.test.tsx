import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "../../tests/helpers/render-intl";
import { SubmissionFlow } from "./submission-flow";

const replace = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("./bid-selector", () => ({
  BidSelector: ({
    onBid,
    onListFree,
  }: {
    onBid: (cents: number) => void;
    onListFree: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => onListFree()}>
        list-free
      </button>
      <button type="button" onClick={() => onBid(2500)}>
        bid-paid
      </button>
    </div>
  ),
}));

vi.mock("./email-step", () => ({
  EmailStep: ({ onSubmit }: { onSubmit: (email: string) => void }) => (
    <button type="button" onClick={() => onSubmit("founder@kingof.lol")}>
      send-email
    </button>
  ),
}));

const previewPayload = {
  url: "https://kingof.lol",
  normalizedUrl: "https://kingof.lol",
  domain: "kingof.lol",
  name: "KINGOF",
  description: "Leaderboard",
  suggestedCategory: "saas",
  existing: null,
};

function mockSubmissionFetches(
  submitResponse: Response,
  previewResponse = new Response(JSON.stringify(previewPayload), { status: 200 }),
) {
  vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/products/preview")) return previewResponse;
    if (url.includes("/api/categories")) {
      return new Response(JSON.stringify([{ slug: "saas", name: "SaaS", emoji: "☁️" }]), {
        status: 200,
      });
    }
    if (url.includes("/api/submit")) return submitResponse;
    throw new Error(`Unexpected fetch: ${url}`);
  });
}

describe("SubmissionFlow", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  async function reachBidStep() {
    fireEvent.change(screen.getByPlaceholderText("https://yourproduct.com"), {
      target: { value: "https://kingof.lol" },
    });
    fireEvent.submit(screen.getByPlaceholderText("https://yourproduct.com").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("LOOKS GOOD · CONTINUE →")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("LOOKS GOOD · CONTINUE →"));
    await waitFor(() => {
      expect(screen.getByText("list-free")).toBeInTheDocument();
    });
  }

  it("redirects to the product page after a free listing (no inline success card)", async () => {
    mockSubmissionFetches(
      new Response(JSON.stringify({ success: true, slug: "kingof", overallRank: 26 }), {
        status: 200,
      }),
    );

    renderWithIntl(<SubmissionFlow locale="en" />);
    await reachBidStep();

    fireEvent.click(screen.getByText("list-free"));
    fireEvent.click(screen.getByText("send-email"));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/product/kingof?listed=1");
    });

    expect(screen.queryByText("YOU'RE ON KINGOF")).toBeNull();
  });

  it("shows an error instead of success when submit fails", async () => {
    mockSubmissionFetches(
      new Response(JSON.stringify({ error: "This product is already listed" }), {
        status: 409,
      }),
    );

    renderWithIntl(<SubmissionFlow locale="en" />);
    await reachBidStep();

    fireEvent.click(screen.getByText("list-free"));
    fireEvent.click(screen.getByText("send-email"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("This product is already listed");
    });

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("YOU'RE ON KINGOF")).toBeNull();
  });

  it("reports phase changes for submit page header visibility", async () => {
    const onPhaseChange = vi.fn();
    renderWithIntl(<SubmissionFlow locale="en" onPhaseChange={onPhaseChange} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(onPhaseChange).toHaveBeenCalledWith("idle");

    mockSubmissionFetches(
      new Response(JSON.stringify({ success: true, slug: "kingof" }), { status: 200 }),
    );

    fireEvent.change(screen.getByPlaceholderText("https://yourproduct.com"), {
      target: { value: "https://kingof.lol" },
    });
    fireEvent.submit(screen.getByPlaceholderText("https://yourproduct.com").closest("form")!);

    await waitFor(() => {
      expect(onPhaseChange).toHaveBeenCalledWith("preview");
    });

    await waitFor(() => {
      expect(screen.getByText("LOOKS GOOD · CONTINUE →")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("LOOKS GOOD · CONTINUE →"));

    await waitFor(() => {
      expect(onPhaseChange).toHaveBeenCalledWith("bid");
    });

    fireEvent.click(screen.getByText("list-free"));

    await waitFor(() => {
      expect(onPhaseChange).toHaveBeenCalledWith("email");
    });
  });
});
