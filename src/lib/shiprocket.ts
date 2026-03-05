import axios, { AxiosInstance } from "axios";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || "";
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || "";

// Pickup address (your warehouse — single location for all shipments)
const PICKUP_LOCATION = process.env.PICKUP_LOCATION_NAME || "Givezy Warehouse";
const PICKUP_ADDRESS = process.env.PICKUP_ADDRESS || "";
const PICKUP_CITY = process.env.PICKUP_CITY || "Hyderabad";
const PICKUP_STATE = process.env.PICKUP_STATE || "Telangana";
const PICKUP_PINCODE = process.env.PICKUP_PINCODE || "500001";
const PICKUP_PHONE = process.env.PICKUP_PHONE || "";

// Token caching (Shiprocket tokens last 10 days)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid (refresh 1 day early)
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error("Shiprocket credentials not configured");
  }

  const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
    email: SHIPROCKET_EMAIL,
    password: SHIPROCKET_PASSWORD,
  });

  cachedToken = response.data.token;
  // Shiprocket tokens last 10 days; refresh after 9
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;

  return cachedToken!;
}

function getClient(): AxiosInstance {
  return axios.create({
    baseURL: SHIPROCKET_BASE_URL,
    timeout: 30000,
  });
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ─── Types ───────────────────────────────────────────────────────────

export interface ShippingEstimate {
  estimatedCost: number; // in rupees
  courierName: string | null;
  estimatedDays: number | null;
  error: string | null;
}

export interface CreateShipmentResult {
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  error: string | null;
}

export interface TrackingResult {
  awb: string | null;
  trackingUrl: string | null;
  currentStatus: string | null;
  error: string | null;
}

// ─── API Functions ───────────────────────────────────────────────────

/**
 * Get shipping rate estimate for a donation shipment
 * Donor's address → your warehouse
 */
export async function getShippingEstimate(
  pickupPincode: string,
  weightGrams: number = 2000, // default 2kg for donated items
): Promise<ShippingEstimate> {
  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    return {
      estimatedCost: 0,
      courierName: null,
      estimatedDays: null,
      error: "Shiprocket not configured",
    };
  }

  try {
    const client = getClient();
    const headers = await authHeaders();

    // Use Shiprocket's serviceability check to get courier rates
    const response = await client.get("/courier/serviceability/", {
      headers,
      params: {
        pickup_postcode: pickupPincode,
        delivery_postcode: PICKUP_PINCODE, // donor ships TO your warehouse
        weight: weightGrams / 1000, // Shiprocket wants kg
        cod: 0, // prepaid (paid via Razorpay)
      },
    });

    const couriers = response.data?.data?.available_courier_companies;
    if (!couriers || couriers.length === 0) {
      return {
        estimatedCost: 0,
        courierName: null,
        estimatedDays: null,
        error: "No couriers available for this pincode",
      };
    }

    // Pick the cheapest courier
    const cheapest = couriers.reduce(
      (min: { freight_charge: number }, c: { freight_charge: number }) =>
        c.freight_charge < min.freight_charge ? c : min,
      couriers[0]
    );

    return {
      estimatedCost: Math.ceil(cheapest.freight_charge), // round up to nearest rupee
      courierName: cheapest.courier_name || null,
      estimatedDays: cheapest.etd ? parseInt(cheapest.etd) : null,
      error: null,
    };
  } catch (err) {
    console.error("Shiprocket estimate error:", err);
    return {
      estimatedCost: 0,
      courierName: null,
      estimatedDays: null,
      error: "Failed to get shipping estimate",
    };
  }
}

/**
 * Create a Shiprocket order after payment is confirmed
 * This creates a forward shipment: donor → your warehouse
 */
export async function createShipmentOrder(params: {
  shipmentId: string; // our internal shipment ID
  donationId: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  donorAddress: string;
  donorPincode: string;
  donorCity: string;
  itemTitle: string;
  itemCategory: string;
  quantity: number;
  weightGrams: number;
  totalPaidRupees: number;
}): Promise<CreateShipmentResult> {
  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    return { shiprocketOrderId: "", shiprocketShipmentId: "", error: "Shiprocket not configured" };
  }

  try {
    const client = getClient();
    const headers = await authHeaders();

    const orderPayload = {
      order_id: params.shipmentId, // unique per order
      order_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      pickup_location: PICKUP_LOCATION,
      channel_id: "",
      comment: `Donation ${params.donationId}: ${params.itemTitle}`,
      billing_customer_name: params.donorName,
      billing_last_name: "",
      billing_address: params.donorAddress,
      billing_city: params.donorCity || "Unknown",
      billing_pincode: params.donorPincode,
      billing_state: "", // Shiprocket auto-detects from pincode
      billing_country: "India",
      billing_email: params.donorEmail || "donor@givezy.in",
      billing_phone: params.donorPhone,
      shipping_is_billing: false,
      // Ship TO your warehouse
      shipping_customer_name: PICKUP_LOCATION,
      shipping_address: PICKUP_ADDRESS,
      shipping_city: PICKUP_CITY,
      shipping_pincode: PICKUP_PINCODE,
      shipping_state: PICKUP_STATE,
      shipping_country: "India",
      shipping_email: SHIPROCKET_EMAIL,
      shipping_phone: PICKUP_PHONE,
      order_items: [
        {
          name: params.itemTitle,
          sku: `DON-${params.donationId.slice(0, 8)}`,
          units: params.quantity,
          selling_price: params.totalPaidRupees,
          discount: 0,
          tax: 0,
          hsn: "",
        },
      ],
      payment_method: "Prepaid",
      sub_total: params.totalPaidRupees,
      length: 30, // cm — default box size
      breadth: 25,
      height: 15,
      weight: params.weightGrams / 1000, // kg
    };

    const response = await client.post("/orders/create/adhoc", orderPayload, { headers });

    return {
      shiprocketOrderId: String(response.data.order_id || ""),
      shiprocketShipmentId: String(response.data.shipment_id || ""),
      error: null,
    };
  } catch (err: unknown) {
    console.error("Shiprocket create order error:", err);
    const message =
      axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Failed to create shipment";
    return { shiprocketOrderId: "", shiprocketShipmentId: "", error: message };
  }
}

/**
 * Get tracking info for a shipment
 */
export async function getTrackingInfo(shiprocketShipmentId: string): Promise<TrackingResult> {
  if (!shiprocketShipmentId) {
    return { awb: null, trackingUrl: null, currentStatus: null, error: "No shipment ID" };
  }

  try {
    const client = getClient();
    const headers = await authHeaders();

    const response = await client.get(`/courier/track/shipment/${shiprocketShipmentId}`, {
      headers,
    });

    const tracking = response.data?.tracking_data;
    return {
      awb: tracking?.awb_code || null,
      trackingUrl: tracking?.track_url || null,
      currentStatus: tracking?.shipment_status_id
        ? mapShiprocketStatus(tracking.shipment_status_id)
        : null,
      error: null,
    };
  } catch (err) {
    console.error("Shiprocket tracking error:", err);
    return { awb: null, trackingUrl: null, currentStatus: null, error: "Failed to get tracking" };
  }
}

function mapShiprocketStatus(statusId: number): string {
  const statuses: Record<number, string> = {
    1: "processing", // AWB assigned
    2: "processing", // Ready to ship
    3: "shipped",    // Picked up
    4: "shipped",    // In transit
    5: "shipped",    // Out for delivery
    6: "delivered",  // Delivered
    7: "cancelled",  // Cancelled
    8: "shipped",    // RTO initiated
    9: "shipped",    // RTO delivered
  };
  return statuses[statusId] || "pending";
}
