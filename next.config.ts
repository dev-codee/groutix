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
      {
        source: '/regrouting',
        destination: '/tile-regrouting',
        permanent: true,
      },
      {
        source: '/author/:slug*',
        destination: '/about',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
