import { z } from "zod";

import { CATEGORY_COLORS, CATEGORY_ICON_NAMES } from "@/lib/categories";

// Shared by the category form (client) and the server actions.
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name, e.g. Pets or Gym")
    .max(50, "Name must be 50 characters or less"),
  type: z.enum(["EXPENSE", "INCOME"], "Choose expense or income"),
  icon: z.enum(CATEGORY_ICON_NAMES, "Choose an icon"),
  color: z.enum(CATEGORY_COLORS, "Choose a colour"),
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFieldErrors = Partial<
  Record<keyof CategoryFormInput, string[]>
>;
