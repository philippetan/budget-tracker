import { PlusIcon, WalletIcon } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";

import { AccountActionsMenu } from "@/components/accounts/account-actions-menu";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { PageHeader } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { accountTypeInfo } from "@/lib/accounts";
import { requireUserId } from "@/lib/auth/session";
import {
  getAccountsWithBalances,
  type AccountWithBalance,
} from "@/lib/data/accounts";
import { formatPeso } from "@/lib/money";

export default function AccountsPage() {
  return (
    <>
      <PageHeader
        title="Accounts"
        description="Your cash, bank and e-wallet accounts and their balances."
        actions={
          <AccountFormDialog
            trigger={
              <Button>
                <PlusIcon />
                Add account
              </Button>
            }
          />
        }
      />
      <Suspense fallback={<AccountsSkeleton />}>
        <AccountsContent />
      </Suspense>
    </>
  );
}

async function AccountsContent() {
  await connection();
  const userId = await requireUserId();
  const accounts = await getAccountsWithBalances(userId);

  const active = accounts.filter((a) => !a.archived);
  const archived = accounts.filter((a) => a.archived);

  if (accounts.length === 0) return <EmptyState />;

  const total = active.reduce((sum, a) => sum + a.balanceCents, 0);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Total balance</span>
          <span
            className={`text-3xl font-semibold tabular-nums ${total < 0 ? "text-destructive" : ""}`}
          >
            {formatPeso(total)}
          </span>
          <span className="text-sm text-muted-foreground">
            Across {active.length} active{" "}
            {active.length === 1 ? "account" : "accounts"}
          </span>
        </CardContent>
      </Card>

      {active.length > 0 ? (
        <AccountGrid accounts={active} />
      ) : (
        <p className="text-sm text-muted-foreground">
          All your accounts are archived.
        </p>
      )}

      {archived.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Archived
          </h2>
          <AccountGrid accounts={archived} />
        </section>
      ) : null}
    </div>
  );
}

function AccountGrid({ accounts }: { accounts: AccountWithBalance[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}

function AccountCard({ account }: { account: AccountWithBalance }) {
  const type = accountTypeInfo(account.type);

  return (
    <Card className={account.archived ? "opacity-60" : undefined}>
      <CardContent className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <type.icon className="size-5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{account.name}</span>
            {account.archived ? (
              <Badge variant="secondary">Archived</Badge>
            ) : null}
          </div>
          <span className="text-sm text-muted-foreground">{type.label}</span>
          <span
            className={`mt-2 text-xl font-semibold tabular-nums ${account.balanceCents < 0 ? "text-destructive" : ""}`}
          >
            {formatPeso(account.balanceCents)}
          </span>
        </div>
        <AccountActionsMenu account={account} />
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <WalletIcon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">No accounts yet</p>
        <p className="text-sm text-muted-foreground">
          Add where you keep your money, like Cash, GoTyme or GCash.
        </p>
      </div>
      <AccountFormDialog
        trigger={
          <Button>
            <PlusIcon />
            Add your first account
          </Button>
        }
      />
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
