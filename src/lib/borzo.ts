const BORZO_API_URL = process.env.BORZO_API_URL || "https://robotapitest-in.borzodelivery.com/api/business/1.6";
const BORZO_AUTH_TOKEN = process.env.BORZO_AUTH_TOKEN || "";

// Drop-off address where all donations are shipped to
export const DROP_OFF_ADDRESS = process.env.DROP_OFF_ADDRESS || "Hyderabad, Telangana, India";
export const DROP_OFF_CONTACT_NAME = process.env.DROP_OFF_CONTACT_NAME || "Givezy";
export const DROP_OFF_CONTACT_PHONE = process.env.DROP_OFF_CONTACT_PHONE || "";

export interface BorzoEstimate {
  price: number;
  currency: string;
  estimatedTime: string | null;
  error: string | null;
}

export async function calculateDeliveryPrice(
  pickupAddress: string,
  pickupContactName: string,
  pickupContactPhone: string,
): Promise<BorzoEstimate> {
  if (!BORZO_AUTH_TOKEN) {
    return {
      price: 0,
      currency: "INR",
      estimatedTime: null,
      error: "Borzo not configured",
    };
  }

  try {
    const response = await fetch(`${BORZO_API_URL}/calculate-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DV-Auth-Token": BORZO_AUTH_TOKEN,
      },
      body: JSON.stringify({
        type: "standard",
        matter: "Donated books and clothes",
        vehicle_type_id: 8, // Motorbike, up to 20 kg
        total_weight_kg: 5,
        points: [
          {
            address: pickupAddress,
            contact_person: {
              name: pickupContactName,
              phone: pickupContactPhone,
            },
          },
          {
            address: DROP_OFF_ADDRESS,
            contact_person: {
              name: DROP_OFF_CONTACT_NAME,
              phone: DROP_OFF_CONTACT_PHONE,
            },
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.is_successful) {
      return {
        price: data.order?.payment_amount ? parseFloat(data.order.payment_amount) : 0,
        currency: "INR",
        estimatedTime: data.order?.delivery_fee_amount || null,
        error: null,
      };
    }

    return {
      price: 0,
      currency: "INR",
      estimatedTime: null,
      error: data.errors?.[0] || "Could not estimate price",
    };
  } catch (err) {
    return {
      price: 0,
      currency: "INR",
      estimatedTime: null,
      error: "Failed to reach Borzo API",
    };
  }
}

// Generate a deep link to Borzo website for the donor to book
export function getBorzoBookingUrl(pickupAddress: string): string {
  const encoded = encodeURIComponent(pickupAddress);
  return `https://borzodelivery.com/in?from=${encoded}&to=${encodeURIComponent(DROP_OFF_ADDRESS)}`;
}
