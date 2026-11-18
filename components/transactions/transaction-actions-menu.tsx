"use client";

import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteTransaction,
  deleteTransfer,
} from "@/app/(app)/transactions/actions";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
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
import type { ActivityItem } from "@/lib/data/transactions";
import { formatPeso } from "@/lib/money";

export function TransactionActionsMenu({ item }: { item: ActivityItem }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const noun =
    item.kind === "transfer"
      ? "transfer"
      : item.type === "INCOME"
        ? "income"
        : "expense";

  function confirmDelete() {
    startTransition(async () => {
      const result =
        item.kind === "transfer"
          ? await deleteTransfer(item.id)
          : await deleteTransaction(item.id);
      setDeleteOpen(false);
      if (result.ok) toast.success(`Deleted ${noun}`);
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
              aria-label={`Actions for this ${noun}`}
              disabled={pending}
            />
          }
        >
          <EllipsisVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Edit
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

      <TransactionFormDialog
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {formatPeso(item.amountCents)} {noun}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {item.kind === "transfer"
                ? `${item.fromAccountName} and ${item.toAccountName} balances will change back.`
                : `Your ${item.accountName} balance will change back.`}{" "}
              This can&apos;t be undone.
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
