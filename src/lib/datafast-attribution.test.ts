import { describe, it, expect } from "vitest";
import {
  parseDataFastAttribution,
  parseDataFastAttributionFromRequest,
  datafastStripeMetadata,
} from "./datafast-attribution";

describe("parseDataFastAttribution", () => {
  it("returns null when cookie header is missing", () => {
    expect(parseDataFastAttribution(null)).toBeNull();
    expect(parseDataFastAttribution("")).toBeNull();
  });

  it("returns null when either cookie is missing", () => {
    expect(parseDataFastAttribution("datafast_visitor_id=visitor-1")).toBeNull();
    expect(parseDataFastAttribution("datafast_session_id=session-1")).toBeNull();
  });

  it("parses both DataFast cookies", () => {
    expect(
      parseDataFastAttribution(
        "foo=bar; datafast_visitor_id=visitor-1; datafast_session_id=session-1",
      ),
    ).toEqual({
      visitorId: "visitor-1",
      sessionId: "session-1",
    });
  });

  it("decodes cookie values", () => {
    expect(
      parseDataFastAttribution("datafast_visitor_id=visitor%2F1; datafast_session_id=session%2F1"),
    ).toEqual({
      visitorId: "visitor/1",
      sessionId: "session/1",
    });
  });

  it("keeps malformed percent-encoded values as-is", () => {
    expect(
      parseDataFastAttribution("datafast_visitor_id=bad%ZZ; datafast_session_id=session-1"),
    ).toEqual({
      visitorId: "bad%ZZ",
      sessionId: "session-1",
    });
  });
});

describe("parseDataFastAttributionFromRequest", () => {
  it("reads cookies from the request header", () => {
    const request = {
      headers: {
        get: (name: string) =>
          name === "cookie" ? "datafast_visitor_id=visitor-1; datafast_session_id=session-1" : null,
      },
    } as Request;

    expect(parseDataFastAttributionFromRequest(request)).toEqual({
      visitorId: "visitor-1",
      sessionId: "session-1",
    });
  });
});

describe("datafastStripeMetadata", () => {
  it("returns empty metadata when attribution is missing", () => {
    expect(datafastStripeMetadata(null)).toEqual({});
  });

  it("maps attribution to Stripe metadata keys", () => {
    expect(
      datafastStripeMetadata({
        visitorId: "visitor-1",
        sessionId: "session-1",
      }),
    ).toEqual({
      datafast_visitor_id: "visitor-1",
      datafast_session_id: "session-1",
    });
  });
});
