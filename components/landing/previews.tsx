import { ArrowLeftRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  BUDGET_TEXT_CLASS,
  BudgetProgress,
  budgetStatus,
} from "@/components/budgets/budget-progress";
import { CategoryIcon } from "@/components/categories/category-icon";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { SpendingRow } from "@/components/dashboard/spending-row";
import { formatMonth, shiftMonth, type MonthKey } from "@/lib/dates";
import { formatPeso } from "@/lib/money";

// Previews of the app built from its real components, filled with sample
// data, so the landing page always matches what people get after signing up.

const peso = (pesos: number) => Math.round(pesos * 100);

/** A mock app window around a preview. */
export function PreviewFrame({
  label,
  caption,
  children,
  className = "",
}: {
  label: string;
  /** Describes the preview for screen readers. */
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xl shadow-black/5 ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5" aria-hidden>
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="ml-2 text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}

const SAMPLE_INCOME = [30000, 30000, 34500, 30000, 31200, 32000];
const SAMPLE_EXPENSES = [21800, 24350, 19900, 26100, 22750, 18420.5];

export function DashboardPreview({ month }: { month: MonthKey }) {
  const cashFlow = SAMPLE_INCOME.map((income, i) => ({
    month: shiftMonth(month, i - 5),
    incomeCents: peso(income),
    expenseCents: peso(SAMPLE_EXPENSES[i]),
  }));
  const stats = [
    { label: "Total balance", value: formatPeso(peso(48250)) },
    {
      label: "Income this month",
      value: formatPeso(peso(32000)),
      className: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Spent this month",
      value: formatPeso(peso(18420.5)),
      className: "text-destructive",
    },
  ];

  return (
    <PreviewFrame
      label="Dashboard"
      caption="Example dashboard with sample data: balance, this month's income and spending, and six months of income versus expenses."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`rounded-lg border p-2.5 sm:p-3 ${index === 0 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <div className="truncate text-[11px] text-muted-foreground sm:text-xs">
              {stat.label}
            </div>
            <div
              className={`truncate text-base font-semibold tabular-nums sm:text-lg ${stat.className ?? ""}`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-2 text-sm font-medium">Income vs expenses</div>
        <CashFlowChart data={cashFlow} />
      </div>
    </PreviewFrame>
  );
}

const SAMPLE_BUDGETS = [
  { name: "Food & Dining", icon: "utensils", color: "#f97316", spent: 4180, limit: 6000 },
  { name: "Transportation", icon: "bus", color: "#3b82f6", spent: 1720, limit: 2000 },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899", spent: 3450, limit: 3000 },
];

export function BudgetsPreview({ month }: { month: MonthKey }) {
  return (
    <PreviewFrame
      label={`Budgets · ${formatMonth(month)}`}
      caption="Example budgets: Food and Dining on track, Transportation nearly used up, Shopping over its limit."
    >
      <ul className="flex flex-col gap-5">
        {SAMPLE_BUDGETS.map((b) => {
          const spent = peso(b.spent);
          const limit = peso(b.limit);
          const status = budgetStatus(spent, limit);
          return (
            <li key={b.name} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={b.icon} color={b.color} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{b.name}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {formatPeso(spent)} of {formatPeso(limit)}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className={`font-semibold tabular-nums ${BUDGET_TEXT_CLASS[status]}`}>
                    {formatPeso(Math.abs(limit - spent))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {status === "over" ? "over" : "left"}
                  </span>
                </div>
              </div>
              <BudgetProgress name={b.name} spentCents={spent} amountCents={limit} />
            </li>
          );
        })}
      </ul>
    </PreviewFrame>
  );
}

type SampleRow = {
  title: string;
  details: string;
  amount: string;
  tone?: "income" | "muted";
  icon?: { name: string; color: string };
};

const SAMPLE_ACTIVITY: SampleRow[] = [
  {
    title: "Food & Dining",
    details: "GCash · Lunch with the team",
    amount: `−${formatPeso(peso(285))}`,
    icon: { name: "utensils", color: "#f97316" },
  },
  {
    title: "Transfer",
    details: "Cash → GoTyme",
    amount: formatPeso(peso(2000)),
    tone: "muted",
  },
  {
    title: "Load & Internet",
    details: "GCash · Prepaid load",
    amount: `−${formatPeso(peso(99))}`,
    icon: { name: "smartphone", color: "#06b6d4" },
  },
  {
    title: "Salary",
    details: "Payroll account",
    amount: `+${formatPeso(peso(16000))}`,
    tone: "income",
    icon: { name: "briefcase", color: "#22c55e" },
  },
  {
    title: "Transportation",
    details: "Cash · Jeep and MRT",
    amount: `−${formatPeso(peso(64))}`,
    icon: { name: "bus", color: "#3b82f6" },
  },
];

export function TransactionsPreview() {
  return (
    <PreviewFrame
      label="Transactions"
      caption="Example transactions: expenses paid from GCash and cash, a transfer from cash to a bank account, and a salary."
      className="[&>div:nth-child(2)]:p-0"
    >
      <ul className="divide-y">
        {SAMPLE_ACTIVITY.map((row) => (
          <li key={row.title + row.details} className="flex items-center gap-3 px-4 py-3">
            {row.icon ? (
              <CategoryIcon icon={row.icon.name} color={row.icon.color} />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ArrowLeftRightIcon className="size-5" />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{row.title}</span>
              <span className="truncate text-sm text-muted-foreground">{row.details}</span>
            </div>
            <span
              className={`shrink-0 font-semibold tabular-nums ${
                row.tone === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : row.tone === "muted"
                    ? "text-muted-foreground"
                    : ""
              }`}
            >
              {row.amount}
            </span>
          </li>
        ))}
      </ul>
    </PreviewFrame>
  );
}

const SAMPLE_SPENDING = [
  { name: "Food & Dining", icon: "utensils", color: "#f97316", pesos: 6240 },
  { name: "Bills & Utilities", icon: "receipt", color: "#f59e0b", pesos: 4850 },
  { name: "Transportation", icon: "bus", color: "#3b82f6", pesos: 2310 },
  { name: "Groceries", icon: "shopping-cart", color: "#84cc16", pesos: 1980.5 },
  { name: "Load & Internet", icon: "smartphone", color: "#06b6d4", pesos: 999 },
];

export function SpendingPreview({ month }: { month: MonthKey }) {
  const total = SAMPLE_SPENDING.reduce((sum, c) => sum + peso(c.pesos), 0);
  return (
    <PreviewFrame
      label="Spending by category"
      caption="Example breakdown of a month's spending by category, largest first."
    >
      <div className="mb-4 text-sm text-muted-foreground">
        {formatPeso(total)} in {formatMonth(month)}
      </div>
      <ul className="flex flex-col gap-4">
        {SAMPLE_SPENDING.map((c) => (
          <SpendingRow
            key={c.name}
            icon={<CategoryIcon icon={c.icon} color={c.color} className="size-8 [&_svg]:size-4" />}
            name={c.name}
            cents={peso(c.pesos)}
            total={total}
          />
        ))}
      </ul>
    </PreviewFrame>
  );
}
