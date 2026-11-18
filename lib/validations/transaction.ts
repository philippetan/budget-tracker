import { z } from "zod";

import { pesoAmount } from "@/lib/validations/money";

const occurredOn = z.iso
  .date("Choose a date")
  .refine((d) => d >= "2000-01-01" && d <= "2099-12-31", "Choose a valid date");

const note = z
  .string()
  .trim()
  .max(500, "Note must be 500 characters or less")
  .transform((value) => value || null);

// Shared by the transaction form (client) and the server actions.
export const transactionFormSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"], "Choose expense or income"),
  amount: pesoAmount(),
  accountId: z.uuid("Choose an account"),
  // "" means no category.
  categoryId: z
    .union([z.literal(""), z.uuid("Choose a category")])
    .transform((value) => value || null),
  occurredOn,
  note,
});

export const transferFormSchema = z
  .object({
    amount: pesoAmount(),
    fromAccountId: z.uuid("Choose where the money comes from"),
    toAccountId: z.uuid("Choose where the money goes"),
    occurredOn,
    note,
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    path: ["toAccountId"],
    message: "Choose a different account",
  });

export type TransactionFormInput = z.input<typeof transactionFormSchema>;
export type TransferFormInput = z.input<typeof transferFormSchema>;
