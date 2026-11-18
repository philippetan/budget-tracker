// Money helpers. All amounts are Philippine pesos stored as whole centavos.

// Postgres INTEGER limit: the largest amount a ...Cents column can hold.
export const MAX_CENTS = 2_147_483_647;

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

/** 125050 -> "₱1,250.50" */
export function formatPeso(cents: number): string {
  return pesoFormatter.format(cents / 100);
}

/** 125050 -> "1250.50" (for pre-filling an amount input) */
export function centsToInput(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/**
 * Parses what a user typed into centavos, without floating-point maths.
 * Accepts "1250", "1,250.5", "₱1,250.50", "-300". Returns null if invalid.
 */
export function parsePesoInput(input: string): number | null {
  const cleaned = input.trim().replace(/[₱,\s]/g, "");
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const [, sign, whole, fraction = ""] = match;
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return sign === "-" ? -cents : cents;
}
