import { ImageResponse } from "next/og";

export const runtime = "nodejs";

function CrownIcon({ size }: { size: number }) {
  const pad = Math.round(size * 0.15);
  const inner = size - pad * 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #0f0f0f 0%, #171717 50%, #1a1a1a 100%)",
        borderRadius: Math.round(size * 0.2),
      }}
    >
      <svg width={inner} height={Math.round(inner * 0.8)} viewBox="0 0 24 20" fill="none">
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
    </div>
  );
}

export async function GET() {
  const img = new ImageResponse(<CrownIcon size={192} />, {
    width: 192,
    height: 192,
  });

  return new Response(img.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
