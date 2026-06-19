/**
 * `LifecycleLineChart` — a single brand-line area chart of projected RISK over a
 * lifecycle or a 5-year horizon, via react-chartjs-2's `Line`.
 *
 * One brand-blue line on a faint brand fill, no gridlines except a hairline
 * baseline, rounded points, soft tension. The y-axis is the projected 위험점수
 * (0–100, higher = worse); the x-axis is age. All numbers are DEMO ESTIMATES
 * (the caller renders the "예측 추정치" caption + disclaimer).
 *
 * chart.js paints to canvas and cannot read CSS variables, so we resolve the
 * brand token at call time (same approach as `ScoreDoughnut`).
 */

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

/** Resolve a `var(--color-…)` token to its literal value (canvas can't use vars). */
function tokenColor(value: string): string {
  const match = value.match(/^var\((--[^,)]+)(?:,\s*([^)]+))?\)$/);
  if (!match) return value;
  if (typeof window === "undefined") return match[2]?.trim() ?? value;
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(match[1])
    .trim();
  return resolved || match[2]?.trim() || value;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface LifecycleLineChartProps {
  /** X labels (ages), e.g. ["25","35","45",…] or yearly. */
  labels: string[];
  /** Projected RISK values 0–100 aligned to `labels`. */
  values: number[];
  /** Index of the point representing "현재" — highlighted with a larger dot. */
  highlightIndex?: number;
  /** Pixel height (width fills the container). */
  height?: number;
  /** Accent token (default brand-500). */
  color?: string;
  ariaLabel?: string;
}

export function LifecycleLineChart({
  labels,
  values,
  highlightIndex,
  height = 240,
  color = "var(--color-brand-500)",
  ariaLabel,
}: LifecycleLineChartProps) {
  const line = useMemo(() => tokenColor(color), [color]);
  const fill = useMemo(() => hexToRgba(line, 0.1), [line]);
  const muted = useMemo(
    () => tokenColor("var(--color-neutral-400)"),
    [],
  );
  const grid = useMemo(() => tokenColor("var(--color-neutral-100)"), []);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          borderColor: line,
          backgroundColor: fill,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: labels.map((_, i) => (i === highlightIndex ? 5 : 3)),
          pointHoverRadius: 6,
          pointBackgroundColor: labels.map((_, i) =>
            i === highlightIndex ? line : "#ffffff",
          ),
          pointBorderColor: line,
          pointBorderWidth: 2,
        },
      ],
    }),
    [labels, values, line, fill, highlightIndex],
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: "easeOutQuart" },
      layout: { padding: { top: 8, bottom: 0, left: 0, right: 4 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#191F28",
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          titleFont: { size: 12, weight: 600 },
          bodyFont: { size: 13, weight: 700 },
          callbacks: {
            title: (items) => `${items[0]?.label ?? ""}세`,
            label: (item) => `위험점수 ${Math.round(item.parsed.y ?? 0)}점`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: grid },
          ticks: {
            color: muted,
            font: { size: 12, weight: 500 },
            callback: (_, i) => `${labels[i]}`,
          },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: grid },
          border: { display: false },
          ticks: {
            color: muted,
            font: { size: 11 },
            stepSize: 25,
            maxTicksLimit: 5,
          },
        },
      },
    }),
    [labels, muted, grid],
  );

  return (
    <div
      style={{ height }}
      role="img"
      aria-label={ariaLabel ?? "생애주기 위험 예측 그래프"}
    >
      <Line data={data} options={options} />
    </div>
  );
}

export default LifecycleLineChart;
