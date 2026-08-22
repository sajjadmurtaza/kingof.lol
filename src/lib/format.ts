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
