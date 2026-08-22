import { ImageResponse } from "next/og";
import { getAllCategories, getCategoryProducts } from "@/domains/leaderboard/queries";

export const runtime = "nodejs";
export const alt = "KINGOF Category Leaderboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CategoryTwitterImage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { category } = await params;

  let catName = category;
  let catEmoji = "";
  let topProducts: { name: string; totalBid: number }[] = [];

  try {
    const cats = await getAllCategories();
    const found = cats.find((c) => c.slug === category);
    if (found) {
      catName = found.name;
      catEmoji = found.emoji;
    }
    const products = await getCategoryProducts(category);
    topProducts = products.slice(0, 5).map((p) => ({
      name: p.name,
      totalBid: p.totalBid,
    }));
  } catch {
    // use defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(145deg, #0a0a0a 0%, #111111 40%, #0f0f0f 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "48px 64px",
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
            background: "linear-gradient(90deg, transparent 5%, #fbbf24 25%, #d97706 50%, #fbbf24 75%, transparent 95%)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 900,
                background: "linear-gradient(135deg, #fde68a, #fbbf24, #d97706)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              KINGOF
            </div>
            <div style={{ display: "flex", color: "#404040", fontSize: 28 }}>/</div>
            <div style={{ display: "flex", color: "#a3a3a3", fontSize: 24, fontWeight: 600 }}>
              {catEmoji} {catName}
            </div>
          </div>
          <div style={{ display: "flex", color: "#525252", fontSize: 16 }}>kingof.lol</div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", fontSize: 52, fontWeight: 900, color: "#f5f5f5", marginTop: 32, lineHeight: 1.1 }}>
          King of {catName}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#737373", marginTop: 8 }}>
          Top products competing for the crown
        </div>

        {/* Top products */}
        {topProducts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 36, gap: 12 }}>
            {topProducts.map((p, i) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 800,
                    background: i === 0 ? "linear-gradient(135deg, #fbbf24, #d97706)" : "#262626",
                    color: i === 0 ? "#0a0a0a" : "#737373",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: "#e5e5e5" }}>{p.name}</div>
                <div style={{ display: "flex", fontSize: 16, color: "#525252" }}>${(p.totalBid / 100).toLocaleString("en-US")}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            display: "flex",
            background: "linear-gradient(90deg, transparent 5%, #fbbf24 25%, #d97706 50%, #fbbf24 75%, transparent 95%)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
