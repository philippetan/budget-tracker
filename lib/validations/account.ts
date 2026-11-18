import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "@/lib/accounts";
import { pesoAmount } from "@/lib/validations/money";

// Shared by the account form (client) and the server actions.
export const accountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name, e.g. GoTyme or Cash")
    .max(100, "Name must be 100 characters or less"),
  type: z.enum(ACCOUNT_TYPE_VALUES, "Choose an account type"),
  // What's in the account right now, before any transactions are recorded.
  initialBalance: pesoAmount({ allowNegative: true, allowZero: true }),
});

/** What the form sends (strings). */
export type AccountFormInput = z.input<typeof accountFormSchema>;
/** After validation (amount in centavos). */
export type AccountFormData = z.output<typeof accountFormSchema>;

export type FieldErrors = Partial<Record<keyof AccountFormInput, string[]>>;
