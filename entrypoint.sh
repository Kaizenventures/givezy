#!/bin/sh
set -e

# Seed tooling lives outside the app's node_modules; the standalone bundle is
# traced from the server's imports and must not be reshuffled by an npm install.
export PATH="/opt/tools/node_modules/.bin:$PATH"

echo "Applying database migrations..."
# Deliberately not `drizzle-kit push`: it needs an interactive terminal to
# resolve ambiguities, and exits zero when it cannot get one. In a container
# that meant the schema silently never changed while the app started anyway.
node scripts/migrate.mjs

echo "Seeding admin user..."
tsx src/lib/seed.ts

echo "Starting app..."
# Standalone builds ship their own server; `next start` does not apply here.
exec node server.js
