/**
 * Exercises refund handling against a real SQLite database.
 *
 * Refunds move money and release capacity, and both webhook retries and the
 * admin button land in the same function, so the behaviour that matters is what
 * happens on the second and third delivery of the same event. That is awkward
 * to check by clicking.
 *
 * Run against a throwaway database:
 *   DATABASE_URL=file:/tmp/refund-test.db npx tsx scripts/test-refunds.ts
 */
import { db } from "../src/lib/db";
import { donations, shipments, settings } from "../src/lib/schema";
import { eq } from "drizzle-orm";
import { recordRefund, refundedInFull } from "../src/lib/refund";
import { settlePayment } from "../src/lib/settle-payment";
import { checkCapacity } from "../src/lib/capacity";
import { slabFit } from "../src/lib/courier-slabs";

let failures = 0;

function check(what: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok  " : " FAIL "} ${what}${ok ? "" : `\n         expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`);
}

async function makeBooking(totalPaise: number, paymentId: string) {
  const [d] = await db
    .insert(donations)
    .values({
      category: "books",
      title: "test",
      condition: "good",
      status: "paid",
      donorName: "Test Giver",
      donorPhone: "9999999999",
      donorAddress: "1 Test Road",
      donorPincode: "500001",
      weightBucket: "bag-5kg",
    })
    .returning();

  const [s] = await db
    .insert(shipments)
    .values({
      donationId: d.id,
      shippingCost: totalPaise,
      totalAmount: totalPaise,
      paymentStatus: "paid",
      razorpayOrderId: `order_${paymentId}`,
      razorpayPaymentId: paymentId,
    })
    .returning();

  return { donation: d, shipment: s };
}

async function reload(shipmentId: string, donationId: string) {
  const [s] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
  const [d] = await db.select().from(donations).where(eq(donations.id, donationId)).limit(1);
  return { s, d };
}

