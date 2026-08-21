/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/search/:collection((?!$|page).+)",
        destination: "/collections/:collection",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/shop",
        destination: "/search",
      },
    ];
  },
};
