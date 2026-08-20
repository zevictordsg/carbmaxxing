import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which is too small once Server Actions carry
      // uploaded files (chat images up to 5MB, avatars up to 3MB) as
      // multipart form data. 8mb leaves headroom for multipart overhead.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
