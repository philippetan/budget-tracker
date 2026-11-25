import type { ReactNode } from "react";

import { formatPeso } from "@/lib/money";

/** One category's spending: name, amount, share of the total and a bar. */
export function SpendingRow({
  icon,
  name,
  cents,
  total,
}: {
  icon: ReactNode;
  name: string;
  cents: number;
  total: number;
}) {
  const share = cents / total;
  return (
    <li className="flex items-center gap-3">
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate font-medium">{name}</span>
          <span className="shrink-0 tabular-nums">
            {formatPeso(cents)}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {Math.round(share * 100)}%
            </span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-chart-expense"
            style={{ width: `${Math.max(share * 100, 1)}%` }}
          />
        </div>
      </div>
    </li>
  );
}
