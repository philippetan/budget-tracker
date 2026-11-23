"use client";

import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { saveBudget } from "@/app/(app)/budgets/actions";
import { CategoryIcon } from "@/components/categories/category-icon";
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
import type { BudgetCategory } from "@/lib/data/budgets";
import { formatMonth, type MonthKey } from "@/lib/dates";
import { centsToInput, formatPeso } from "@/lib/money";
import {
  budgetFormSchema,
  type BudgetFieldErrors,
  type BudgetFormInput,
} from "@/lib/validations/budget";

type BudgetFormDialogProps = {
  month: MonthKey;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Categories to choose from when adding a budget. */
  categories?: BudgetCategory[];
  /** A fixed category (when editing, or setting a budget for one category). */
  category?: BudgetCategory;
  /** The current amount, when editing an existing budget. */
  amountCents?: number;
};

export function BudgetFormDialog({
  month,
  trigger,
  open: openProp,
  onOpenChange,
  categories = [],
  category,
  amountCents,
}: BudgetFormDialogProps) {
  const isEdit = amountCents !== undefined;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [values, setValues] = useState<BudgetFormInput>(initialValues);
  const [errors, setErrors] = useState<BudgetFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function initialValues(): BudgetFormInput {
    return {
      categoryId: category?.id ?? "",
      month,
      amount: amountCents !== undefined ? centsToInput(amountCents) : "",
    };
  }

  function setOpen(next: boolean) {
    if (next) {
      setValues(initialValues());
      setErrors({});
      setFormError(undefined);
    }
    setOpenState(next);
    onOpenChange?.(next);
  }

  function update<K extends keyof BudgetFormInput>(
    key: K,
    value: BudgetFormInput[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = budgetFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    startTransition(async () => {
      const result = await saveBudget(values);
      if (result.ok) {
        toast.success(isEdit ? "Budget updated" : "Budget set");
        setOpen(false);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    });
  }

  const toErrors = (messages?: string[]) =>
    messages?.map((message) => ({ message }));

  const selected =
    category ?? categories.find((c) => c.id === values.categoryId);
  const monthName = formatMonth(month);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit budget" : "Set a budget"}</DialogTitle>
            <DialogDescription>
              How much do you want to spend
              {category ? ` on ${category.name}` : ""} in {monthName}?
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-6">
            {category ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <CategoryIcon icon={category.icon} color={category.color} />
                <span className="truncate font-medium">{category.name}</span>
              </div>
            ) : (
              <Field data-invalid={Boolean(errors.categoryId)}>
                <FieldLabel htmlFor="budget-category">Category</FieldLabel>
                <Select
                  value={values.categoryId || null}
                  onValueChange={(next) =>
                    update("categoryId", (next as string | null) ?? "")
                  }
                >
                  <SelectTrigger
                    id="budget-category"
                    className="w-full"
                    aria-invalid={Boolean(errors.categoryId)}
                  >
                    <SelectValue placeholder="Choose a category">
                      {(id: string | null) =>
                        categories.find((c) => c.id === id)?.name ??
                        "Choose a category"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <CategoryIcon
                          icon={c.icon}
                          color={c.color}
                          className="size-6 [&_svg]:size-3.5"
                        />
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={toErrors(errors.categoryId)} />
              </Field>
            )}

            <Field data-invalid={Boolean(errors.amount)}>
              <FieldLabel htmlFor="budget-amount">Monthly limit</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>₱</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="budget-amount"
                  value={values.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  autoComplete="off"
                  autoFocus={Boolean(category)}
                  aria-invalid={Boolean(errors.amount)}
                />
              </InputGroup>
              {selected ? (
                <FieldDescription>
                  Spent so far in {monthName}: {formatPeso(selected.spentCents)}
                </FieldDescription>
              ) : null}
              <FieldError errors={toErrors(errors.amount)} />
            </Field>

            {formError || errors.month ? (
              <p role="alert" className="text-sm text-destructive">
                {formError ?? errors.month?.[0]}
              </p>
            ) : null}
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Set budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
