import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, city, source } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    const [lead] = await db
      .insert(leads)
      .values({
        name: name ? String(name).slice(0, 120) : null,
        email: email ? String(email).slice(0, 200) : null,
        phone: phone ? String(phone).slice(0, 20) : null,
        city: city ? String(city).slice(0, 80) : null,
        source: source === "homepage_exit" ? "homepage_exit" : "homepage_timed",
      })
      .returning();

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Lead capture error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
