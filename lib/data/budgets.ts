import "server-only";

import { ensureStarterCategories } from "@/lib/data/categories";
import { monthRange, shiftMonth, type MonthKey } from "@/lib/dates";
import { prisma } from "@/lib/db";

export type BudgetCategory = {
  id: string;
  name: string;
  icon: string;
  color: string | null;
  archived: boolean;
  /** Spent in this category during the month. */
  spentCents: number;
};

export type BudgetItem = {
  id: string;
  amountCents: number;
  category: BudgetCategory;
};

export type MonthBudgets = {
  /** This month's budgets, in category order. */
  budgets: BudgetItem[];
  /** Expense categories with spending this month but no budget. */
  unbudgeted: BudgetCategory[];
  /** Expenses this month with no category. */
  uncategorisedCents: number;
  /** Active expense categories that can still get a budget this month. */
  addable: BudgetCategory[];
  /** How many of last month's budgets could be copied into this month. */
  copyableCount: number;
};

/** A month's budgets with what's been spent against each. */
export async function getMonthBudgets(
  userId: string,
  month: MonthKey,
): Promise<MonthBudgets> {
  await ensureStarterCategories(userId);

  const { start, end } = monthRange(month);
  const previousStart = monthRange(shiftMonth(month, -1)).start;

  const [categories, budgets, previousBudgets, spending] = await Promise.all([
    prisma.category.findMany({
      where: { userId, type: "EXPENSE" },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
      select: { id: true, name: true, icon: true, color: true, archivedAt: true },
    }),
    prisma.budget.findMany({
      where: { userId, month: start },
      select: { id: true, categoryId: true, amountCents: true },
    }),
    prisma.budget.findMany({
      where: { userId, month: previousStart },
      select: { categoryId: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", occurredOn: { gte: start, lt: end } },
      _sum: { amountCents: true },
    }),
  ]);

  const spentBy = new Map(
    spending.map((row) => [row.categoryId, row._sum.amountCents ?? 0]),
  );
  const budgetBy = new Map(budgets.map((b) => [b.categoryId, b]));

  const items: BudgetItem[] = [];
  const unbudgeted: BudgetCategory[] = [];
  const addable: BudgetCategory[] = [];

  for (const { archivedAt, ...c } of categories) {
    const category: BudgetCategory = {
      ...c,
      archived: archivedAt !== null,
      spentCents: spentBy.get(c.id) ?? 0,
    };
    const budget = budgetBy.get(c.id);
    if (budget) {
      items.push({ id: budget.id, amountCents: budget.amountCents, category });
      continue;
    }
    if (category.spentCents > 0) unbudgeted.push(category);
    if (!category.archived) addable.push(category);
  }

  const addableIds = new Set(addable.map((c) => c.id));
  const copyableCount = previousBudgets.filter((b) =>
    addableIds.has(b.categoryId),
  ).length;

  return {
    budgets: items,
    unbudgeted,
    uncategorisedCents: spentBy.get(null) ?? 0,
    addable,
    copyableCount,
  };
}
