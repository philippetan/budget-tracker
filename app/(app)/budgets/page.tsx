import { PiggyBankIcon, PlusIcon } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";

import { MonthNav } from "@/components/app-shell/month-nav";
import { PageHeader } from "@/components/app-shell/page-header";
import { BudgetActionsMenu } from "@/components/budgets/budget-actions-menu";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import {
  BUDGET_TEXT_CLASS,
  BudgetProgress,
  budgetStatus,
} from "@/components/budgets/budget-progress";
import { CopyBudgetsButton } from "@/components/budgets/copy-budgets-button";
import { CategoryIcon } from "@/components/categories/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUserId } from "@/lib/auth/session";
import {
  getMonthBudgets,
  type BudgetCategory,
  type BudgetItem,
} from "@/lib/data/budgets";
import {
  currentMonth,
  formatMonth,
  parseMonth,
  todayISO,
  type MonthKey,
} from "@/lib/dates";
import { formatPeso } from "@/lib/money";

export default function BudgetsPage({ searchParams }: PageProps<"/budgets">) {
  return (
    <>
      <PageHeader
        title="Budgets"
        description="Set monthly spending limits for each category."
      />
      <Suspense fallback={<BudgetsSkeleton />}>
        <BudgetsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BudgetsContent({
  searchParams,
}: {
  searchParams: PageProps<"/budgets">["searchParams"];
}) {
  await connection();
  const userId = await requireUserId();
  const params = await searchParams;
  const month = parseMonth(
    typeof params.month === "string" ? params.month : undefined,
  );

  const data = await getMonthBudgets(userId, month);
  const hasBudgets = data.budgets.length > 0;

  const addButton = (variant: "default" | "outline" = "default") =>
    data.addable.length > 0 ? (
      <BudgetFormDialog
        month={month}
        categories={data.addable}
        trigger={
          <Button variant={variant}>
            <PlusIcon />
            Set a budget
          </Button>
        }
      />
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNav month={month} hrefFor={href} />
        {hasBudgets ? (
          <div className="flex flex-wrap gap-2">
            {data.copyableCount > 0 ? (
              <CopyBudgetsButton month={month} count={data.copyableCount} />
            ) : null}
            {addButton()}
          </div>
        ) : null}
      </div>

      {hasBudgets ? (
        <>
          <Summary month={month} budgets={data.budgets} />
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {data.budgets.map((budget) => (
                <BudgetRow key={budget.id} budget={budget} month={month} />
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <EmptyState month={month}>
          {data.copyableCount > 0 ? (
            <CopyBudgetsButton
              month={month}
              count={data.copyableCount}
              variant="default"
            />
          ) : null}
          {addButton(data.copyableCount > 0 ? "outline" : "default")}
        </EmptyState>
      )}

      {data.unbudgeted.length > 0 || data.uncategorisedCents > 0 ? (
        <Unbudgeted
          month={month}
          categories={data.unbudgeted}
          uncategorisedCents={data.uncategorisedCents}
        />
      ) : null}
    </div>
  );
}

function href(month: MonthKey) {
  return month === currentMonth() ? "/budgets" : `/budgets?month=${month}`;
}

/** Days left in the month, counting today. Null if it isn't this month. */
function daysLeft(month: MonthKey): number | null {
  if (month !== currentMonth()) return null;
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return daysInMonth - Number(todayISO().slice(8, 10)) + 1;
}

function Summary({ month, budgets }: { month: MonthKey; budgets: BudgetItem[] }) {
  const budgeted = budgets.reduce((sum, b) => sum + b.amountCents, 0);
  const spent = budgets.reduce((sum, b) => sum + b.category.spentCents, 0);
  const left = budgeted - spent;
  const days = daysLeft(month);

  let leftNote: string | undefined;
  if (days !== null && left > 0) {
    leftNote = `About ${formatPeso(Math.floor(left / days))} a day for ${days} day${days === 1 ? "" : "s"}`;
  } else if (days !== null) {
    leftNote = `${days} day${days === 1 ? "" : "s"} left this month`;
  }

  const stats = [
    { label: "Budgeted", value: formatPeso(budgeted) },
    {
      label: "Spent",
      value: formatPeso(spent),
      note: "In budgeted categories",
    },
    {
      label: left < 0 ? "Over budget" : "Left to spend",
      value: formatPeso(Math.abs(left)),
      className: left < 0 ? "text-destructive" : "",
      note: leftNote,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="py-4">
          <CardContent className="flex flex-col gap-1 px-4">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span
              className={`text-2xl font-semibold tabular-nums ${stat.className ?? ""}`}
            >
              {stat.value}
            </span>
            {stat.note ? (
              <span className="text-xs text-muted-foreground">{stat.note}</span>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BudgetRow({ budget, month }: { budget: BudgetItem; month: MonthKey }) {
  const { category, amountCents } = budget;
  const spent = category.spentCents;
  const status = budgetStatus(spent, amountCents);

  return (
    <li className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={category.icon} color={category.color} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{category.name}</span>
            {category.archived ? (
              <Badge variant="secondary">Archived</Badge>
            ) : null}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatPeso(spent)} of {formatPeso(amountCents)}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className={`font-semibold tabular-nums ${BUDGET_TEXT_CLASS[status]}`}>
            {formatPeso(Math.abs(amountCents - spent))}
          </span>
          <span className="text-xs text-muted-foreground">
            {status === "over" ? "over" : "left"}
          </span>
        </div>
        <BudgetActionsMenu budget={budget} month={month} />
      </div>
      <BudgetProgress
        name={category.name}
        spentCents={spent}
        amountCents={amountCents}
        className="sm:ml-13"
      />
    </li>
  );
}

function Unbudgeted({
  month,
  categories,
  uncategorisedCents,
}: {
  month: MonthKey;
  categories: BudgetCategory[];
  uncategorisedCents: number;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="font-medium">Spending without a budget</h2>
        <p className="text-sm text-muted-foreground">
          Expenses in {formatMonth(month)} that no budget covers.
        </p>
      </div>
      <Card className="gap-0 py-0">
        <ul className="divide-y">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 px-4 py-3">
              <CategoryIcon icon={category.icon} color={category.color} />
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate font-medium">{category.name}</span>
                {category.archived ? (
                  <Badge variant="secondary">Archived</Badge>
                ) : null}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatPeso(category.spentCents)}
              </span>
              {!category.archived ? (
                <BudgetFormDialog
                  month={month}
                  category={category}
                  trigger={
                    <Button variant="outline" size="sm">
                      Set budget
                    </Button>
                  }
                />
              ) : null}
            </li>
          ))}
          {uncategorisedCents > 0 ? (
            <li className="flex items-center gap-3 px-4 py-3">
              <CategoryIcon icon="tag" color={null} />
              <span className="flex-1 truncate font-medium text-muted-foreground">
                Uncategorised
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatPeso(uncategorisedCents)}
              </span>
            </li>
          ) : null}
        </ul>
      </Card>
    </section>
  );
}

function EmptyState({
  month,
  children,
}: {
  month: MonthKey;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <PiggyBankIcon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">No budgets for {formatMonth(month)}</p>
        <p className="text-sm text-muted-foreground">
          Set a monthly limit for a category to keep your spending in check.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </div>
  );
}

function BudgetsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-22" />
        <Skeleton className="h-22" />
        <Skeleton className="h-22" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
