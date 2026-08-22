export function formatBid(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US")}`;
}

export function formatClicks(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function rankLabel(rank: number): string {
  if (rank === 1) return "👑";
  return `#${rank}`;
}

export function rankEmoji(rank: number): string {
  if (rank === 1) return "👑";
  return "";
}

export type TimeAgoParts =
  | { unit: "now" }
  | { unit: "minutes" | "hours" | "days"; count: number };

/**
 * Locale-agnostic on purpose — returns a unit + count instead of a formatted
 * string so callers can translate it (e.g. via next-intl's t()) rather than
 * baking English words like "ago" into a shared utility.
 */
export function timeAgoParts(date: Date, now = Date.now()): TimeAgoParts {
  const diffMin = Math.floor((now - date.getTime()) / 60000);
  if (diffMin < 1) return { unit: "now" };
  if (diffMin < 60) return { unit: "minutes", count: diffMin };
  if (diffMin < 1440) return { unit: "hours", count: Math.floor(diffMin / 60) };
  return { unit: "days", count: Math.floor(diffMin / 1440) };
}

/** Short site/product label for avatar fallback when no icon is available. */
export function siteLabelForAvatar(
  name: string,
  domain: string | null | undefined,
  size: number,
): { text: string; fontSize: number } {
  const domainStem = domain?.replace(/^www\./i, "").split(".")[0]?.trim();
  const nameStem = name.split(/\s+/)[0]?.trim();
  const raw = domainStem || nameStem || name;
  const clean = raw.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() || name.slice(0, 2).toLowerCase();

  let maxLen: number;
  if (size <= 24) maxLen = 2;
  else if (size <= 32) maxLen = 4;
  else if (size <= 44) maxLen = 6;
  else if (size <= 56) maxLen = 8;
  else maxLen = 10;

  const text = clean.slice(0, maxLen);
  const scale = text.length <= 2 ? 0.34 : text.length <= 4 ? 0.26 : text.length <= 6 ? 0.22 : 0.18;
  const fontSize = Math.max(7, Math.min(size * scale, 14));

  return { text, fontSize };
}
