import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allDonations = await db
    .select()
    .from(donations)
    .orderBy(desc(donations.createdAt));

  const headers = [
    "ID", "Category", "Title", "Description", "Condition", "Quantity",
    "Status", "Pickup Date", "Pickup Notes",
    "Donor Name", "Donor Phone", "Donor Email",
    "Donor Address", "Donor Pincode", "Donor Area",
    "WhatsApp Opt-in", "Preferred Slot", "Created At",
  ];

  const rows = allDonations.map((d) => [
    d.id,
    d.category,
    d.title,
    d.description || "",
    d.condition,
    d.quantity,
    d.status,
    d.pickupDate || "",
    d.pickupNotes || "",
    d.donorName,
    d.donorPhone,
    d.donorEmail || "",
    d.donorAddress,
    d.donorPincode,
    d.donorArea || "",
    d.whatsappOptin ? "Yes" : "No",
    d.preferredSlot || "",
    d.createdAt,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="givezy-donations-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