async function main() {
  console.log("\nFull refund");
  {
    const { donation, shipment } = await makeBooking(49900, "pay_full");
    const first = await recordRefund({
      shipmentId: shipment.id,
      amountPaise: 49900,
      razorpayRefundId: "rfnd_1",
      reason: "changed their mind",
    });
    check("records the refund", first.status, "recorded");
    check("reports it as full", first.full, true);

    const { s, d } = await reload(shipment.id, donation.id);
    check("shipment marked refunded", s.paymentStatus, "refunded");
    check("whole amount recorded", s.refundAmount, 49900);
    check("fulfilment cancelled", s.fulfillmentStatus, "cancelled");
    check("booking marked refunded", d.status, "refunded");
    check("refundedInFull agrees", refundedInFull(s), true);

    // Razorpay retries webhooks, and refund.created and refund.processed both
    // describe the same refund.
    const repeat = await recordRefund({
      shipmentId: shipment.id,
      amountPaise: 49900,
      razorpayRefundId: "rfnd_1",
    });
    check("same refund id is a no-op", repeat.status, "already_recorded");
    const after = await reload(shipment.id, donation.id);
    check("amount not double-counted", after.s.refundAmount, 49900);

    // A payment.captured re-delivered after the refund must not resurrect it.
    const resettle = await settlePayment({
      shipmentId: shipment.id,
      razorpayPaymentId: "pay_full",
    });
    check("settlePayment refuses a refunded booking", resettle.status, "refunded");
    const final = await reload(shipment.id, donation.id);
    check("still refunded after re-settle", final.s.paymentStatus, "refunded");
    check("booking still refunded", final.d.status, "refunded");
  }

  console.log("\nPartial refund, then the rest");
  {
    const { donation, shipment } = await makeBooking(49900, "pay_partial");
    const first = await recordRefund({
      shipmentId: shipment.id,
      amountPaise: 10000,
      razorpayRefundId: "rfnd_p1",
      reason: "goodwill",
    });
    check("partial is not full", first.full, false);

    let state = await reload(shipment.id, donation.id);
    check("still paid", state.s.paymentStatus, "paid");
    check("partial amount recorded", state.s.refundAmount, 10000);
    check("booking still live", state.d.status, "paid");

    // The rest, as a separate refund.
    const second = await recordRefund({
      shipmentId: shipment.id,
      amountPaise: 39900,
      razorpayRefundId: "rfnd_p2",
    });
    check("second refund completes it", second.full, true);
    state = await reload(shipment.id, donation.id);
    check("total refunded", state.s.refundAmount, 49900);
    check("now refunded", state.s.paymentStatus, "refunded");
    check("booking now refunded", state.d.status, "refunded");
  }

  console.log("\nOver-refund is clamped");
  {
    const { donation, shipment } = await makeBooking(49900, "pay_over");
    await recordRefund({ shipmentId: shipment.id, amountPaise: 60000, razorpayRefundId: "rfnd_o1" });
    const { s } = await reload(shipment.id, donation.id);
    check("never exceeds what was paid", s.refundAmount, 49900);
  }

  console.log("\nRefunds without an id (payment.refunded backstop)");
  {
    const { donation, shipment } = await makeBooking(49900, "pay_noid");
    await recordRefund({ shipmentId: shipment.id, amountPaise: 49900 });
    const first = await reload(shipment.id, donation.id);
    check("recorded", first.s.refundAmount, 49900);
    // Nothing to deduplicate on, so a fully refunded booking must be left alone
    // rather than counted a second time.
    const repeat = await recordRefund({ shipmentId: shipment.id, amountPaise: 49900 });
    check("second delivery ignored", repeat.status, "already_recorded");
    const after = await reload(shipment.id, donation.id);
    check("amount unchanged", after.s.refundAmount, 49900);
  }

  console.log("\nAn unpaid booking cannot be refunded");
  {
    const [d] = await db
      .insert(donations)
      .values({
        category: "books",
        title: "test",
        condition: "good",
        status: "pending_payment",
        donorName: "Unpaid",
        donorPhone: "9999999999",
        donorAddress: "1 Test Road",
        donorPincode: "500001",
      })
      .returning();
    const [s] = await db
      .insert(shipments)
      .values({
        donationId: d.id,
        shippingCost: 49900,
        totalAmount: 49900,
        paymentStatus: "pending",
      })
      .returning();
    const result = await recordRefund({ shipmentId: s.id, amountPaise: 49900 });
    check("refused", result.status, "not_paid");
  }

  console.log("\nCapacity is released by a refund");
  {
    await db
      .insert(settings)
      .values({ key: "caps", value: JSON.stringify({ daily: 2, weekly: 0, monthly: 0 }) })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: JSON.stringify({ daily: 2, weekly: 0, monthly: 0 }) },
      });

    // Two fresh paid bookings fill a cap of 2.
    const a = await makeBooking(49900, "pay_cap_a");
    const b = await makeBooking(49900, "pay_cap_b");
    let cap = await checkCapacity();
    check("cap reached", cap.available, false);
    check("blocked by the daily cap", cap.blockedBy, "daily");

    await recordRefund({ shipmentId: a.shipment.id, amountPaise: 49900, razorpayRefundId: "rfnd_c1" });
    cap = await checkCapacity();
    check("slot freed by the refund", cap.available, true);
    check("one slot left", cap.remaining, 1);

    await recordRefund({ shipmentId: b.shipment.id, amountPaise: 49900, razorpayRefundId: "rfnd_c2" });
    cap = await checkCapacity();
    check("both slots back", cap.remaining, 2);
  }

  console.log("\nCourier slabs");
  {
    const five = slabFit({ maxKg: 5, tareGrams: 220 });
    check("5 kg limit lands in the 10 kg slab", five.slab?.maxGrams, 10000);
    check("and is flagged as waste", five.waste?.savingPaise, 8000);
    check("suggesting 4.5 kg", five.waste?.suggestedMaxKg, 4.5);

    const fit = slabFit({ maxKg: 4.5, tareGrams: 220 });
    check("4.5 kg lands in the 5 kg slab", fit.slab?.maxGrams, 5000);
    check("with no waste", fit.waste, null);
    check("and 280 g of headroom", fit.headroomGrams, 280);

    // A genuinely big bag is a different product, not a rounding error.
    const big = slabFit({ maxKg: 9.5, tareGrams: 220 });
    check("9.5 kg lands in the 10 kg slab", big.slab?.maxGrams, 10000);
    check("and is not flagged", big.waste, null);

    const huge = slabFit({ maxKg: 40, tareGrams: 220 });
    check("beyond every slab", huge.slab, null);
  }

  console.log(
    failures === 0 ? "\nAll refund checks passed.\n" : `\n${failures} check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
