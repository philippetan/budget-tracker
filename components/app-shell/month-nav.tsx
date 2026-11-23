import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { currentMonth, formatMonth, shiftMonth, type MonthKey } from "@/lib/dates";

/**
 * Previous / next month links with the month's name, plus "This month" when
 * viewing another month. `hrefFor` builds the page's URL for a month.
 */
export function MonthNav({
  month,
  hrefFor,
}: {
  month: MonthKey;
  hrefFor: (month: MonthKey) => string;
}) {
  const isCurrent = month === currentMonth();
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        nativeButton={false}
        render={<Link href={hrefFor(shiftMonth(month, -1))} />}
        aria-label="Previous month"
      >
        <ChevronLeftIcon />
      </Button>
      <span className="min-w-36 text-center font-medium">
        {formatMonth(month)}
      </span>
      <Button
        variant="outline"
        size="icon"
        nativeButton={false}
        render={<Link href={hrefFor(shiftMonth(month, 1))} />}
        aria-label="Next month"
      >
        <ChevronRightIcon />
      </Button>
      {!isCurrent ? (
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={hrefFor(currentMonth())} />}
        >
          This month
        </Button>
      ) : null}
    </div>
  );
}
