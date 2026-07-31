import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/showers',
        destination: '/shower-regrouting',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
