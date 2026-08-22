import { createHash } from "node:crypto";
import { and, eq, gte } from "drizzle-orm";
import { tryGetDb } from "@/db";
import { clicks } from "@/db/schema";

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

const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

/**
 * DB-backed rate limiting: checks the clicks table for a recent click
 * from the same ipHash + productId within the rate window.
 * Works correctly across serverless cold starts and multiple instances.
 */
export async function isRateLimited(ipHash: string, productId: string): Promise<boolean> {
  const db = tryGetDb();
  if (!db) return false;

  try {
    const cutoff = new Date(Date.now() - RATE_LIMIT_MS);
    const [recent] = await db
      .select({ id: clicks.id })
      .from(clicks)
      .where(
        and(
          eq(clicks.ipHash, ipHash),
          eq(clicks.productId, productId),
          gte(clicks.createdAt, cutoff),
        ),
      )
      .limit(1);

    return !!recent;
  } catch {
    return false;
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "0.0.0.0";
}
