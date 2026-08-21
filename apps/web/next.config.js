/** @type {import('next').NextConfig} */
const nextConfig = {
  // @repo/ui ships raw .tsx (shadcn source), so Next must transpile it.
  transpilePackages: ["@repo/ui"],
  images: {
    // picsum.photos backs the MSW product fixtures (mocks/fixtures.ts).
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
