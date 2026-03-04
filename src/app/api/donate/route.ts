import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const category = formData.get("category") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const condition = formData.get("condition") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 1;
    const donorName = formData.get("donorName") as string;
    const donorPhone = formData.get("donorPhone") as string;
    const donorEmail = formData.get("donorEmail") as string;
    const donorAddress = formData.get("donorAddress") as string;
    const donorPincode = formData.get("donorPincode") as string;
    const donorArea = formData.get("donorArea") as string;
    const whatsappOptin = formData.get("whatsappOptin") === "true";
    const preferredSlot = formData.get("preferredSlot") as string;

    // Validate required fields
    if (!category || !title || !condition || !donorName || !donorPhone || !donorAddress || !donorPincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Handle image upload
    let imageUrl: string | null = null;
    const image = formData.get("image") as File | null;
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = image.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);

      imageUrl = `/uploads/${filename}`;
    }

    const [donation] = await db
      .insert(donations)
      .values({
        category,
        title,
        description: description || null,
        condition,
        quantity,
        imageUrl,
        donorName,
        donorPhone,
        donorEmail: donorEmail || null,
        donorAddress,
        donorPincode,
        donorArea: donorArea || null,
        whatsappOptin,
        preferredSlot: preferredSlot || null,
      })
      .returning();

    return NextResponse.json({ success: true, id: donation.id }, { status: 201 });
  } catch (error) {
    console.error("Donation submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
