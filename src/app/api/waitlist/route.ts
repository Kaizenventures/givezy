import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "waitlist", 20, 10 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { name, phone, email, pincode, category, weightBucket } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const [entry] = await db
      .insert(waitlist)
      .values({
        name: String(name).slice(0, 120),
        phone: String(phone).slice(0, 20),
        email: email ? String(email).slice(0, 200) : null,
        pincode: pincode ? String(pincode).slice(0, 10) : null,
        category: category ? String(category).slice(0, 40) : null,
        weightBucket: weightBucket ? String(weightBucket).slice(0, 40) : null,
      })
      .returning();

    return NextResponse.json({ success: true, id: entry.id }, { status: 201 });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
