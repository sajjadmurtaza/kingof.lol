// Shared between src/instrumentation.ts (server/edge) and
// src/instrumentation-client.ts (browser) so both runtimes agree on
// sampling. Sentry is fully optional: with no DSN set, `enabled: false`
// means the SDK no-ops and nothing in the app depends on it being present.

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Payment-critical routes get traced at 100%; everything else gets a small
 * sample. Errors are always captured at 100% regardless of this sampler —
 * this only controls performance trace volume.
 */
export function tracesSampler(samplingContext: { name?: string }): number {
  const name = samplingContext.name ?? "";
  if (name.includes("webhooks/stripe") || name.includes("api/submit")) {
    return 1.0;
  }
  return 0.1;
}
