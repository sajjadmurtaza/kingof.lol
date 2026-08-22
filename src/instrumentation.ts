import * as Sentry from "@sentry/nextjs";

export async function register() {
  const { SENTRY_DSN, tracesSampler } = await import("@/lib/sentry-shared");

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: Boolean(SENTRY_DSN),
    tracesSampler,
  });
}

export const onRequestError = Sentry.captureRequestError;
