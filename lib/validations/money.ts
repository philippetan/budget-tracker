import { z } from "zod";

import { MAX_CENTS, parsePesoInput } from "@/lib/money";

/**
 * A peso amount typed into a form, parsed to whole centavos.
 * - `allowNegative`: e.g. a credit card's opening balance can be negative.
 * - `allowZero`: e.g. an opening balance can be 0; transaction amounts can't.
 * An empty input counts as 0.
 */
export function pesoAmount({
  allowNegative = false,
  allowZero = false,
}: { allowNegative?: boolean; allowZero?: boolean } = {}) {
  return z
    .string()
    .trim()
    .transform((value, ctx) => {
      const cents = parsePesoInput(value === "" ? "0" : value);
      if (cents === null) {
        ctx.addIssue({
          code: "custom",
          message: "Enter an amount like 1250 or 1,250.50",
        });
        return z.NEVER;
      }
      return cents;
    })
    .pipe(
      z
        .number()
        .int()
        .max(MAX_CENTS, "That amount is too large")
        .min(
          allowNegative ? -MAX_CENTS : allowZero ? 0 : 1,
          allowNegative
            ? "That amount is too large"
            : allowZero
              ? "Amount can't be negative"
              : "Amount must be more than ₱0",
        ),
    );
}
