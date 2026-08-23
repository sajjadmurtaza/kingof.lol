export const DATAFAST_VISITOR_COOKIE = "datafast_visitor_id";
export const DATAFAST_SESSION_COOKIE = "datafast_session_id";

export type DataFastAttribution = {
  visitorId: string;
  sessionId: string;
};

function readCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name && rawValue.length > 0) {
      try {
        return decodeURIComponent(rawValue.join("="));
      } catch {
        return rawValue.join("=");
      }
    }
  }
  return null;
}

/** Parse DataFast attribution cookies set by the client-side script. */
export function parseDataFastAttribution(
  cookieHeader: string | null | undefined,
): DataFastAttribution | null {
  if (!cookieHeader) return null;

  const visitorId = readCookie(cookieHeader, DATAFAST_VISITOR_COOKIE)?.trim();
  const sessionId = readCookie(cookieHeader, DATAFAST_SESSION_COOKIE)?.trim();

  if (!visitorId || !sessionId) return null;

  return { visitorId, sessionId };
}

export function parseDataFastAttributionFromRequest(request: Request): DataFastAttribution | null {
  return parseDataFastAttribution(request.headers.get("cookie"));
}

export function datafastStripeMetadata(
  attribution: DataFastAttribution | null | undefined,
): Record<string, string> {
  if (!attribution) return {};

  return {
    datafast_visitor_id: attribution.visitorId,
    datafast_session_id: attribution.sessionId,
  };
}
