import { NextRequest, NextResponse } from "next/server";
import { calculateDeliveryPrice } from "@/lib/borzo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pickupAddress, contactName, contactPhone } = body;

    if (!pickupAddress) {
      return NextResponse.json({ error: "Pickup address required" }, { status: 400 });
    }

    const estimate = await calculateDeliveryPrice(
      pickupAddress,
      contactName || "Donor",
      contactPhone || "",
    );

    return NextResponse.json(estimate);
  } catch {
    return NextResponse.json({ error: "Failed to calculate" }, { status: 500 });
  }
}
