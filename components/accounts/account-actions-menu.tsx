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
  deleteAccount,
  setAccountArchived,
} from "@/app/(app)/accounts/actions";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
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
import type { AccountWithBalance } from "@/lib/data/accounts";
import { centsToInput } from "@/lib/money";

export function AccountActionsMenu({
  account,
}: {
  account: AccountWithBalance;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleArchived() {
    startTransition(async () => {
      const result = await setAccountArchived(account.id, !account.archived);
      if (result.ok) {
        toast.success(
          account.archived ? "Account restored" : "Account archived",
        );
      } else {
        toast.error(result.message ?? "Something went wrong");
      }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteAccount(account.id);
      if (result.ok) {
        toast.success("Account deleted");
        setDeleteOpen(false);
      } else {
        toast.error(result.message ?? "Something went wrong");
        setDeleteOpen(false);
      }
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
              aria-label={`Actions for ${account.name}`}
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
            {account.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
            {account.archived ? "Restore" : "Archive"}
          </DropdownMenuItem>
          {/* Accounts with history can only be archived, not deleted. */}
          {!account.hasActivity ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        account={{
          id: account.id,
          name: account.name,
          type: account.type,
          initialBalance: centsToInput(account.initialBalanceCents),
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {account.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account. This can&apos;t be undone.
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
