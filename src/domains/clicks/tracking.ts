import { createHash } from "node:crypto";

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /mediapartners/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baidu/i,
  /duckduck/i,
  /ia_archiver/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /headlesschrome/i,
  /phantomjs/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /go-http-client/i,
  /java\//i,
  /apache-httpclient/i,
];

export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  if (userAgent.length < 10) return true;
  return BOT_PATTERNS.some((p) => p.test(userAgent));
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "kingof-salt-2026";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

const rateCache = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

export function isRateLimited(ipHash: string, productId: string): boolean {
  const key = `${ipHash}:${productId}`;
  const lastClick = rateCache.get(key);
  if (lastClick && Date.now() - lastClick < RATE_LIMIT_MS) {
    return true;
  }
  rateCache.set(key, Date.now());

  if (rateCache.size > 100_000) {
    const cutoff = Date.now() - RATE_LIMIT_MS;
    for (const [k, v] of rateCache) {
      if (v < cutoff) rateCache.delete(k);
    }
  }

  return false;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "0.0.0.0";
}
