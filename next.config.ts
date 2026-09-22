import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kept out of the server bundle so they stay as real modules in the standalone
  // output. The migration and seed steps run as separate processes at startup
  // and cannot resolve anything Next has inlined into its own chunks.
  serverExternalPackages: ["@libsql/client", "bcryptjs", "drizzle-orm"],
  // Ships only the dependencies the server actually imports. Without it the
  // runtime image carries Next's multi-platform compiler binaries — 380 MB the
  // running server never touches.
  output: "standalone",
};

export default nextConfig;
