import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/domains/leaderboard/queries";

export const runtime = "nodejs";
export const alt = "KINGOF Product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductTwitterImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  let name = slug;
  let tagline = "";
  let rank = 0;
  let categoryName = "";
  let totalBid = 0;

  try {
    const product = await getProductBySlug(slug);
    if (product) {
      name = product.name;
      tagline = product.tagline;
      rank = product.rank;
      categoryName = product.categoryName;
      totalBid = product.totalBid;
    }
  } catch {
    // use defaults
  }

  const isKing = rank === 1;
  const bidDollars = (totalBid / 100).toLocaleString("en-US");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0a0a0a 0%, #111111 40%, #0f0f0f 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            display: "flex",
            background: isKing
              ? "linear-gradient(90deg, transparent 5%, #fbbf24 25%, #d97706 50%, #fbbf24 75%, transparent 95%)"
              : "linear-gradient(90deg, transparent 10%, #404040 30%, #525252 50%, #404040 70%, transparent 90%)",
          }}
        />

        {/* Brand top-left */}
        <div style={{ position: "absolute", top: 32, left: 48, display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 900,
              background: "linear-gradient(135deg, #fde68a, #fbbf24, #d97706)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            KINGOF
          </div>
          {categoryName && (
            <>
              <div style={{ display: "flex", color: "#404040", fontSize: 22 }}>/</div>
              <div style={{ display: "flex", color: "#737373", fontSize: 18, fontWeight: 500 }}>{categoryName}</div>
            </>
          )}
        </div>

        <div style={{ position: "absolute", top: 36, right: 48, display: "flex", color: "#525252", fontSize: 16 }}>
          kingof.lol
        </div>

        {/* Crown for #1 */}
        {isKing && (
          <svg width="64" height="52" viewBox="0 0 24 20" fill="none">
            <defs>
              <linearGradient id="g" x1="4" y1="2" x2="20" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <path d="M2 17L3.5 6l4.5 4.5L12 3l4 7.5L20.5 6 22 17z" fill="url(#g)" />
            <rect x="2" y="16" width="20" height="3" rx="1" fill="url(#g)" />
            <circle cx="3.5" cy="5" r="1.5" fill="url(#g)" />
            <circle cx="12" cy="2" r="1.8" fill="url(#g)" />
            <circle cx="20.5" cy="5" r="1.5" fill="url(#g)" />
            <circle cx="12" cy="14" r="1.2" fill="#ef4444" />
          </svg>
        )}

        {/* Rank badge */}
        {!isKing && rank > 0 && (
          <div style={{ display: "flex", width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, background: "#262626", color: "#a3a3a3", border: "2px solid #333" }}>
            #{rank}
          </div>
        )}

        {/* Product name */}
        <div style={{ display: "flex", fontSize: 64, fontWeight: 900, color: "#f5f5f5", marginTop: 16, letterSpacing: "-0.02em", textAlign: "center", maxWidth: 900, lineHeight: 1.1 }}>
          {name}
        </div>

        {tagline && (
          <div style={{ display: "flex", fontSize: 24, color: "#737373", marginTop: 12, textAlign: "center", maxWidth: 700 }}>
            {tagline.length > 80 ? `${tagline.slice(0, 77)}...` : tagline}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 32, marginTop: 32, fontSize: 18 }}>
          {rank > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "flex", color: isKing ? "#fbbf24" : "#737373", fontWeight: 700 }}>#{rank}</span>
              <span style={{ display: "flex", color: "#525252" }}>in {categoryName}</span>
            </div>
          )}
          {totalBid > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "flex", color: "#fbbf24", fontWeight: 700 }}>${bidDollars}</span>
              <span style={{ display: "flex", color: "#525252" }}>bid</span>
            </div>
          )}
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            display: "flex",
            background: isKing
              ? "linear-gradient(90deg, transparent 5%, #fbbf24 25%, #d97706 50%, #fbbf24 75%, transparent 95%)"
              : "linear-gradient(90deg, transparent 10%, #404040 30%, #525252 50%, #404040 70%, transparent 90%)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
