import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-guard";

const VALID = ["waiting", "invited", "converted", "dropped"];

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (status && !VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if (notes !== undefined) patch.notes = notes;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db.update(waitlist).set(patch).where(eq(waitlist.id, id));
  return NextResponse.json({ success: true });
}
