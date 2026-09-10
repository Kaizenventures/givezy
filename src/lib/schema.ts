import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const donations = sqliteTable("donations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull(), // "books" | "clothes"

  // Legacy free-text fields. Still NOT NULL in the database: changing that would
  // force SQLite to rebuild the table, so v2 fills them in with derived values.
  title: text("title").notNull(),
  description: text("description"),
  condition: text("condition").notNull(),
  quantity: integer("quantity").notNull().default(1),

  // v2: photos + flat-priced weight bucket
  photos: text("photos").notNull().default("[]"), // JSON array of image URLs
  weightBucket: text("weight_bucket").notNull().default("upto-5kg"),
  // Donors may size their donation by weight or by book count — the chosen
  // bucket id lives in weightBucket either way; this records which scale it came from.
  sizeMode: text("size_mode").notNull().default("weight"), // weight | count
  genres: text("genres").notNull().default("[]"), // JSON array of genre ids
  weightRange: text("weight_range").notNull().default("1-3kg"), // legacy
  imageUrl: text("image_url"), // legacy single photo

  // pending_payment | paid | bag_sent | packed | pickup_scheduled | picked_up | completed | cancelled
  status: text("status").notNull().default("pending"),
  bagSentAt: text("bag_sent_at"),
  packedConfirmedAt: text("packed_confirmed_at"),
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
  preferredSlot: text("preferred_slot"),
});

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

// Shipments — payment for the pickup + (later) Shiprocket fulfilment
export const shipments = sqliteTable("shipments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  donationId: text("donation_id").notNull(),

  // Pricing (paise). In v2 shippingCost is the flat bucket price and
  // serviceFee is 0 — the margin is baked into the bucket price.
  shippingCost: integer("shipping_cost").notNull(),
  serviceFee: integer("service_fee").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),

  // What Shiprocket actually quoted, recorded so under-priced buckets surface in admin
  estimatedCourierCost: integer("estimated_courier_cost"),

  // Razorpay
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed | refunded
  paymentMethod: text("payment_method"), // upi | card | netbanking | wallet — as reported by Razorpay
  failureReason: text("failure_reason"), // human-readable decline reason for the failed-payments log
  failedAt: text("failed_at"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),

  // Shiprocket — created manually from admin once the donor confirms the bag is packed
  shiprocketOrderId: text("shiprocket_order_id"),
  shiprocketShipmentId: text("shiprocket_shipment_id"),
  shiprocketAwb: text("shiprocket_awb"),
  trackingUrl: text("tracking_url"),
  fulfillmentStatus: text("fulfillment_status").notNull().default("pending"), // pending | processing | shipped | delivered | cancelled

  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Key/value store for admin-editable pricing, caps and site copy
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON-encoded
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Homepage lead capture (timed popup / exit intent)
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  source: text("source").notNull().default("homepage"), // homepage_timed | homepage_exit
  converted: integer("converted", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Donors turned away because the pickup cap was reached
export const waitlist = sqliteTable("waitlist", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  pincode: text("pincode"),
  category: text("category"),
  weightBucket: text("weight_bucket"),
  status: text("status").notNull().default("waiting"), // waiting | invited | converted | dropped
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type WaitlistEntry = typeof waitlist.$inferSelect;
