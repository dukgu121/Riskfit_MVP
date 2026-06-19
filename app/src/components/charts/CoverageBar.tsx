/**
 * `CoverageBar` — single horizontal bar visualising a 0-100 fit value.
 *
 * Toss-style: 8px thick, fully rounded, no axis lines, no tooltip on hover
 * (the label and value beside the bar are the source of truth). We render
 * with raw DOM divs instead of Chart.js here because a single bar would
 * be overkill for a chart — but the visual + animation matches the rest
 * of the chart family (600ms easeOutQuart).
 */

import { useEffect, useState } from "react";

import { cn } from "../../lib/cn";

export interface CoverageBarProps {
  /** Fit value 0-100. Clamped on render. */
  value: number;
  /**
   * Visual band — controls the bar colour. Defaults to brand-500 for the
   * "sufficient" path; weaker bands soften the hue per Toss palette.
   */
  band?: "sufficient" | "caution" | "insufficient" | "excessive";
  className?: string;
  /** Accessible label for the bar. */
  ariaLabel?: string;
}

/**
 * Toss palette: success / warn / danger. We reference the CSS custom props
 * directly because the project's tailwind theme only exposes `--color-brand-*`
 * and `--color-neutral-*` scales — the semantic colours live as single
 * variables under `--color-semantic-*`.
 */
const bandColors: Record<NonNullable<CoverageBarProps["band"]>, string> = {
  sufficient: "var(--color-semantic-success)",
  caution: "var(--color-semantic-warn)",
  insufficient: "var(--color-semantic-danger)",
  excessive: "var(--color-semantic-info)",
};

export function CoverageBar({
  value,
  band = "sufficient",
  className,
  ariaLabel,
}: CoverageBarProps) {
  const target = Math.max(0, Math.min(100, Math.round(value)));
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    // Trigger animation on next paint so the transition runs from 0 to target.
    const id = window.requestAnimationFrame(() => setDisplayed(target));
    return () => window.cancelAnimationFrame(id);
  }, [target]);

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-neutral-100",
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={target}
      aria-label={ariaLabel ?? `보장 적합도 ${target}%`}
    >
      <div
        className="h-full rounded-full transition-[width] ease-out"
        style={{
          width: `${displayed}%`,
          transitionDuration: "600ms",
          backgroundColor: bandColors[band],
        }}
      />
    </div>
  );
}

export default CoverageBar;
