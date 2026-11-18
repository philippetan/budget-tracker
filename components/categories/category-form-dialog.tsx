"use client";

import { CheckIcon } from "lucide-react";
import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  createCategory,
  updateCategory,
} from "@/app/(app)/categories/actions";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_NAMES,
  CATEGORY_ICONS,
  TRANSACTION_TYPES,
  type CategoryIconName,
} from "@/lib/categories";
import {
  categoryFormSchema,
  type CategoryFieldErrors,
  type CategoryFormInput,
} from "@/lib/validations/category";

type CategoryFormDialogProps = {
  trigger?: ReactElement;
  /** Pass a category to edit it; omit to create one. */
  category?: { id: string } & CategoryFormInput;
  /** Type preselected when creating (e.g. from the Income tab). */
  defaultType?: CategoryFormInput["type"];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function emptyValues(type: CategoryFormInput["type"]): CategoryFormInput {
  return { name: "", type, icon: "tag", color: "#64748b" };
}

export function CategoryFormDialog({
  trigger,
  category,
  defaultType = "EXPENSE",
  open: openProp,
  onOpenChange,
}: CategoryFormDialogProps) {
  const isEdit = Boolean(category);
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [values, setValues] = useState<CategoryFormInput>(
    category ?? emptyValues(defaultType),
  );
  const [errors, setErrors] = useState<CategoryFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function setOpen(next: boolean) {
    if (next) {
      setValues(category ?? emptyValues(defaultType));
      setErrors({});
      setFormError(undefined);
    }
    setOpenState(next);
    onOpenChange?.(next);
  }

  function update<K extends keyof CategoryFormInput>(
    key: K,
    value: CategoryFormInput[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = categoryFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, values)
        : await createCategory(values);
      if (result.ok) {
        toast.success(isEdit ? "Category updated" : "Category added");
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit category" : "Add category"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Change this category's name, icon or colour."
                : "Create a category to group your income or expenses."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-6">
            {/* Preview of how the category will look */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <CategoryIcon icon={values.icon} color={values.color} />
              <span className="truncate font-medium">
                {values.name.trim() || "Category name"}
              </span>
            </div>

            {/* Type can only be chosen when creating */}
            {!isEdit ? (
              <Field>
                <FieldLabel>Type</FieldLabel>
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                  {TRANSACTION_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      role="radio"
                      aria-checked={values.type === type.value}
                      variant={
                        values.type === type.value ? "default" : "outline"
                      }
                      onClick={() => update("type", type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </Field>
            ) : null}

            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="category-name">Name</FieldLabel>
              <Input
                id="category-name"
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder={
                  values.type === "INCOME" ? "e.g. Side hustle" : "e.g. Pets"
                }
                maxLength={50}
                autoComplete="off"
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError errors={toErrors(errors.name)} />
            </Field>

            <Field data-invalid={Boolean(errors.icon)}>
              <FieldLabel id="category-icon-label">Icon</FieldLabel>
              <div
                role="radiogroup"
                aria-labelledby="category-icon-label"
                className="grid grid-cols-8 gap-1.5"
              >
                {CATEGORY_ICON_NAMES.map((name) => (
                  <IconOption
                    key={name}
                    name={name}
                    selected={values.icon === name}
                    color={values.color}
                    onSelect={() => update("icon", name)}
                  />
                ))}
              </div>
              <FieldError errors={toErrors(errors.icon)} />
            </Field>

            <Field data-invalid={Boolean(errors.color)}>
              <FieldLabel id="category-color-label">Colour</FieldLabel>
              <div
                role="radiogroup"
                aria-labelledby="category-color-label"
                className="flex flex-wrap gap-2"
              >
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={values.color === color}
                    aria-label={`Colour ${color}`}
                    onClick={() => update("color", color)}
                    className="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground"
                    style={{ backgroundColor: color }}
                  >
                    {values.color === color ? (
                      <CheckIcon className="size-4 text-white" />
                    ) : null}
                  </button>
                ))}
              </div>
              <FieldError errors={toErrors(errors.color)} />
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
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IconOption({
  name,
  selected,
  color,
  onSelect,
}: {
  name: CategoryIconName;
  selected: boolean;
  color: string;
  onSelect: () => void;
}) {
  const Icon = CATEGORY_ICONS[name];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={name.replace(/-/g, " ")}
      title={name.replace(/-/g, " ")}
      onClick={onSelect}
      className="flex aspect-square items-center justify-center rounded-md border border-transparent text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-checked:border-current"
      style={selected ? { color, backgroundColor: `${color}26` } : undefined}
    >
      <Icon className="size-5" />
    </button>
  );
}
