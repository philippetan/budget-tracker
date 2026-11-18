import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Agent instructions live in CLAUDE.md; stop `next dev` from regenerating AGENTS.md.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
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
