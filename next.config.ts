import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/prototype/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
