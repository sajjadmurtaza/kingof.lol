import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
          borderRadius: 6,
        }}
      >
        <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
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
      </div>
    ),
    { ...size },
  );
}
