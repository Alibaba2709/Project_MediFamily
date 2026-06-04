import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MediFamily",
    short_name: "MediFamily",
    description: "Dashboard familiare per visite, scadenze e documenti medici.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf6",
    theme_color: "#fffaf6",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
