import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cipher OS",
    short_name: "Cipher",
    description: "Cipher OS — Personal AI Assistant",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d10",
    theme_color: "#0b0d10",
    icons: [
      {
        src: "/CipherLogo.png",
        sizes: "700x700",
        type: "image/png",
      },
    ],
  };
}