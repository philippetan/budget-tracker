"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteCategory,
  setCategoryArchived,
} from "@/app/(app)/categories/actions";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_NAMES,
  DEFAULT_CATEGORY_COLOR,
} from "@/lib/categories";
import type { CategoryWithUsage } from "@/lib/data/categories";
import type { CategoryFormInput } from "@/lib/validations/category";

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** What deleting this category will do, in plain words. */
function deleteConsequences(category: CategoryWithUsage) {
  const parts: string[] = [];
  if (category.transactionCount > 0) {
    parts.push(
      `${plural(category.transactionCount, "transaction")} will become uncategorised`,
    );
  }
  if (category.budgetCount > 0) {
    parts.push(`${plural(category.budgetCount, "budget")} will be deleted`);
  }
  return parts.length > 0 ? `${parts.join(" and ")}. ` : "";
}

export function CategoryActionsMenu({
  category,
}: {
  category: CategoryWithUsage;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Values saved before the picker existed fall back to valid defaults.
  const formValues: CategoryFormInput = {
    name: category.name,
    type: category.type,
    icon: (CATEGORY_ICON_NAMES as readonly string[]).includes(category.icon)
      ? (category.icon as CategoryFormInput["icon"])
      : "tag",
    color: (CATEGORY_COLORS as readonly string[]).includes(category.color ?? "")
      ? (category.color as CategoryFormInput["color"])
      : DEFAULT_CATEGORY_COLOR,
  };

  function toggleArchived() {
    startTransition(async () => {
      const result = await setCategoryArchived(
        category.id,
        !category.archived,
      );
      if (result.ok) {
        toast.success(
          category.archived ? "Category restored" : "Category archived",
        );
      } else {
        toast.error(result.message ?? "Something went wrong");
      }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      setDeleteOpen(false);
      if (result.ok) toast.success("Category deleted");
      else toast.error(result.message ?? "Something went wrong");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${category.name}`}
              disabled={pending}
            />
          }
        >
          <EllipsisVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleArchived}>
            {category.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
            {category.archived ? "Restore" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        category={{ id: category.id, ...formValues }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConsequences(category)}This can&apos;t be undone.
              {category.transactionCount > 0
                ? " To hide it but keep your history as it is, archive it instead."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
