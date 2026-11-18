import { PlusIcon } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/app-shell/page-header";
import { CategoryActionsMenu } from "@/components/categories/category-actions-menu";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { CategoryIcon } from "@/components/categories/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUserId } from "@/lib/auth/session";
import { getCategories, type CategoryWithUsage } from "@/lib/data/categories";
import type { TransactionType } from "@/lib/generated/prisma/enums";

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise your income and expenses with categories and icons."
        actions={
          <CategoryFormDialog
            trigger={
              <Button>
                <PlusIcon />
                Add category
              </Button>
            }
          />
        }
      />
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </>
  );
}

async function CategoriesContent() {
  await connection();
  const userId = await requireUserId();
  const categories = await getCategories(userId);

  const expense = categories.filter((c) => c.type === "EXPENSE");
  const income = categories.filter((c) => c.type === "INCOME");

  return (
    <Tabs defaultValue="EXPENSE" className="gap-6">
      <TabsList>
        <TabsTrigger value="EXPENSE">Expenses ({count(expense)})</TabsTrigger>
        <TabsTrigger value="INCOME">Income ({count(income)})</TabsTrigger>
      </TabsList>
      <TabsContent value="EXPENSE">
        <CategorySection categories={expense} type="EXPENSE" />
      </TabsContent>
      <TabsContent value="INCOME">
        <CategorySection categories={income} type="INCOME" />
      </TabsContent>
    </Tabs>
  );
}

/** Number of active (not archived) categories. */
function count(categories: CategoryWithUsage[]) {
  return categories.filter((c) => !c.archived).length;
}

function CategorySection({
  categories,
  type,
}: {
  categories: CategoryWithUsage[];
  type: TransactionType;
}) {
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
        <CategoryFormDialog
          defaultType={type}
          trigger={
            <button
              type="button"
              className="flex min-h-18 items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PlusIcon className="size-4" />
              Add {type === "INCOME" ? "income" : "expense"} category
            </button>
          }
        />
      </div>

      {archived.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Archived
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CategoryCard({ category }: { category: CategoryWithUsage }) {
  const used = category.transactionCount;

  return (
    <Card className={category.archived ? "py-3 opacity-60" : "py-3"}>
      <CardContent className="flex items-center gap-3 px-3">
        <CategoryIcon icon={category.icon} color={category.color} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{category.name}</span>
            {category.archived ? (
              <Badge variant="secondary">Archived</Badge>
            ) : null}
          </div>
          <span className="text-sm text-muted-foreground">
            {used === 0
              ? "No transactions yet"
              : `${used} transaction${used === 1 ? "" : "s"}`}
          </span>
        </div>
        <CategoryActionsMenu category={category} />
      </CardContent>
    </Card>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-18 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
