import type { NextConfig } from "next";

const nextConfig = {
  agentRules: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
} satisfies NextConfig & { agentRules?: boolean };

export default nextConfig;
