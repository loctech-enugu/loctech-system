import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Loctech Team",
    short_name: "Loctech",
    description:
      "Scan QR codes, manage sign-ins, and receive real-time notifications with Loctech Team.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#12005f",
    icons: [
      {
        src: "/logo/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
