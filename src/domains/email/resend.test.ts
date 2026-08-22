import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class ResendMock {
    emails = { send: sendMock };
  },
}));

describe("resend email templates", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "re_test_123";
  });

  it("throws when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendManagementLinkEmail } = await import("./resend");
    await expect(
      sendManagementLinkEmail({
        to: "user@example.com",
        productName: "Acme",
        manageUrl: "https://kingof.lol/manage/token",
      }),
    ).rejects.toThrow("RESEND_API_KEY not set");
  });

  it("sends management link email with escaped HTML", async () => {
    sendMock.mockResolvedValue({ id: "email-1" });
    const { sendManagementLinkEmail } = await import("./resend");

    await sendManagementLinkEmail({
      to: "user@example.com",
      productName: '<script>alert("x")</script>',
      manageUrl: "https://kingof.lol/manage/token",
    });

    const call = sendMock.mock.calls[0]![0] as { html: string; to: string };
    expect(call.to).toBe("user@example.com");
    expect(call.html).toContain("&lt;script&gt;");
    expect(call.html).toContain("color: #171717");
  });

  it("sends dethroned email with formatted bid", async () => {
    sendMock.mockResolvedValue({ id: "email-2" });
    const { sendDethronedEmail } = await import("./resend");

    await sendDethronedEmail({
      to: "user@example.com",
      productName: "Acme",
      categoryName: "SaaS",
      newKingName: "Rival",
      newRequiredBid: 5000,
      manageUrl: "https://kingof.lol/manage/token",
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("dethroned"),
        html: expect.stringContaining("$50"),
      }),
    );
  });

  it("throws when Resend returns an API error", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "Domain not verified" },
    });
    const { sendManagementLinkEmail } = await import("./resend");

    await expect(
      sendManagementLinkEmail({
        to: "user@example.com",
        productName: "Acme",
        manageUrl: "https://kingof.lol/manage/token",
      }),
    ).rejects.toThrow("Domain not verified");
  });

  it("reuses the Resend client singleton", async () => {
    sendMock.mockResolvedValue({ id: "email-3" });
    const { sendManagementLinkEmail } = await import("./resend");

    await sendManagementLinkEmail({
      to: "a@example.com",
      productName: "One",
      manageUrl: "https://kingof.lol/manage/a",
    });
    await sendManagementLinkEmail({
      to: "b@example.com",
      productName: "Two",
      manageUrl: "https://kingof.lol/manage/b",
    });

    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
