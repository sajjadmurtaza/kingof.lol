import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

// Keep in sync with LOCALE_MIDDLEWARE_MATCHER in ./proxy-matcher.ts (Next.js requires a static literal here).
export const config = {
  matcher:
    "/((?!api|manage|payment|trpc|_next|_vercel|apple-icon|icon|opengraph-image|twitter-image|manifest\\.webmanifest|.*\\..*).*)",
};
