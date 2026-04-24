import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Node-specific packages to prevent Webpack bundling errors
  serverExternalPackages: ['tesseract.js', 'pdf-parse', 'pdf2pic'],
};

export default nextConfig;
