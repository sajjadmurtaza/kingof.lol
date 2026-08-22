import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0f0f0f 0%, #171717 50%, #1a1a1a 100%)",
          borderRadius: 36,
        }}
      >
        <svg width="100" height="80" viewBox="0 0 24 20" fill="none">
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
        <div
          style={{
            display: "flex",
            fontSize: 18,
            fontWeight: 900,
            color: "#fbbf24",
            letterSpacing: "0.08em",
            marginTop: 4,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          KINGOF
        </div>
      </div>
    ),
    { ...size },
  );
}
