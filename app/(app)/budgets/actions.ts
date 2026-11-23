"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { ActionResult as Result } from "@/lib/actions";
import { requireUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { monthRange, shiftMonth } from "@/lib/dates";
import {
  budgetFormSchema,
  monthKeySchema,
  type BudgetFormInput,
} from "@/lib/validations/budget";

type ActionResult = Result<BudgetFormInput>;

const budgetId = z.uuid();

/**
 * Sets a category's budget for a month, creating it or changing the amount.
 * Only the user's own expense categories can have budgets; an archived
 * category can keep an existing budget but can't get a new one.
 */
export async function saveBudget(input: BudgetFormInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = budgetFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { categoryId, amount } = parsed.data;
  const month = monthRange(parsed.data.month).start;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, type: "EXPENSE" },
    select: {
      archivedAt: true,
      budgets: { where: { month }, select: { id: true } },
    },
  });
  if (!category) {
    return {
      ok: false,
      fieldErrors: { categoryId: ["Choose one of your expense categories"] },
    };
  }
  if (category.archivedAt && category.budgets.length === 0) {
    return {
      ok: false,
      fieldErrors: {
        categoryId: ["This category is archived. Restore it to budget for it."],
      },
    };
  }

  await prisma.budget.upsert({
    where: { categoryId_month: { categoryId, month } },
    create: { userId, categoryId, month, amountCents: amount },
    update: { amountCents: amount },
  });

  refresh();
  return { ok: true };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!budgetId.safeParse(id).success) {
    return { ok: false, message: "Budget not found" };
  }

  const { count } = await prisma.budget.deleteMany({ where: { id, userId } });
  if (count === 0) return { ok: false, message: "Budget not found" };

  refresh();
  return { ok: true };
}

export type CopyBudgetsResult =
  | { ok: true; copied: number }
  | { ok: false; message: string };

/**
 * Copies the previous month's budgets into `month`. Categories that already
 * have a budget this month, or are archived, are left alone.
 */
export async function copyPreviousMonthBudgets(
  month: string,
): Promise<CopyBudgetsResult> {
  const userId = await requireUserId();
  const parsed = monthKeySchema.safeParse(month);
  if (!parsed.success) return { ok: false, message: "Choose a valid month" };

  const target = monthRange(parsed.data).start;
  const previous = monthRange(shiftMonth(parsed.data, -1)).start;

  const source = await prisma.budget.findMany({
    where: { userId, month: previous, category: { archivedAt: null } },
    select: { categoryId: true, amountCents: true },
  });

  const { count } = await prisma.budget.createMany({
    data: source.map((b) => ({ ...b, userId, month: target })),
    skipDuplicates: true,
  });

  refresh();
  return { ok: true, copied: count };
}
