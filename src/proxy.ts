import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { LOCALE_MIDDLEWARE_MATCHER } from "./proxy-matcher";

export default createMiddleware(routing);

export const config = {
  // Keep metadata routes, APIs, and static files out of locale prefixing.
  matcher: LOCALE_MIDDLEWARE_MATCHER,
};
