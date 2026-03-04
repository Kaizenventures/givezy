#!/bin/sh
echo "Running database migrations..."
npx drizzle-kit push --force
echo "Seeding admin user..."
npx tsx src/lib/seed.ts
echo "Starting app..."
npm start
