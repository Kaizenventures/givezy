#!/bin/sh
set -e

# Migration and seed tooling lives outside the app's node_modules; the
# standalone bundle is traced from the server's own imports and must not be
# reshuffled by an npm install.
export PATH="/opt/tools/node_modules/.bin:$PATH"

echo "Running database migrations..."
drizzle-kit push --force

echo "Seeding admin user..."
tsx src/lib/seed.ts

echo "Starting app..."
# Standalone builds ship their own server; `next start` does not apply here.
exec node server.js
