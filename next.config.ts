import type { NextConfig } from "next";

/**
 * Cache Components (`cacheComponents`) is intentionally OFF.
 *
 * Almost every NYC Ready page is per-user and reads the session cookie, so the
 * static-shell model adds Suspense/caching rules without a real benefit yet.
 * Turning it on later is a contained change (see CLAUDE.md, "Rendering model").
 */
const nextConfig: NextConfig = {
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
