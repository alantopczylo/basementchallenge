/** @type {import('next').NextConfig} */
const nextConfig = {
  // El sitio abre en /blog: la raíz redirige (307, no permanente)
  async redirects() {
    return [{ source: "/", destination: "/blog", permanent: false }];
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

module.exports = nextConfig;
