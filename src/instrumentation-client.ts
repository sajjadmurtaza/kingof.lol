import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, tracesSampler } from "@/lib/sentry-shared";

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  tracesSampler,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
