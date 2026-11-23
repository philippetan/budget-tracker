import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/app-shell/page-header";
import {
  BUDGET_TEXT_CLASS,
  BudgetProgress,
  budgetStatus,
} from "@/components/budgets/budget-progress";
import { CategoryIcon } from "@/components/categories/category-icon";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { ActivityRow } from "@/components/transactions/activity-row";
import { TransactionFormOptionsProvider } from "@/components/transactions/form-options";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/session";
import { getAccountsWithBalances } from "@/lib/data/accounts";
import { getMonthBudgets, type BudgetItem } from "@/lib/data/budgets";
import {
  getCashFlow,
  getSetupProgress,
  getSpendingByCategory,
  type CategorySpending,
  type MonthCashFlow,
  type SetupProgress,
} from "@/lib/data/dashboard";
import {
  getRecentActivity,
  getTransactionFormOptions,
  type ActivityItem,
} from "@/lib/data/transactions";
import { currentMonth, formatMonth } from "@/lib/dates";
import { formatPeso } from "@/lib/money";

const CASH_FLOW_MONTHS = 6;
const TOP_CATEGORIES = 5;
const TOP_BUDGETS = 4;
const RECENT_ITEMS = 6;

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // Pages check the session themselves too; never rely on proxy.ts alone.
  await connection();
  const user = await requireUser();
  const month = currentMonth();

  const [accounts, cashFlow, spending, budgets, recent, options, setup] =
    await Promise.all([
      getAccountsWithBalances(user.id),
      getCashFlow(user.id, month, CASH_FLOW_MONTHS),
      getSpendingByCategory(user.id, month),
      getMonthBudgets(user.id, month),
      getRecentActivity(user.id, RECENT_ITEMS),
      getTransactionFormOptions(user.id),
      getSetupProgress(user.id),
    ]);

  const firstName = user.name.split(" ")[0];
  const activeAccounts = accounts.filter((a) => !a.archived);
  const thisMonth = cashFlow[cashFlow.length - 1];
  const setupDone = setup.hasAccount && setup.hasTransaction && setup.hasBudget;

  return (
    <TransactionFormOptionsProvider options={options}>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description={`Here's your money in ${formatMonth(month)}.`}
        actions={
          <TransactionFormDialog
            trigger={
              <Button>
                <PlusIcon />
                Add transaction
              </Button>
            }
          />
        }
      />

      <div className="flex flex-col gap-6">
        {!setupDone ? <GetStarted setup={setup} /> : null}

        <Stats
          balanceCents={activeAccounts.reduce((sum, a) => sum + a.balanceCents, 0)}
          accountCount={activeAccounts.length}
          incomeCents={thisMonth.incomeCents}
          expenseCents={thisMonth.expenseCents}
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <CashFlowCard data={cashFlow} />
          <SpendingCard month={month} spending={spending} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <BudgetsCard month={month} budgets={budgets.budgets} />
          <RecentCard items={recent} />
        </div>
      </div>
    </TransactionFormOptionsProvider>
  );
}

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={href} />}>
      {label}
      <ArrowRightIcon />
    </Button>
  );
}

