import * as Sentry from "@sentry/nextjs";

/**
 * Fire-and-forget Slack alert for actionable production incidents only —
 * not general logging. Never throws and never blocks the caller: a request
 * (webhook, cron, submit) must succeed or fail on its own merits regardless
 * of whether Slack is reachable or configured.
 */
export function notifySlack(message: string): void {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  }).catch((err) => {
    Sentry.captureException(err, { tags: { source: "slack-notify" } });
  });
}
