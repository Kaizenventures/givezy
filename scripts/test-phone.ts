/**
 * Phone normalisation, including the bug that started it.
 *
 *   npx tsx scripts/test-phone.ts
 */
import {
  normalizeIndianMobile,
  phoneInputDigits,
  formatIndianMobile,
  whatsappDigits,
} from "../src/lib/phone";

let failures = 0;

function check(what: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "  ok  " : " FAIL "} ${what}${ok ? "" : `\n         expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`,
  );
}

/**
 * The original bug. A controlled input hands back its whole value on every
 * keystroke, so whatever the formatter returns is what it reads next time.
 * This replays that loop — if the prefix ever ends up inside the value again,
 * this test fails.
 */
function typeInto(number: string): string {
  let state = "";
  for (const ch of number) {
    state = phoneInputDigits(state + ch);
  }
  return state;
}

console.log("\nTyping a number one key at a time");
check("9876543210 survives", typeInto("9876543210"), "9876543210");
check("6000000001 survives", typeInto("6000000001"), "6000000001");
check("a partial number is left alone", typeInto("98765"), "98765");
check("the eleventh keypress is ignored", typeInto("98765432109"), "9876543210");

console.log("\nPasting, in the shapes people actually paste");
check("plain", phoneInputDigits("9876543210"), "9876543210");
check("spaced with country code", phoneInputDigits("+91 98765 43210"), "9876543210");
check("country code, no plus", phoneInputDigits("919876543210"), "9876543210");
check("double-zero international", phoneInputDigits("00919876543210"), "9876543210");
check("leading STD zero", phoneInputDigits("09876543210"), "9876543210");
check("hyphenated", phoneInputDigits("98765-43210"), "9876543210");

console.log("\nWhat counts as a valid mobile");
check("ten digits from 9", normalizeIndianMobile("9876543210"), "9876543210");
check("ten digits from 6", normalizeIndianMobile("6876543210"), "6876543210");
check("with country code", normalizeIndianMobile("+91 9876543210"), "9876543210");
check("with a trunk zero", normalizeIndianMobile("09550478555"), "9550478555");
check("too short", normalizeIndianMobile("98765"), null);
check("too long", normalizeIndianMobile("98765432101234"), null);
check("landline-style leading 2", normalizeIndianMobile("2876543210"), null);
check("empty", normalizeIndianMobile(""), null);
check("letters", normalizeIndianMobile("not a number"), null);

console.log("\nThe shapes this bug actually produced");
// All seven rows in production look like these two: too short to be a mobile,
// so validation now catches them at submission.
for (const corrupt of ["+91 919191919", "+91 9191919"]) {
  check(`"${corrupt}" is rejected`, normalizeIndianMobile(corrupt), null);
}
// But the fully-clamped shape is a ten-digit number starting with 9, which is
// indistinguishable from a real one. No validator can reject it without also
// rejecting whoever genuinely owns 9191919876. This is the case that proves
// server-side checking was never going to be enough on its own — the input had
// to stop producing it.
check(
  '"+91 9191919876" cannot be told apart from a real number',
  normalizeIndianMobile("+91 9191919876"),
  "9191919876",
);

console.log("\nWhatsApp links");
check("country code added once", whatsappDigits("9876543210"), "919876543210");
check("not added twice", whatsappDigits("+91 9876543210"), "919876543210");
check("trunk zero handled", whatsappDigits("09550478555"), "919550478555");
check("no link for a bad number", whatsappDigits("+91 919191919"), null);

console.log("\nStored format");
check("normalised on the way in", formatIndianMobile("09876543210"), "+91 9876543210");
check("already correct", formatIndianMobile("+91 9876543210"), "+91 9876543210");
check("left as-is when unusable", formatIndianMobile("12345"), "12345");

console.log(failures === 0 ? "\nAll phone checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