function GetStarted({ setup }: { setup: SetupProgress }) {
  const steps = [
    {
      done: setup.hasAccount,
      title: "Add an account",
      detail: "Your cash, bank or e-wallet, with its current balance.",
      href: "/accounts",
    },
    {
      done: setup.hasTransaction,
      title: "Record a transaction",
      detail: "Log what you spend and earn as it happens.",
      href: "/transactions",
    },
    {
      done: setup.hasBudget,
      title: "Set a monthly budget",
      detail: "Pick a spending limit for a category, like Food & Dining.",
      href: "/budgets",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get started</CardTitle>
        <CardDescription>
          {steps.filter((s) => s.done).length} of {steps.length} done. Three
          steps to see where your money goes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.title}>
              <Link
                href={step.href}
                className="flex h-full gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                {step.done ? (
                  <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <CircleIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                )}
                <span className="flex flex-col gap-0.5">
                  <span className={`font-medium ${step.done ? "text-muted-foreground line-through" : ""}`}>
                    {step.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{step.detail}</span>
                  <span className="sr-only">{step.done ? "(done)" : "(to do)"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function Stats({
  balanceCents,
  accountCount,
  incomeCents,
  expenseCents,
}: {
  balanceCents: number;
  accountCount: number;
  incomeCents: number;
  expenseCents: number;
}) {
  const net = incomeCents - expenseCents;
  const stats = [
    {
      label: "Total balance",
      value: formatPeso(balanceCents),
      note: `Across ${accountCount} account${accountCount === 1 ? "" : "s"}`,
      className: balanceCents < 0 ? "text-destructive" : "",
      href: "/accounts",
    },
    {
      label: "Income this month",
      value: formatPeso(incomeCents),
      className: "text-emerald-600 dark:text-emerald-400",
      href: "/transactions?type=INCOME",
    },
    {
      label: "Spent this month",
      value: formatPeso(expenseCents),
      className: "text-destructive",
      href: "/transactions?type=EXPENSE",
    },
    {
      label: "Net this month",
      value: `${net > 0 ? "+" : ""}${formatPeso(net)}`,
      note: net >= 0 ? "Income minus spending" : "You spent more than you earned",
      className: net < 0 ? "text-destructive" : "",
      href: "/transactions",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Card className="h-full py-4 transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col gap-1 px-4">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className={`text-2xl font-semibold tabular-nums ${stat.className}`}>
                {stat.value}
              </span>
              {stat.note ? (
                <span className="text-xs text-muted-foreground">{stat.note}</span>
              ) : null}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function CashFlowCard({ data }: { data: MonthCashFlow[] }) {
  const hasData = data.some((d) => d.incomeCents > 0 || d.expenseCents > 0);
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Income vs expenses</CardTitle>
        <CardDescription>Last {data.length} months</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <CashFlowChart data={data} />
        ) : (
          <EmptyNote>Your monthly income and spending will show here.</EmptyNote>
        )}
      </CardContent>
    </Card>
  );
}

function SpendingCard({
  month,
  spending,
}: {
  month: string;
  spending: CategorySpending[];
}) {
  const total = spending.reduce((sum, c) => sum + c.spentCents, 0);
  // Keep the list short: the rest fold into "Other".
  const top = spending.slice(0, TOP_CATEGORIES);
  const rest = spending.slice(TOP_CATEGORIES);
  const restCents = rest.reduce((sum, c) => sum + c.spentCents, 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Spending by category</CardTitle>
        <CardDescription>
          {total > 0
            ? `${formatPeso(total)} in ${formatMonth(month)}`
            : formatMonth(month)}
        </CardDescription>
        <CardAction>
          <ViewAll href="/transactions?type=EXPENSE" label="Details" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyNote>No spending recorded this month yet.</EmptyNote>
        ) : (
          <ul className="flex flex-col gap-4">
            {top.map((c) => (
              <SpendingRow
                key={c.id ?? "uncategorised"}
                icon={<CategoryIcon icon={c.icon} color={c.color} className="size-8 [&_svg]:size-4" />}
                name={c.name}
                cents={c.spentCents}
                total={total}
              />
            ))}
            {rest.length > 0 ? (
              <SpendingRow
                icon={<CategoryIcon icon="circle-ellipsis" color={null} className="size-8 [&_svg]:size-4" />}
                name={`Other (${rest.length} categories)`}
                cents={restCents}
                total={total}
              />
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SpendingRow({
  icon,
  name,
  cents,
  total,
}: {
  icon: React.ReactNode;
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

function BudgetsCard({ month, budgets }: { month: string; budgets: BudgetItem[] }) {
  // Show the budgets closest to (or past) their limit first.
  const top = [...budgets]
    .sort(
      (a, b) =>
        b.category.spentCents / b.amountCents -
        a.category.spentCents / a.amountCents,
    )
    .slice(0, TOP_BUDGETS);
  const overCount = budgets.filter(
    (b) => budgetStatus(b.category.spentCents, b.amountCents) === "over",
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>
          {budgets.length === 0
            ? formatMonth(month)
            : overCount > 0
              ? `${overCount} of ${budgets.length} over budget`
              : `${budgets.length} budget${budgets.length === 1 ? "" : "s"} on track`}
        </CardDescription>
        <CardAction>
          <ViewAll href="/budgets" label="All budgets" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <EmptyNote>
            No budgets for this month.{" "}
            <Link href="/budgets" className="underline underline-offset-4">
              Set one
            </Link>{" "}
            to keep your spending in check.
          </EmptyNote>
        ) : (
          <ul className="flex flex-col gap-5">
            {top.map((budget) => {
              const { category, amountCents } = budget;
              const status = budgetStatus(category.spentCents, amountCents);
              const diff = Math.abs(amountCents - category.spentCents);
              return (
                <li key={budget.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <CategoryIcon icon={category.icon} color={category.color} className="size-8 [&_svg]:size-4" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatPeso(category.spentCents)} of {formatPeso(amountCents)}
                      </span>
                    </div>
                    <span className={`shrink-0 text-sm font-medium tabular-nums ${BUDGET_TEXT_CLASS[status]}`}>
                      {formatPeso(diff)} {status === "over" ? "over" : "left"}
                    </span>
                  </div>
                  <BudgetProgress
                    name={category.name}
                    spentCents={category.spentCents}
                    amountCents={amountCents}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentCard({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-4">
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>Your latest activity</CardDescription>
        <CardAction>
          <ViewAll href="/transactions" label="View all" />
        </CardAction>
      </CardHeader>
      {items.length === 0 ? (
        <CardContent className="pb-6">
          <EmptyNote>Nothing recorded yet. Add your first transaction above.</EmptyNote>
        </CardContent>
      ) : (
        <ul className="divide-y border-t">
          {items.map((item) => (
            <ActivityRow key={`${item.kind}-${item.id}`} item={item} showDate />
          ))}
        </ul>
      )}
    </Card>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex min-h-24 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 lg:col-span-3" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
