import { PlusIcon, ReceiptTextIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { MonthNav } from "@/components/app-shell/month-nav";
import { PageHeader } from "@/components/app-shell/page-header";
import { TransactionFormOptionsProvider } from "@/components/transactions/form-options";
import { ActivityRow } from "@/components/transactions/activity-row";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUserId } from "@/lib/auth/session";
import {
  getMonthActivity,
  getTransactionFormOptions,
  type ActivityFilter,
  type ActivityItem,
} from "@/lib/data/transactions";
import {
  currentMonth,
  formatDayHeading,
  formatMonth,
  parseMonth,
  type MonthKey,
} from "@/lib/dates";
import { formatPeso } from "@/lib/money";

const FILTERS: { value: ActivityFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "EXPENSE", label: "Expenses" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfers" },
];

export default function TransactionsPage({
  searchParams,
}: PageProps<"/transactions">) {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="Record your expenses, income and transfers."
      />
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TransactionsContent({
  searchParams,
}: {
  searchParams: PageProps<"/transactions">["searchParams"];
}) {
  await connection();
  const userId = await requireUserId();
  const params = await searchParams;
  const month = parseMonth(typeof params.month === "string" ? params.month : undefined);
  const filter =
    FILTERS.find((f) => f.value === params.type)?.value ?? "ALL";

  const [activity, options] = await Promise.all([
    getMonthActivity(userId, month, filter),
    getTransactionFormOptions(userId),
  ]);

  return (
    <TransactionFormOptionsProvider options={options}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthNav month={month} hrefFor={(m) => href(m, filter)} />
          <TransactionFormDialog
            defaultMode={filter === "INCOME" || filter === "TRANSFER" ? filter : "EXPENSE"}
            trigger={
              <Button>
                <PlusIcon />
                Add transaction
              </Button>
            }
          />
        </div>

        <Summary
          incomeCents={activity.incomeCents}
          expenseCents={activity.expenseCents}
        />

        <FilterTabs month={month} filter={filter} />

        {activity.items.length === 0 ? (
          <EmptyState month={month} filter={filter} />
        ) : (
          <ActivityList items={activity.items} />
        )}
      </div>
    </TransactionFormOptionsProvider>
  );
}

function href(month: MonthKey, filter: ActivityFilter) {
  const params = new URLSearchParams();
  if (month !== currentMonth()) params.set("month", month);
  if (filter !== "ALL") params.set("type", filter);
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

function Summary({
  incomeCents,
  expenseCents,
}: {
  incomeCents: number;
  expenseCents: number;
}) {
  const net = incomeCents - expenseCents;
  const stats = [
    { label: "Income", value: formatPeso(incomeCents), className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Expenses", value: formatPeso(expenseCents), className: "text-destructive" },
    {
      label: "Net",
      value: `${net > 0 ? "+" : ""}${formatPeso(net)}`,
      className: net < 0 ? "text-destructive" : "",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="py-4">
          <CardContent className="flex flex-col gap-1 px-4">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span className={`text-2xl font-semibold tabular-nums ${stat.className}`}>
              {stat.value}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FilterTabs({ month, filter }: { month: MonthKey; filter: ActivityFilter }) {
  return (
    <nav aria-label="Filter" className="flex flex-wrap gap-1">
      {FILTERS.map((f) => (
        <Button
          key={f.value}
          size="sm"
          variant={filter === f.value ? "secondary" : "ghost"}
          aria-current={filter === f.value ? "page" : undefined}
          nativeButton={false}
          render={<Link href={href(month, f.value)} />}
        >
          {f.label}
        </Button>
      ))}
    </nav>
  );
}

function ActivityList({ items }: { items: ActivityItem[] }) {
  // Group by day, keeping newest-first order.
  const days = new Map<string, ActivityItem[]>();
  for (const item of items) {
    days.set(item.occurredOn, [...(days.get(item.occurredOn) ?? []), item]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...days].map(([day, dayItems]) => (
        <section key={day} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {formatDayHeading(day)}
          </h2>
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {dayItems.map((item) => (
                <ActivityRow key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}

function EmptyState({ month, filter }: { month: MonthKey; filter: ActivityFilter }) {
  const what =
    filter === "ALL"
      ? "transactions"
      : FILTERS.find((f) => f.value === filter)!.label.toLowerCase();
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <ReceiptTextIcon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">
          No {what} in {formatMonth(month)}
        </p>
        <p className="text-sm text-muted-foreground">
          Record what you spend and earn to see where your money goes.
        </p>
      </div>
      <TransactionFormDialog
        defaultMode={filter === "INCOME" || filter === "TRANSFER" ? filter : "EXPENSE"}
        trigger={
          <Button>
            <PlusIcon />
            Add transaction
          </Button>
        }
      />
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
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
