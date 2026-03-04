import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let query = db.select().from(donations).orderBy(desc(donations.createdAt));

  const results = await query;

  // Filter in JS for simplicity (SQLite + Drizzle dynamic where can be verbose)
  let filtered = results;
  if (status) filtered = filtered.filter((d) => d.status === status);
  if (category) filtered = filtered.filter((d) => d.category === category);

  return NextResponse.json(filtered);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, pickupDate, pickupNotes } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing donation id" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (status) updateData.status = status;
  if (pickupDate !== undefined) updateData.pickupDate = pickupDate;
  if (pickupNotes !== undefined) updateData.pickupNotes = pickupNotes;

  await db.update(donations).set(updateData).where(eq(donations.id, id));

  return NextResponse.json({ success: true });
}
