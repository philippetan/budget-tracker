import { ArrowLeftRightIcon } from "lucide-react";

import { CategoryIcon } from "@/components/categories/category-icon";
import { TransactionActionsMenu } from "@/components/transactions/transaction-actions-menu";
import type { ActivityItem } from "@/lib/data/transactions";
import { formatPeso } from "@/lib/money";

/**
 * One transaction or transfer as a list row, with its Edit/Delete menu.
 * Needs `TransactionFormOptionsProvider` above it.
 */
export function ActivityRow({
  item,
  showDate,
}: {
  item: ActivityItem;
  /** Adds the date to the second line (for lists not grouped by day). */
  showDate?: boolean;
}) {
  const isTransfer = item.kind === "transfer";
  const title = isTransfer
    ? "Transfer"
    : (item.category?.name ?? "Uncategorised");
  const details = [
    showDate ? formatShortDate(item.occurredOn) : null,
    isTransfer
      ? `${item.fromAccountName} → ${item.toAccountName}`
      : item.accountName,
    item.note,
  ]
    .filter(Boolean)
    .join(" · ");

  const amount = isTransfer
    ? formatPeso(item.amountCents)
    : `${item.type === "INCOME" ? "+" : "−"}${formatPeso(item.amountCents)}`;
  const amountClass = isTransfer
    ? "text-muted-foreground"
    : item.type === "INCOME"
      ? "text-emerald-600 dark:text-emerald-400"
      : "";

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {isTransfer ? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ArrowLeftRightIcon className="size-5" />
        </div>
      ) : (
        <CategoryIcon
          icon={item.category?.icon ?? "tag"}
          color={item.category?.color ?? null}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{title}</span>
        <span className="truncate text-sm text-muted-foreground">{details}</span>
      </div>
      <span className={`shrink-0 font-semibold tabular-nums ${amountClass}`}>
        {amount}
      </span>
      <TransactionActionsMenu item={item} />
    </li>
  );
}

/** "2026-11-19" -> "Nov 19" */
function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
