"use client";

import { useState } from "react";
import { pickDisplayIcon } from "@/lib/metadata-parser";
import { LetterAvatar } from "./letter-avatar";

export function ProductLogo({
  name,
  iconUrl,
  logoUrl,
  faviconUrl,
  appleTouchIconUrl,
  ogImageUrl,
  domain,
  size = 40,
  className = "",
  rounded = "lg",
}: {
  name: string;
  iconUrl?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  appleTouchIconUrl?: string | null;
  ogImageUrl?: string | null;
  domain?: string | null;
  size?: number;
  className?: string;
  rounded?: "full" | "lg" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const src = pickDisplayIcon({
    iconUrl,
    logoUrl,
    faviconUrl,
    appleTouchIconUrl,
    ogImageUrl,
    domain,
  });

  const radius =
    rounded === "full" ? "rounded-full" : rounded === "md" ? "rounded-md" : "rounded-lg";

  if (!src || failed) {
    return (
      <LetterAvatar
        name={name}
        domain={domain}
        size={size}
        className={className}
        rounded={rounded}
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 bg-surface object-contain ${radius} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
