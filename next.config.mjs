/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  // Remotion pulls in heavy optional native deps that should never be bundled
  // into the Next.js server build (they're only used by the standalone render
  // server in server/render-server.mjs).
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    "remotion",
  ],
}

export default nextConfig
