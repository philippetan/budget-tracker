"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonthCashFlow } from "@/lib/data/dashboard";
import { formatPeso } from "@/lib/money";

const chartConfig = {
  income: { label: "Income", color: "var(--chart-income)" },
  expense: { label: "Expenses", color: "var(--chart-expense)" },
} satisfies ChartConfig;

type Row = {
  month: string;
  label: string;
  /** Pesos, for the axis scale. */
  income: number;
  expense: number;
  incomeCents: number;
  expenseCents: number;
};

const compactPeso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

function monthLabel(month: string, style: "short" | "long") {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-PH", {
    month: style,
    ...(style === "long" ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** Income vs expenses per month, as paired columns. */
export function CashFlowChart({ data }: { data: MonthCashFlow[] }) {
  const rows: Row[] = data.map((d) => ({
    month: d.month,
    label: monthLabel(d.month, "short"),
    income: d.incomeCents / 100,
    expense: d.expenseCents / 100,
    incomeCents: d.incomeCents,
    expenseCents: d.expenseCents,
  }));

  return (
    <>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-64 w-full"
        aria-hidden
      >
        <BarChart
          data={rows}
          barGap={2}
          barCategoryGap="24%"
          margin={{ left: 4, right: 4 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => compactPeso.format(value)}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row) return null;
              const net = row.incomeCents - row.expenseCents;
              return (
                <div className="grid min-w-40 gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
                  <span className="font-medium">
                    {monthLabel(row.month, "long")}
                  </span>
                  <TooltipRow
                    color="var(--chart-income)"
                    label="Income"
                    cents={row.incomeCents}
                  />
                  <TooltipRow
                    color="var(--chart-expense)"
                    label="Expenses"
                    cents={row.expenseCents}
                  />
                  <div className="flex justify-between gap-4 border-t pt-1.5">
                    <span className="text-muted-foreground">Net</span>
                    <span className="font-medium tabular-nums">
                      {net > 0 ? "+" : ""}
                      {formatPeso(net)}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          {/* itemSorter={null}: keep the bars' order (income, then expenses). */}
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          <Bar
            dataKey="income"
            fill="var(--color-income)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="expense"
            fill="var(--color-expense)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ChartContainer>

      {/* The same numbers for screen readers. The wrapper does the hiding:
          tables ignore sr-only's 1px width and would widen the page. */}
      <div className="sr-only">
        <table>
          <caption>Income and expenses per month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Income</th>
              <th scope="col">Expenses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <th scope="row">{monthLabel(row.month, "long")}</th>
                <td>{formatPeso(row.incomeCents)}</td>
                <td>{formatPeso(row.expenseCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TooltipRow({
  color,
  label,
  cents,
}: {
  color: string;
  label: string;
  cents: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-0.5 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">
        {formatPeso(cents)}
      </span>
    </div>
  );
}
