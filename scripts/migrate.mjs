// Applies the generated SQL migrations, and fails loudly if it cannot.
//
// This replaces `drizzle-kit push --force`, which needs an interactive terminal
// to resolve ambiguities and exits zero when it cannot get one. In a container
// that meant the schema silently never changed while the app started anyway and
// then failed every query touching a new column.
//
// Every migration here is additive by design, so re-running is safe: statements
// that have already been applied are skipped.

import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL || "file:./data/givezy.db";
const dir = process.env.MIGRATIONS_DIR || "drizzle";

// Errors that mean "this statement was already applied", rather than a problem
const ALREADY_APPLIED = [/duplicate column name/i, /already exists/i];

const db = createClient({ url });

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error(`No migrations found in ${dir}`);
  process.exit(1);
}

let applied = 0;
let skipped = 0;

for (const file of files) {
  const statements = readFileSync(join(dir, file), "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim().replace(/;$/, ""))
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await db.execute(statement);
      applied += 1;
    } catch (error) {
      const message = String(error?.message ?? error);
      if (ALREADY_APPLIED.some((r) => r.test(message))) {
        skipped += 1;
        continue;
      }
      console.error(`\nMigration failed in ${file}:\n${statement}\n\n${message}\n`);
      process.exit(1);
    }
  }
}

console.log(`Schema up to date — ${applied} statement(s) applied, ${skipped} already present`);
