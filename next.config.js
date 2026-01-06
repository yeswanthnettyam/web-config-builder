/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    emotion: true,
  },
  eslint: {
    // Disable ESLint during build to avoid EPERM errors in sandboxed environments
    // ESLint can still be run manually with `npm run lint`
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is still performed, but errors won't fail the build
    // Use `npm run type-check` for strict type checking
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig

