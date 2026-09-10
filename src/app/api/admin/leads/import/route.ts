import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { isAdmin } from "@/lib/admin-guard";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const MAX_IMPORT = 500;

/**
 * POST /api/admin/leads/import
 * Bulk-imports people who reached out before the funnel existed — paste raw
 * text (an inbox export, a list of addresses, "Name <a@b.com>" pairs) and every
 * address found becomes a lead. Existing addresses are skipped.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text, source } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Paste some text to import" }, { status: 400 });
    }

    // Capture "Name <email>" where present so the lead keeps a usable name
    const namesByEmail = new Map<string, string>();
    for (const rawLine of text.split(/[\n,;]/)) {
      // Drop mail-header prefixes so "From: Meera <...>" yields "Meera"
      const line = rawLine.replace(/^\s*(from|to|cc|bcc|reply-to|sender)\s*:\s*/i, "");
      const m = line.match(/^\s*"?([^"<>@]+?)"?\s*<\s*([^<>\s]+@[^<>\s]+)\s*>/);
      if (m) {
        const name = m[1].trim();
        if (name) namesByEmail.set(m[2].toLowerCase(), name.slice(0, 120));
      }
    }

    const found = text.match(EMAIL_RE) || [];
    const unique = [...new Set(found.map((e) => e.toLowerCase()))];

    if (unique.length === 0) {
      return NextResponse.json({ error: "No email addresses found in that text" }, { status: 400 });
    }
    if (unique.length > MAX_IMPORT) {
      return NextResponse.json(
        { error: `That's ${unique.length} addresses; import at most ${MAX_IMPORT} at a time` },
        { status: 400 },
      );
    }

    const existing = new Set(
      (await db.select({ email: leads.email }).from(leads))
        .map((r) => r.email?.toLowerCase())
        .filter((e): e is string => !!e),
    );

    const toInsert = unique.filter((e) => !existing.has(e));

    if (toInsert.length > 0) {
      await db.insert(leads).values(
        toInsert.map((email) => ({
          email,
          name: namesByEmail.get(email) || null,
          source: source === "manual" ? "manual" : "email_inbox",
        })),
      );
    }

    return NextResponse.json({
      success: true,
      found: unique.length,
      imported: toInsert.length,
      skipped: unique.length - toInsert.length,
    });
  } catch (error) {
    console.error("Lead import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
