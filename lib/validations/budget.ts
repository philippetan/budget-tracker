import { z } from "zod";

import { pesoAmount } from "@/lib/validations/money";

/** A month as "YYYY-MM" between 2000 and 2099. */
export const monthKeySchema = z
  .string()
  .regex(/^20\d{2}-(0[1-9]|1[0-2])$/, "Choose a valid month");

// Shared by the budget form (client) and the server actions.
export const budgetFormSchema = z.object({
  categoryId: z.uuid("Choose a category"),
  month: monthKeySchema,
  amount: pesoAmount(),
});

export type BudgetFormInput = z.input<typeof budgetFormSchema>;
export type BudgetFieldErrors = Partial<
  Record<keyof BudgetFormInput, string[]>
>;
