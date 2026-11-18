import "server-only";

import { STARTER_CATEGORIES } from "@/lib/categories";
import { prisma } from "@/lib/db";
import type { TransactionType } from "@/lib/generated/prisma/enums";

export type CategoryWithUsage = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string | null;
  archived: boolean;
  transactionCount: number;
  budgetCount: number;
};

/**
 * Gives a user the starter categories if they have none yet.
 * Safe to call repeatedly or concurrently (duplicates are skipped).
 */
export async function ensureStarterCategories(userId: string) {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return;

  // 1 ms apart so they keep this order when sorted by createdAt.
  const start = Date.now();
  await prisma.category.createMany({
    data: STARTER_CATEGORIES.map((category, index) => ({
      ...category,
      userId,
      createdAt: new Date(start + index),
    })),
    skipDuplicates: true,
  });
}

/** All of a user's categories, creating the starter set on first use. */
export async function getCategories(
  userId: string,
): Promise<CategoryWithUsage[]> {
  await ensureStarterCategories(userId);

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    include: { _count: { select: { transactions: true, budgets: true } } },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    archived: category.archivedAt !== null,
    transactionCount: category._count.transactions,
    budgetCount: category._count.budgets,
  }));
}
