import type { MetadataRoute } from "next";
import enApp from "@/i18n/locales/en/app.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KINGOF",
    short_name: "KINGOF",
    description: enApp.meta.websiteDesc,
    start_url: "/en",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#fbbf24",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
