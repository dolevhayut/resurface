import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Seed data and the benchmark are read from disk at runtime; ship them with every function.
  outputFileTracingIncludes: { "/**": ["./data/seed/**", "./data/benchmark.json"] },
};

export default nextConfig;
