/**
 * Indian mobile numbers, in one place.
 *
 * There were three copies of this logic and all three were wrong in different
 * ways. The give form built its value as `+91 ${digits}` and then re-read that
 * whole string on the next keystroke, so the prefix's own "91" was parsed back
 * in as part of the number — the field filled itself with 9191919... and froze
 * after four keypresses. Seven real people submitted unreachable numbers before
 * anyone noticed. The lead popup did no normalising at all, so a number typed
 * with the usual leading zero produced a WhatsApp link to nowhere.
 *
 * So: one function that takes anything a person might type and either returns
 * ten digits or admits it cannot.
 */

/** Indian mobile numbers are ten digits and begin 6, 7, 8 or 9. */
const MOBILE = /^[6-9]\d{9}$/;

/**
 * Reduce anything a person might type — "+91 98765 43210", "09876543210",
 * "0091-9876543210", "9876543210" — to the ten significant digits.
 * Returns null when it is not a valid Indian mobile number.
 */
export function normalizeIndianMobile(raw: string): string | null {
  let digits = (raw || "").replace(/\D/g, "");

  // International prefix, however it was written
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Country code, but only at a length where it can only be a country code —
  // a real mobile never starts with 91, so this cannot eat a valid number
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  // STD trunk prefix, as printed on most Indian paperwork
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

  return MOBILE.test(digits) ? digits : null;
}

/**
 * The digits to keep in an input's state while someone is still typing.
 *
 * Deliberately permissive — it must not reject a half-typed number — but it
 * does strip a country code or trunk prefix as soon as one is unambiguous, so
 * pasting a fully-formatted number works. It only ever returns digits, never a
 * prefix, which is what stops the feedback loop: the `+91` belongs next to the
 * input, not inside its value.
 */
export function phoneInputDigits(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);

  return digits.slice(0, 10);
}

/** How a number is stored and shown: "+91 9876543210". */
export function formatIndianMobile(raw: string): string {
  const digits = normalizeIndianMobile(raw);
  return digits ? `+91 ${digits}` : raw;
}

/**
 * Digits for a wa.me link, country code included. Returns null rather than a
 * plausible-looking wrong number, so the admin can hide the button instead of
 * offering one that opens an empty chat.
 */
export function whatsappDigits(raw: string): string | null {
  const digits = normalizeIndianMobile(raw);
  return digits ? `91${digits}` : null;
}
