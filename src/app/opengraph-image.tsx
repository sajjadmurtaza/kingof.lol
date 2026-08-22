import { ImageResponse } from "next/og";

export const alt = "KINGOF — Products Compete for the Crown";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function OgImage() {
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
        {/* Background radial glow */}
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 800,
            borderRadius: 400,
            background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)",
            top: -200,
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            display: "flex",
            background: "linear-gradient(90deg, transparent 10%, #fbbf24 30%, #d97706 50%, #fbbf24 70%, transparent 90%)",
          }}
        />

        {/* Crown */}
        <svg width="120" height="96" viewBox="0 0 24 20" fill="none">
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
          <circle cx="7" cy="14.8" r="0.8" fill="#3b82f6" />
          <circle cx="17" cy="14.8" r="0.8" fill="#3b82f6" />
        </svg>

        {/* Brand name */}
        <div
          style={{
            display: "flex",
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            marginTop: 20,
            background: "linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #d97706 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          KINGOF
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 500,
            color: "#a3a3a3",
            marginTop: 8,
            letterSpacing: "0.04em",
          }}
        >
          Products Compete for the Crown
        </div>

        {/* Bottom bar with categories hint */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 48,
            fontSize: 16,
            color: "#525252",
          }}
        >
          <span style={{ display: "flex" }}>AI</span>
          <span style={{ display: "flex", color: "#404040" }}>|</span>
          <span style={{ display: "flex" }}>Fintech</span>
          <span style={{ display: "flex", color: "#404040" }}>|</span>
          <span style={{ display: "flex" }}>Dev Tools</span>
          <span style={{ display: "flex", color: "#404040" }}>|</span>
          <span style={{ display: "flex" }}>Design</span>
          <span style={{ display: "flex", color: "#404040" }}>|</span>
          <span style={{ display: "flex" }}>SaaS</span>
          <span style={{ display: "flex", color: "#404040" }}>|</span>
          <span style={{ display: "flex" }}>+10 more</span>
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            fontSize: 18,
            fontWeight: 600,
            color: "#525252",
            letterSpacing: "0.08em",
          }}
        >
          kingof.lol
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            display: "flex",
            background: "linear-gradient(90deg, transparent 10%, #fbbf24 30%, #d97706 50%, #fbbf24 70%, transparent 90%)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
