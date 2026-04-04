/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.STANDALONE === "true" ? { output: "standalone" } : {}),
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
    };
    return config;
  },
};

export default nextConfig;
