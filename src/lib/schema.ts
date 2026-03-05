import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const donations = sqliteTable("donations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull(), // "books" | "clothes"
  title: text("title").notNull(),
  description: text("description"),
  condition: text("condition").notNull(), // "new" | "gently_used" | "used"
  quantity: integer("quantity").notNull().default(1),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"), // pending | contacted | scheduled | picked_up | cancelled
  pickupDate: text("pickup_date"),
  pickupNotes: text("pickup_notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),

  // Donor info
  donorName: text("donor_name").notNull(),
  donorPhone: text("donor_phone").notNull(),
  donorEmail: text("donor_email"),
  donorAddress: text("donor_address").notNull(),
  donorPincode: text("donor_pincode").notNull(),
  donorArea: text("donor_area"),
  whatsappOptin: integer("whatsapp_optin", { mode: "boolean" }).notNull().default(false),
  preferredSlot: text("preferred_slot"), // "morning" | "afternoon" | "evening"
});

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

// Shipments table - tracks shipping + payment for each donation
export const shipments = sqliteTable("shipments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  donationId: text("donation_id").notNull(), // links to donations.id

  // Pricing (all in paise: 100 paise = ₹1)
  shippingCost: integer("shipping_cost").notNull(), // base shipping from Shiprocket estimate
  serviceFee: integer("service_fee").notNull(), // 5% of shipping cost — your cut
  totalAmount: integer("total_amount").notNull(), // shippingCost + serviceFee

  // Razorpay payment
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed | refunded
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),

  // Shiprocket fulfillment
  shiprocketOrderId: text("shiprocket_order_id"),
  shiprocketShipmentId: text("shiprocket_shipment_id"),
  shiprocketAwb: text("shiprocket_awb"), // airway bill number
  trackingUrl: text("tracking_url"),
  fulfillmentStatus: text("fulfillment_status").notNull().default("pending"), // pending | processing | shipped | delivered | cancelled

  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;
