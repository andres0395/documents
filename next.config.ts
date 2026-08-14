import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Match lib/constants.ts:MAX_FILE_SIZE_BYTES (10 MB).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
