// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Realtor CRM",
    short_name: "CRM",
    description: "Two-page mobile CRM for Contacts & Listings",
    start_url: "/contacts",
    scope: "/",
    display: "standalone",
    background_color: "#0a0f1c",
    theme_color: "#0a0f1c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
