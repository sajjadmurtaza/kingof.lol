import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/nextjs";
import { notifySlack } from "./slack";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("notifySlack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SLACK_WEBHOOK_URL;
  });

  it("no-ops when webhook is not configured", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    notifySlack("hello");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to Slack when configured", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok"));

    notifySlack("incident");
    await Promise.resolve();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "incident" }),
      }),
    );
  });

  it("captures fetch failures without throwing", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    const err = new Error("network");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(err);

    notifySlack("incident");
    await Promise.resolve();
    await Promise.resolve();

    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      tags: { source: "slack-notify" },
    });
  });
});
