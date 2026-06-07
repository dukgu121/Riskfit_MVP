/**
 * `RiskBreakdownBars` — Chart.js horizontal bar chart showing all four
 * risk factors (건강 · 생활 · 직업 · 재무) on one axis so the dashboard tab
 * can give a single at-a-glance picture without four separate cards.
 *
 * Toss-style: 8px thick bars, rounded ends, neutral-100 track, brand-500
 * fill, no tooltip (the label + value beside each bar is the source of
 * truth), no axes/gridlines, 600ms easeOutQuart animation.
 */

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

/**
 * Resolve a `var(--color-...)` reference to its underlying value at call time.
 * Chart.js paints to a canvas so it cannot consume CSS variables directly; we
 * resolve them here so palette decisions still flow through the token layer
 * rather than living as inline hex.
 */
function tokenColor(value: string): string {
  const match = value.match(/^var\((--[^,)]+)(?:,\s*([^)]+))?\)$/);
  if (!match) return value;
  if (typeof window === "undefined") return match[2]?.trim() ?? value;
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(match[1])
    .trim();
  return resolved || match[2]?.trim() || value;
}

export interface RiskBreakdownItem {
  label: string;
  value: number;
}

export interface RiskBreakdownBarsProps {
  items: RiskBreakdownItem[];
  /** Height of the canvas in px. Width fills the container. */
  height?: number;
}

export function RiskBreakdownBars({
  items,
  height = 180,
}: RiskBreakdownBarsProps) {
  const palette = useMemo(
    () => ({
      barFill: tokenColor("var(--color-brand-500)"),
      tickColor: tokenColor("var(--color-neutral-600)"),
      tooltipBg: tokenColor("var(--color-neutral-0)"),
      tooltipTitle: tokenColor("var(--color-neutral-900)"),
      tooltipBody: tokenColor("var(--color-neutral-700)"),
      tooltipBorder: tokenColor("var(--color-neutral-200)"),
    }),
    [],
  );

  const data = useMemo(
    () => ({
      labels: items.map((item) => item.label),
      datasets: [
        {
          data: items.map((item) =>
            Math.max(0, Math.min(100, Math.round(item.value))),
          ),
          backgroundColor: palette.barFill,
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 8,
          maxBarThickness: 8,
        },
      ],
    }),
    [items, palette.barFill],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      indexAxis: "y" as const,
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: "easeOutQuart",
      },
      layout: {
        padding: { right: 32, left: 0, top: 4, bottom: 4 },
      },
      scales: {
        x: {
          display: false,
          min: 0,
          max: 100,
          grid: { display: false },
        },
        y: {
          display: true,
          grid: { display: false, drawBorder: false } as never,
          border: { display: false },
          ticks: {
            color: palette.tickColor,
            font: {
              family: "Pretendard Variable",
              size: 13,
              weight: 500,
            },
            padding: 8,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: palette.tooltipBg,
          titleColor: palette.tooltipTitle,
          bodyColor: palette.tooltipBody,
          borderColor: palette.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          titleFont: {
            family: "Pretendard Variable",
            size: 13,
            weight: 600,
          },
          bodyFont: {
            family: "Pretendard Variable",
            size: 13,
            weight: 500,
          },
          callbacks: {
            label: (ctx) => `${ctx.parsed.x}점`,
          },
        },
      },
    }),
    [palette],
  );

  return (
    <div style={{ height }} className="w-full">
      <Bar data={data} options={options} />
    </div>
  );
}

export default RiskBreakdownBars;
