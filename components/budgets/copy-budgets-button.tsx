"use client";

import { CopyIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { copyPreviousMonthBudgets } from "@/app/(app)/budgets/actions";
import { Button } from "@/components/ui/button";
import { formatMonth, shiftMonth, type MonthKey } from "@/lib/dates";

/** Copies last month's budgets into `month`. */
export function CopyBudgetsButton({
  month,
  count,
  variant = "outline",
}: {
  month: MonthKey;
  /** How many budgets will be copied (shown on the button). */
  count: number;
  variant?: "default" | "outline";
}) {
  const [pending, startTransition] = useTransition();
  const from = formatMonth(shiftMonth(month, -1)).split(" ")[0];

  function copy() {
    startTransition(async () => {
      const result = await copyPreviousMonthBudgets(month);
      if (!result.ok) {
        toast.error(result.message);
      } else if (result.copied === 0) {
        toast.info("Nothing new to copy");
      } else {
        toast.success(
          `Copied ${result.copied} budget${result.copied === 1 ? "" : "s"} from ${from}`,
        );
      }
    });
  }

  return (
    <Button variant={variant} onClick={copy} disabled={pending}>
      <CopyIcon />
      {pending ? "Copying…" : `Copy ${count} from ${from}`}
    </Button>
  );
}
