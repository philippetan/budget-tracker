import { cacheLife } from "next/cache";

import { currentMonth, type MonthKey } from "@/lib/dates";

/**
 * The month the landing page's sample data is dated in. Cached for a day, so
 * the page stays static but its examples never look out of date.
 */
export async function sampleMonth(): Promise<MonthKey> {
  "use cache";
  cacheLife("days");
  return currentMonth();
}
