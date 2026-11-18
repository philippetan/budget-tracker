"use client";

import Link from "next/link";
import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  createTransaction,
  createTransfer,
  updateTransaction,
  updateTransfer,
} from "@/app/(app)/transactions/actions";
import { CategoryIcon } from "@/components/categories/category-icon";
import { useTransactionFormOptions } from "@/components/transactions/form-options";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { accountTypeInfo } from "@/lib/accounts";
import type {
  ActivityItem,
  FormAccount,
  FormCategory,
} from "@/lib/data/transactions";
import { todayISO } from "@/lib/dates";
import { centsToInput } from "@/lib/money";
import {
  transactionFormSchema,
  transferFormSchema,
} from "@/lib/validations/transaction";
import { useTransactionFormStore } from "@/stores/transaction-form-store";

export type Mode = "EXPENSE" | "INCOME" | "TRANSFER";

const MODES: { value: Mode; label: string }[] = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfer" },
];

type Values = {
  amount: string;
  accountId: string;
  categoryId: string;
  fromAccountId: string;
  toAccountId: string;
  occurredOn: string;
  note: string;
};

type Errors = Partial<Record<keyof Values, string[]>>;

type TransactionFormDialogProps = {
  trigger?: ReactElement;
  /** An existing transaction or transfer to edit. */
  item?: ActivityItem;
  defaultMode?: Mode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function TransactionFormDialog({
  trigger,
  item,
  defaultMode = "EXPENSE",
  open: openProp,
  onOpenChange,
}: TransactionFormDialogProps) {
  const { accounts, categories } = useTransactionFormOptions();
  const lastAccountId = useTransactionFormStore((s) => s.lastAccountId);
  const lastTransfer = useTransactionFormStore((s) => s.lastTransfer);
  const rememberAccount = useTransactionFormStore((s) => s.rememberAccount);
  const rememberTransfer = useTransactionFormStore((s) => s.rememberTransfer);

  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [values, setValues] = useState<Values>(() => blankValues());
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const isEdit = Boolean(item);
  const activeAccounts = accounts.filter((a) => !a.archived);

  // Archived accounts/categories are only offered if this entry already uses them.
  const keepIds = new Set<string>(
    item?.kind === "transaction"
      ? [item.accountId, item.categoryId ?? ""]
      : item?.kind === "transfer"
        ? [item.fromAccountId, item.toAccountId]
        : [],
  );
  const accountOptions = accounts.filter(
    (a) => !a.archived || keepIds.has(a.id),
  );
  const categoryOptions = categories.filter(
    (c) => c.type === mode && (!c.archived || keepIds.has(c.id)),
  );

  function defaultAccount(type: "EXPENSE" | "INCOME") {
    const remembered = lastAccountId[type];
    return activeAccounts.some((a) => a.id === remembered)
      ? remembered!
      : (activeAccounts[0]?.id ?? "");
  }

  function initialState(): { mode: Mode; values: Values } {
    if (item?.kind === "transaction") {
      return {
        mode: item.type,
        values: {
          ...blankValues(),
          amount: centsToInput(item.amountCents),
          accountId: item.accountId,
          categoryId: item.categoryId ?? "",
          occurredOn: item.occurredOn,
          note: item.note ?? "",
        },
      };
    }
    if (item?.kind === "transfer") {
      return {
        mode: "TRANSFER",
        values: {
          ...blankValues(),
          amount: centsToInput(item.amountCents),
          fromAccountId: item.fromAccountId,
          toAccountId: item.toAccountId,
          occurredOn: item.occurredOn,
          note: item.note ?? "",
        },
      };
    }

    const isActive = (id?: string) => activeAccounts.some((a) => a.id === id);
    const rememberedTransfer =
      lastTransfer &&
      isActive(lastTransfer.fromAccountId) &&
      isActive(lastTransfer.toAccountId)
        ? lastTransfer
        : null;

    return {
      mode: defaultMode,
      values: {
        ...blankValues(todayISO()),
        accountId: defaultAccount(defaultMode === "INCOME" ? "INCOME" : "EXPENSE"),
        fromAccountId:
          rememberedTransfer?.fromAccountId ?? activeAccounts[0]?.id ?? "",
        toAccountId:
          rememberedTransfer?.toAccountId ?? activeAccounts[1]?.id ?? "",
      },
    };
  }

  function setOpen(next: boolean) {
    if (next) {
      const initial = initialState();
      setMode(initial.mode);
      setValues(initial.values);
      setErrors({});
      setFormError(undefined);
    }
    setOpenState(next);
    onOpenChange?.(next);
  }

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function changeMode(next: Mode) {
    setMode(next);
    setErrors({});
    if (next === "TRANSFER") return;
    setValues((v) => {
      // Drop a category that belongs to the other type.
      const category = categories.find((c) => c.id === v.categoryId);
      return {
        ...v,
        categoryId: category && category.type !== next ? "" : v.categoryId,
        accountId: v.accountId || defaultAccount(next),
      };
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    if (mode === "TRANSFER") {
      const input = {
        amount: values.amount,
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        occurredOn: values.occurredOn,
        note: values.note,
      };
      const parsed = transferFormSchema.safeParse(input);
      if (!parsed.success) {
        setErrors(z.flattenError(parsed.error).fieldErrors);
        return;
      }
      startTransition(async () => {
        const result =
          item?.kind === "transfer"
            ? await updateTransfer(item.id, input)
            : await createTransfer(input);
        if (result.ok) {
          rememberTransfer(input.fromAccountId, input.toAccountId);
          toast.success(isEdit ? "Transfer updated" : "Transfer added");
          setOpen(false);
        } else {
          setErrors(result.fieldErrors ?? {});
          setFormError(result.message);
        }
      });
      return;
    }

    const input = {
      type: mode,
      amount: values.amount,
      accountId: values.accountId,
      categoryId: values.categoryId,
      occurredOn: values.occurredOn,
      note: values.note,
    };
    const parsed = transactionFormSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    startTransition(async () => {
      const result =
        item?.kind === "transaction"
          ? await updateTransaction(item.id, input)
          : await createTransaction(input);
      if (result.ok) {
        rememberAccount(mode, input.accountId);
        const noun = mode === "INCOME" ? "Income" : "Expense";
        toast.success(isEdit ? `${noun} updated` : `${noun} added`);
        setOpen(false);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    });
  }

  const toErrors = (messages?: string[]) =>
    messages?.map((message) => ({ message }));

  // Which modes can be picked: all when adding; expense/income when editing a
  // transaction; a transfer stays a transfer.
  const availableModes =
    item?.kind === "transfer"
      ? MODES.filter((m) => m.value === "TRANSFER")
      : item?.kind === "transaction"
        ? MODES.filter((m) => m.value !== "TRANSFER")
        : MODES;

  const title = isEdit
    ? `Edit ${mode === "TRANSFER" ? "transfer" : mode === "INCOME" ? "income" : "expense"}`
    : "Add transaction";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        {activeAccounts.length === 0 && !isEdit ? (
          <NoAccounts />
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {mode === "TRANSFER"
                  ? "Move money between your own accounts. Transfers don't count as income or spending."
                  : mode === "INCOME"
                    ? "Record money you received."
                    : "Record money you spent."}
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-6">
              {availableModes.length > 1 ? (
                <div
                  role="radiogroup"
                  aria-label="Type"
                  className={`grid gap-2 ${availableModes.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
                >
                  {availableModes.map((m) => (
                    <Button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={mode === m.value}
                      variant={mode === m.value ? "default" : "outline"}
                      onClick={() => changeMode(m.value)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              ) : null}

              {mode === "TRANSFER" && activeAccounts.length < 2 && !isEdit ? (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  You need at least two accounts to make a transfer.{" "}
                  <Link href="/accounts" className="underline">
                    Add another account
                  </Link>
                  .
                </p>
              ) : null}

              <Field data-invalid={Boolean(errors.amount)}>
                <FieldLabel htmlFor="tx-amount">Amount</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>₱</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="tx-amount"
                    value={values.amount}
                    onChange={(e) => update("amount", e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    autoComplete="off"
                    autoFocus
                    aria-invalid={Boolean(errors.amount)}
                  />
                </InputGroup>
                <FieldError errors={toErrors(errors.amount)} />
              </Field>

              {mode === "TRANSFER" ? (
                <>
                  <Field data-invalid={Boolean(errors.fromAccountId)}>
                    <FieldLabel htmlFor="tx-from">From</FieldLabel>
                    <AccountSelect
                      id="tx-from"
                      accounts={accountOptions}
                      value={values.fromAccountId}
                      onChange={(id) => update("fromAccountId", id)}
                    />
                    <FieldError errors={toErrors(errors.fromAccountId)} />
                  </Field>
                  <Field data-invalid={Boolean(errors.toAccountId)}>
                    <FieldLabel htmlFor="tx-to">To</FieldLabel>
                    <AccountSelect
                      id="tx-to"
                      accounts={accountOptions}
                      value={values.toAccountId}
                      onChange={(id) => update("toAccountId", id)}
                    />
                    <FieldError errors={toErrors(errors.toAccountId)} />
                  </Field>
                </>
              ) : (
                <>
                  <Field data-invalid={Boolean(errors.accountId)}>
                    <FieldLabel htmlFor="tx-account">
                      {mode === "INCOME" ? "Received in" : "Paid from"}
                    </FieldLabel>
                    <AccountSelect
                      id="tx-account"
                      accounts={accountOptions}
                      value={values.accountId}
                      onChange={(id) => update("accountId", id)}
                    />
                    <FieldError errors={toErrors(errors.accountId)} />
                  </Field>
                  <Field data-invalid={Boolean(errors.categoryId)}>
                    <FieldLabel htmlFor="tx-category">Category</FieldLabel>
                    <CategorySelect
                      id="tx-category"
                      categories={categoryOptions}
                      value={values.categoryId}
                      onChange={(id) => update("categoryId", id)}
                    />
                    <FieldError errors={toErrors(errors.categoryId)} />
                  </Field>
                </>
              )}

              <Field data-invalid={Boolean(errors.occurredOn)}>
                <FieldLabel htmlFor="tx-date">Date</FieldLabel>
                <Input
                  id="tx-date"
                  type="date"
                  value={values.occurredOn}
                  onChange={(e) => update("occurredOn", e.target.value)}
                  aria-invalid={Boolean(errors.occurredOn)}
                />
                <FieldError errors={toErrors(errors.occurredOn)} />
              </Field>

              <Field data-invalid={Boolean(errors.note)}>
                <FieldLabel htmlFor="tx-note">Note (optional)</FieldLabel>
                <Textarea
                  id="tx-note"
                  value={values.note}
                  onChange={(e) => update("note", e.target.value)}
                  placeholder={
                    mode === "TRANSFER" ? "e.g. Savings for the month" : "e.g. Lunch"
                  }
                  maxLength={500}
                  rows={2}
                  aria-invalid={Boolean(errors.note)}
                />
                <FieldError errors={toErrors(errors.note)} />
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
                {pending ? "Saving…" : isEdit ? "Save changes" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Empty form. The date is only filled in when the dialog opens (not during render). */
function blankValues(occurredOn = ""): Values {
  return {
    amount: "",
    accountId: "",
    categoryId: "",
    fromAccountId: "",
    toAccountId: "",
    occurredOn,
    note: "",
  };
}

function AccountSelect({
  id,
  accounts,
  value,
  onChange,
}: {
  id: string;
  accounts: FormAccount[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(next) => onChange((next as string | null) ?? "")}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Choose an account">
          {(selected: string | null) =>
            accounts.find((a) => a.id === selected)?.name ?? "Choose an account"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => {
          const Icon = accountTypeInfo(account.type).icon;
          return (
            <SelectItem key={account.id} value={account.id}>
              <Icon />
              {account.name}
              {account.archived ? " (archived)" : ""}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

const NO_CATEGORY = "none";

function CategorySelect({
  id,
  categories,
  value,
  onChange,
}: {
  id: string;
  categories: FormCategory[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <Select
      value={value || NO_CATEGORY}
      onValueChange={(next) =>
        onChange(!next || next === NO_CATEGORY ? "" : (next as string))
      }
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue>
          {(selected: string) =>
            categories.find((c) => c.id === selected)?.name ?? "No category"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_CATEGORY}>No category</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <CategoryIcon
              icon={category.icon}
              color={category.color}
              className="size-6 [&_svg]:size-3.5"
            />
            {category.name}
            {category.archived ? " (archived)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NoAccounts() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Add an account first</DialogTitle>
        <DialogDescription>
          Every transaction belongs to an account, like Cash or GoTyme. Add one
          to start recording.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="pt-6">
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button nativeButton={false} render={<Link href="/accounts" />}>
          Go to Accounts
        </Button>
      </DialogFooter>
    </>
  );
}
