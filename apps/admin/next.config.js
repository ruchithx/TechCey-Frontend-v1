/** @type {import('next').NextConfig} */
const nextConfig = {
  // @repo/ui ships raw .tsx (shadcn source), so Next must transpile it.
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
