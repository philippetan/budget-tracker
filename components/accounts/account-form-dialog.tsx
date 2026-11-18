"use client";

import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  createAccount,
  updateAccount,
} from "@/app/(app)/accounts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_TYPES } from "@/lib/accounts";
import type { AccountType } from "@/lib/generated/prisma/enums";
import {
  accountFormSchema,
  type AccountFormInput,
  type FieldErrors,
} from "@/lib/validations/account";

type AccountFormDialogProps = {
  /** The button that opens the dialog. */
  trigger?: ReactElement;
  /** Pass an account to edit it; omit to create a new one. */
  account?: { id: string } & AccountFormInput;
  /** Controlled open state (used when opened from a menu). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const EMPTY: AccountFormInput = { name: "", type: "CASH", initialBalance: "" };

export function AccountFormDialog({
  trigger,
  account,
  open: openProp,
  onOpenChange,
}: AccountFormDialogProps) {
  const isEdit = Boolean(account);
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [values, setValues] = useState<AccountFormInput>(account ?? EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function setOpen(next: boolean) {
    if (next) {
      // Start from the account's current values every time the dialog opens.
      setValues(account ?? EMPTY);
      setErrors({});
      setFormError(undefined);
    }
    setOpenState(next);
    onOpenChange?.(next);
  }

  function update<K extends keyof AccountFormInput>(
    key: K,
    value: AccountFormInput[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Same schema the server uses, so most mistakes show up instantly.
    const parsed = accountFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    startTransition(async () => {
      const result = account
        ? await updateAccount(account.id, values)
        : await createAccount(values);
      if (result.ok) {
        toast.success(isEdit ? "Account updated" : "Account added");
        setOpen(false);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    });
  }

  const toErrors = (messages?: string[]) =>
    messages?.map((message) => ({ message }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit account" : "Add account"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Change this account's details."
                : "Add a wallet, bank account or e-wallet you want to track."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-6">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="account-name">Name</FieldLabel>
              <Input
                id="account-name"
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. GoTyme"
                maxLength={100}
                autoComplete="off"
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError errors={toErrors(errors.name)} />
            </Field>

            <Field data-invalid={Boolean(errors.type)}>
              <FieldLabel htmlFor="account-type">Type</FieldLabel>
              <Select
                items={ACCOUNT_TYPES}
                value={values.type}
                onValueChange={(value) =>
                  value && update("type", value as AccountType)
                }
              >
                <SelectTrigger id="account-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <type.icon />
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={toErrors(errors.type)} />
            </Field>

            <Field data-invalid={Boolean(errors.initialBalance)}>
              <FieldLabel htmlFor="account-balance">
                {isEdit ? "Opening balance" : "Current balance"}
              </FieldLabel>
              <Input
                id="account-balance"
                value={values.initialBalance}
                onChange={(e) => update("initialBalance", e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(errors.initialBalance)}
              />
              <FieldDescription>
                {isEdit
                  ? "The balance before any transactions were recorded."
                  : "How much is in this account right now, in pesos. Use a minus sign for credit card debt."}
              </FieldDescription>
              <FieldError errors={toErrors(errors.initialBalance)} />
            </Field>

            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            ) : null}
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
