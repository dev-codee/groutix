import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // -------------------------------------------------------------
      // 1. Specific Page Aliases & Common Alternate Names
      // -------------------------------------------------------------
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/about-us',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/faqs',
        destination: '/faq',
        permanent: true,
      },
      {
        source: '/faq-s',
        destination: '/faq',
        permanent: true,
      },

      // -------------------------------------------------------------
      // 2. Specific Service Subpath Matches
      // -------------------------------------------------------------
      {
        source: '/showers/leak-detection',
        destination: '/leaking-shower-repair',
        permanent: true,
      },
      {
        source: '/showers/leak-repair',
        destination: '/leaking-shower-repair',
        permanent: true,
      },
      {
        source: '/showers/repair',
        destination: '/leaking-shower-repair',
        permanent: true,
      },
      {
        source: '/showers/base',
        destination: '/shower-base-repair',
        permanent: true,
      },
      {
        source: '/leak-detection/showers',
        destination: '/leaking-shower-repair',
        permanent: true,
      },
      {
        source: '/leak-detection/balconies',
        destination: '/balcony-leak-repairs',
        permanent: true,
      },
      {
        source: '/leak-detection/balcony',
        destination: '/balcony-leak-repairs',
        permanent: true,
      },
      {
        source: '/balconies/leak-detection',
        destination: '/balcony-leak-repairs',
        permanent: true,
      },
      {
        source: '/balconies/repair',
        destination: '/balcony-leak-repairs',
        permanent: true,
      },
      {
        source: '/bathroom-renovations/shower-renovations',
        destination: '/shower-regrouting',
        permanent: true,
      },
      {
        source: '/bathroom-renovations/regrouting',
        destination: '/shower-regrouting',
        permanent: true,
      },
      {
        source: '/regrouting/bathroom',
        destination: '/shower-regrouting',
        permanent: true,
      },
      {
        source: '/regrouting/shower',
        destination: '/shower-regrouting',
        permanent: true,
      },
      {
        source: '/regrouting/tile',
        destination: '/tile-regrouting',
        permanent: true,
      },

      // -------------------------------------------------------------
      // 3. Section Category Wildcards
      // -------------------------------------------------------------
      {
        source: '/showers',
        destination: '/shower-regrouting',
        permanent: true,
      },
      {
        source: '/showers/:path*',
        destination: '/shower-regrouting',
        permanent: true,
      },
      {
        source: '/leak-detection',
        destination: '/leaking-shower-repair',
        permanent: true,
      },
      {
        source: '/leak-detection/:path*',
        destination: '/leaking-shower-repair',
        permanent: true,
      },
      {
        source: '/balconies',
        destination: '/balcony-leak-repairs',
        permanent: true,
      },
      {
        source: '/balconies/:path*',
        destination: '/balcony-leak-repairs',
        permanent: true,
      },
      {
        source: '/bathroom-renovations',
        destination: '/shower-regrouting',
        permanent: true,
      },
      {
        source: '/bathroom-renovations/:path*',
        destination: '/shower-regrouting',
        permanent: true,
      },
      {
        source: '/regrouting',
        destination: '/tile-regrouting',
        permanent: true,
      },
      {
        source: '/regrouting/:path*',
        destination: '/tile-regrouting',
        permanent: true,
      },
      {
        source: '/silicone',
        destination: '/silicone-recaulking',
        permanent: true,
      },
      {
        source: '/silicone/:path*',
        destination: '/silicone-recaulking',
        permanent: true,
      },
      {
        source: '/recaulking',
        destination: '/silicone-recaulking',
        permanent: true,
      },
      {
        source: '/recaulking/:path*',
        destination: '/silicone-recaulking',
        permanent: true,
      },
      {
        source: '/epoxy',
        destination: '/epoxy-grout',
        permanent: true,
      },
      {
        source: '/epoxy-grouting',
        destination: '/epoxy-grout',
        permanent: true,
      },
      {
        source: '/epoxy/:path*',
        destination: '/epoxy-grout',
        permanent: true,
      },
      {
        source: '/small-tiling',
        destination: '/small-tiling-jobs',
        permanent: true,
      },
      {
        source: '/tiling',
        destination: '/small-tiling-jobs',
        permanent: true,
      },
      {
        source: '/tiling-repairs',
        destination: '/small-tiling-jobs',
        permanent: true,
      },
      {
        source: '/tiling/:path*',
        destination: '/small-tiling-jobs',
        permanent: true,
      },
      {
        source: '/real-estate',
        destination: '/real-estate-property-services',
        permanent: true,
      },
      {
        source: '/real-estate-strata',
        destination: '/real-estate-property-services',
        permanent: true,
      },
      {
        source: '/real-estate/:path*',
        destination: '/real-estate-property-services',
        permanent: true,
      },

      // -------------------------------------------------------------
      // 4. WordPress Core Archives & Feeds
      // -------------------------------------------------------------
      {
        source: '/author/:slug*',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/user/:slug*',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/category/:path*',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/categories/:path*',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/tag/:path*',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/tags/:path*',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/blog/:path*',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/posts/:path*',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/',
        permanent: true,
      },
      {
        source: '/comments/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-content/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-includes/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-admin/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-json/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-login.php',
        destination: '/',
        permanent: true,
      },
      {
        source: '/xmlrpc.php',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;


