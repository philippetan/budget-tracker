import { Progress } from "@/components/ui/progress";

// A budget turns amber once this share of it is spent, and red when it's over.
const WARN_AT = 0.8;

export type BudgetStatus = "ok" | "warn" | "over";

export function budgetStatus(spentCents: number, amountCents: number): BudgetStatus {
  if (spentCents > amountCents) return "over";
  return spentCents / amountCents >= WARN_AT ? "warn" : "ok";
}

/** Text colour for the amount left/over. */
export const BUDGET_TEXT_CLASS: Record<BudgetStatus, string> = {
  ok: "",
  warn: "text-amber-600 dark:text-amber-400",
  over: "text-destructive",
};

const INDICATOR_CLASS: Record<BudgetStatus, string> = {
  ok: "",
  warn: "[&_[data-slot=progress-indicator]]:bg-amber-500",
  over: "[&_[data-slot=progress-indicator]]:bg-destructive",
};

/** How much of a budget is spent, as a bar that turns amber, then red. */
export function BudgetProgress({
  name,
  spentCents,
  amountCents,
  className = "",
}: {
  name: string;
  spentCents: number;
  amountCents: number;
  className?: string;
}) {
  const ratio = spentCents / amountCents;
  const status = budgetStatus(spentCents, amountCents);
  return (
    <Progress
      value={Math.min(ratio, 1) * 100}
      aria-label={`${name}: ${Math.round(ratio * 100)}% of budget spent`}
      className={`[&_[data-slot=progress-track]]:h-2 ${INDICATOR_CLASS[status]} ${className}`}
    />
  );
}
