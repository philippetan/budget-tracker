"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { isPrismaError, type ActionResult as Result } from "@/lib/actions";
import { requireUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  categoryFormSchema,
  type CategoryFormInput,
} from "@/lib/validations/category";

type ActionResult = Result<CategoryFormInput>;

const categoryId = z.uuid();
const notFound: ActionResult = { ok: false, message: "Category not found" };

function duplicateName(name: string, type: string): ActionResult {
  const kind = type === "INCOME" ? "income" : "expense";
  return {
    ok: false,
    fieldErrors: { name: [`You already have an ${kind} category named "${name}"`] },
  };
}

export async function createCategory(
  input: CategoryFormInput,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    await prisma.category.create({ data: { ...parsed.data, userId } });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return duplicateName(parsed.data.name, parsed.data.type);
    }
    throw error;
  }

  refresh();
  return { ok: true };
}

/** Updates name, icon and colour. The type (expense/income) can't change. */
export async function updateCategory(
  id: string,
  input: CategoryFormInput,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  if (!categoryId.safeParse(id).success) return notFound;

  const { name, icon, color } = parsed.data;
  try {
    const { count } = await prisma.category.updateMany({
      where: { id, userId },
      data: { name, icon, color },
    });
    if (count === 0) return notFound;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return duplicateName(name, parsed.data.type);
    }
    throw error;
  }

  refresh();
  return { ok: true };
}

export async function setCategoryArchived(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!categoryId.safeParse(id).success) return notFound;

  const { count } = await prisma.category.updateMany({
    where: { id, userId },
    data: { archivedAt: archived ? new Date() : null },
  });
  if (count === 0) return notFound;

  refresh();
  return { ok: true };
}

/**
 * Deletes a category. Its transactions become uncategorised and its budgets
 * are removed (both handled by the database's foreign keys).
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!categoryId.safeParse(id).success) return notFound;

  const { count } = await prisma.category.deleteMany({ where: { id, userId } });
  if (count === 0) return notFound;

  refresh();
  return { ok: true };
}
