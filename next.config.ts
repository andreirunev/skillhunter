import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module: load it with Node's require, never bundle it.
  serverExternalPackages: ["better-sqlite3"],
  // Lets a phone on the same Wi-Fi open the dev server (http://<laptop-ip>:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
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
