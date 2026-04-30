/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  assetPrefix: "/",
  transpilePackages: [
    "@particle-network/universal-deposit",
    "@particle-network/auth-core-modal",
  ],
};
module.exports = nextConfig;
