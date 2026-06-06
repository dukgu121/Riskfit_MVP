/**
 * `ScoreDoughnut` — Chart.js doughnut for the hero risk score.
 *
 * Toss-style: a single brand fill on a neutral-100 track, 12px thickness,
 * no gap between segments. Numbers / labels are rendered by the parent so
 * the chart itself stays purely decorative.
 *
 * The doughnut renders 0–100 as a fraction; everything above 100 clamps.
 */

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  Chart as ChartJS,
  Tooltip,
  type ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip);

/**
 * Resolve a `var(--color-...)` reference to the underlying value at call time.
 * Chart.js paints to a canvas so it cannot consume CSS variables directly; we
 * resolve them here so palette decisions still flow through the token layer
 * rather than living as inline hex.
 *
 * Non-`var(...)` inputs (literal hex / rgb) pass through unchanged.
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

export interface ScoreDoughnutProps {
  /** Score 0-100. Clamped on render. */
  value: number;
  /** Pixel size of the canvas (width = height). */
  size?: number;
  /**
   * Override the arc fill colour. Accepts a `var(--color-...)` reference or
   * a literal hex. Defaults to the brand-500 semantic token.
   */
  color?: string;
  /**
   * Override the track colour behind the arc. Defaults to neutral-100.
   */
  trackColor?: string;
  /** Accessible label shown to screen readers. */
  ariaLabel?: string;
}

export function ScoreDoughnut({
  value,
  size = 200,
  color,
  trackColor,
  ariaLabel,
}: ScoreDoughnutProps) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));

  const arcColor = useMemo(
    () => tokenColor(color ?? "var(--color-brand-500)"),
    [color],
  );
  const arcTrack = useMemo(
    () => tokenColor(trackColor ?? "var(--color-neutral-100)"),
    [trackColor],
  );

  const data = useMemo(
    () => ({
      labels: ["점수", "여유"],
      datasets: [
        {
          data: [safe, Math.max(0, 100 - safe)],
          backgroundColor: [arcColor, arcTrack],
          borderWidth: 0,
          spacing: 0,
        },
      ],
    }),
    [safe, arcColor, arcTrack],
  );

  const options = useMemo<ChartOptions<"doughnut">>(
    () => ({
      cutout: "82%",
      animation: {
        duration: 600,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
        },
      },
      events: [],
      responsive: false,
      maintainAspectRatio: false,
    }),
    [],
  );

  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0"
      role="img"
      aria-label={ariaLabel ?? `위험점수 ${safe}점`}
    >
      <Doughnut data={data} options={options} width={size} height={size} />
    </div>
  );
}

export default ScoreDoughnut;
