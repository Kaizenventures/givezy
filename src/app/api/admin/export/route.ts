import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, shipments, leads, waitlist } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-guard";
import { statusLabel } from "@/lib/donation-status";

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (cell: string | number) => {
    const s = String(cell ?? "");
    // Prefix cells that a spreadsheet would otherwise evaluate as a formula
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function csvResponse(name: string, body: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="givezy-${name}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = new URL(req.url).searchParams.get("type") || "donations";

  if (type === "leads") {
    const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
    return csvResponse(
      "leads",
      toCsv(
        ["ID", "Name", "Email", "Phone", "City", "Source", "Captured At"],
        rows.map((r) => [r.id, r.name || "", r.email || "", r.phone || "", r.city || "", r.source, r.createdAt]),
      ),
    );
  }

  if (type === "waitlist") {
    const rows = await db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
    return csvResponse(
      "waitlist",
      toCsv(
        ["ID", "Name", "Phone", "Email", "Pincode", "Category", "Weight Option", "Status", "Notes", "Joined At"],
        rows.map((r) => [
          r.id, r.name, r.phone, r.email || "", r.pincode || "",
          r.category || "", r.weightBucket || "", r.status, r.notes || "", r.createdAt,
        ]),
      ),
    );
  }

  const allDonations = await db.select().from(donations).orderBy(desc(donations.createdAt));
  const allShipments = await db.select().from(shipments);
  const byDonation = new Map(allShipments.map((s) => [s.donationId, s]));

  const rows = allDonations.map((d) => {
    const s = byDonation.get(d.id);
    return [
      d.id,
      d.category,
      d.weightBucket,
      d.title || "",
      d.description || "",
      statusLabel(d.status),
      d.donorName,
      d.donorPhone,
      d.donorEmail || "",
      d.donorAddress,
      d.donorPincode,
      d.donorArea || "",
      d.whatsappOptin ? "Yes" : "No",
      s ? (s.totalAmount / 100).toFixed(2) : "",
      s?.paymentStatus || "",
      s?.razorpayPaymentId || "",
      s?.fulfillmentStatus || "",
      s?.shiprocketOrderId || "",
      s?.shiprocketAwb || "",
      s?.estimatedCourierCost != null ? (s.estimatedCourierCost / 100).toFixed(2) : "",
      d.pickupDate || "",
      d.pickupNotes || "",
      d.createdAt,
    ];
  });

  return csvResponse(
    "donations",
    toCsv(
      [
        "ID", "Category", "Weight Option", "Title", "Description", "Status",
        "Donor Name", "Donor Phone", "Donor Email", "Donor Address", "Donor Pincode", "Donor Area",
        "WhatsApp Opt-in", "Amount Paid (INR)", "Payment Status", "Razorpay Payment ID",
        "Fulfilment Status", "Shiprocket Order ID", "AWB", "Courier Quoted (INR)",
        "Pickup Date", "Pickup Notes", "Created At",
      ],
      rows,
    ),
  );
}
