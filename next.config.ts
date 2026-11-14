import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server (http://<laptop-ip>:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // The recruiter "About" tab became "Contests"; old links and bookmarks still work.
  async redirects() {
    return [{ source: "/r/:slug/about", destination: "/r/:slug/contests", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
