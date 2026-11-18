// Date helpers. Transaction dates are calendar dates ("2026-11-19") stored in
// Postgres DATE columns, which Prisma reads as midnight UTC. "Today" and the
// current month are worked out in Philippine time, since the app is for PH users.

export const APP_TIME_ZONE = "Asia/Manila";

/** A month as "YYYY-MM", e.g. "2026-11". */
export type MonthKey = string;

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in the Philippines, e.g. "2026-11-19". */
export function todayISO(): string {
  return isoDateFormatter.format(new Date());
}

/** The current month in the Philippines, e.g. "2026-11". */
export function currentMonth(): MonthKey {
  return todayISO().slice(0, 7);
}

/** Validates a "YYYY-MM" string (e.g. from the URL); falls back to this month. */
export function parseMonth(value: string | undefined): MonthKey {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth();
}

/** Moves a month forward or back: shiftMonth("2026-01", -1) -> "2025-12". */
export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

/** [start, end) of a month, for querying DATE columns. */
export function monthRange(month: MonthKey): { start: Date; end: Date } {
  return {
    start: new Date(`${month}-01T00:00:00Z`),
    end: new Date(`${shiftMonth(month, 1)}-01T00:00:00Z`),
  };
}

/** "2026-11" -> "November 2026" */
export function formatMonth(month: MonthKey): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2026-11-19" -> Date at midnight UTC (how DATE columns are stored). */
export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Date from a DATE column -> "2026-11-19" */
export function dateToISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "2026-11-19" -> "Thursday, 19 November" (adds the year if not this year) */
export function formatDayHeading(iso: string): string {
  const sameYear = iso.slice(0, 4) === todayISO().slice(0, 4);
  return isoToDate(iso).toLocaleDateString("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}
