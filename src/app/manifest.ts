import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "One Login",
    short_name: "One Login",
    description: "Money in. Money out. Profit. One screen for your trade business.",
    start_url: "/",
    display: "standalone",
    background_color: "#06080b",
    theme_color: "#06080b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
