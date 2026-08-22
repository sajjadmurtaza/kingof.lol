import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

type LogContext = Record<string, unknown>;

function captureServerError(message: string, error?: unknown, context?: LogContext) {
  if (error instanceof Error) {
    Sentry.captureException(error, { extra: { message, ...context } });
    return;
  }

  Sentry.captureMessage(message, {
    level: "error",
    extra: { error, ...context },
  });
}

/** Server-side logging. Never rely on this for user-facing output. */
export const logger = {
  info(message: string, context?: LogContext) {
    if (isDev) {
      console.log(message, context ?? "");
    }
  },

  warn(message: string, context?: LogContext) {
    if (isDev) {
      console.warn(message, context ?? "");
    }
  },

  error(message: string, error?: unknown, context?: LogContext) {
    if (isDev) {
      console.error(message, error, context ?? "");
    } else {
      captureServerError(message, error, context);
    }
  },
};
