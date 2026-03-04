import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { admins } from "./schema";
import { hashSync } from "bcryptjs";

async function seed() {
  const client = createClient({ url: "file:./data/givezy.db" });
  const db = drizzle(client);

  const email = process.env.ADMIN_EMAIL || "vipin@givezy.in";
  const password = process.env.ADMIN_PASSWORD || "changeme123";

  await db.insert(admins).values({
    email,
    passwordHash: hashSync(password, 10),
  }).onConflictDoNothing();

  console.log(`Admin seeded: ${email}`);
  process.exit(0);
}

seed().catch(console.error);
