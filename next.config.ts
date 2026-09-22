import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  // Ships only the dependencies the server actually imports. Without it the
  // runtime image carries Next's multi-platform compiler binaries — 380 MB the
  // running server never touches.
  output: "standalone",
};

export default nextConfig;
