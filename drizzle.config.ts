import type { Config } from "drizzle-kit";

// A plain object rather than defineConfig(): in the runtime image drizzle-kit
// lives in /opt/tools, outside the app's node_modules, so importing it here
// would leave this config unresolvable. The type import is erased at build time.
export default {
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./data/givezy.db",
  },
} satisfies Config;
