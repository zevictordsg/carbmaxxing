import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js 16 restricts next/image `quality` to this allowlist (default
    // is [75] only) -- 95 is used on full-bleed hero photos where visual
    // fidelity matters more than payload size.
    qualities: [75, 95],
  },
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
