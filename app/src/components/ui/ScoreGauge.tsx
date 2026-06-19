/**
 * `ScoreGauge` — an OPEN-ARC gauge (≈270° sweep), visually distinct from the
 * full-ring `ScoreDoughnut`. Used for the 위험점수 / 영역별 위험 heroes on the
 * drill-down screens so RISK reads differently from the FIT doughnut.
 *
 * Pure inline SVG (no chart.js) — a rounded background track + a foreground arc
 * whose length is `value/max` of the track. The arc sweeps in on mount via
 * `stroke-dashoffset`; `prefers-reduced-motion` renders it filled immediately.
 *
 * Numbers/labels are the parent's job by default, but a convenience `label`
 * prop centers a small caption under an absolutely-positioned children slot.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface ScoreGaugeProps {
  /** Current value (0..max). Clamped. */
  value: number;
  /** Scale max (default 100). */
  max?: number;
  /** Pixel diameter of the square SVG (default 200). */
  size?: number;
  /** Arc stroke width in px (default 14). */
  thickness?: number;
  /**
   * Foreground arc colour — a `var(--color-…)` token or literal. Defaults to
   * the brand blue (single-accent discipline). Detail screens pass a band
   * colour (success/warn/danger) to convey good/bad.
   */
  color?: string;
  /** Track colour behind the arc (default neutral-100). */
  trackColor?: string;
  /** Optional caption rendered centered below the children slot. */
  label?: ReactNode;
  /** Centered overlay (usually the big tabular number). */
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/** Fraction of the circle the open arc spans (270° = three-quarters). */
const ARC_FRACTION = 0.75;

export function ScoreGauge({
  value,
  max = 100,
  size = 200,
  thickness = 14,
  color = "var(--color-brand-500)",
  trackColor = "var(--color-neutral-100)",
  label,
  children,
  className,
  ariaLabel,
}: ScoreGaugeProps) {
  const safeMax = max > 0 ? max : 100;
  const pct = Math.max(0, Math.min(1, value / safeMax));

  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLen = circumference * ARC_FRACTION;
  // An SVG <circle> starts its stroke at 3 o'clock (angle 0) and dasharray
  // draws clockwise. A 270° arc therefore spans 3 to 12 o'clock, leaving the gap
  // in the top-right quadrant. Rotating the whole SVG by 135° re-centers that
  // gap at the bottom (6 o'clock) so the gauge reads as an open speedometer.
  const rotation = 135;

  const [filled, setFilled] = useState(false);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceRef.current) {
      setFilled(true);
      return;
    }
    const id = window.requestAnimationFrame(() => setFilled(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const visiblePct = filled ? pct : 0;
  const dashOffset = arcLen * (1 - visiblePct);

  return (
    <div
      style={{ width: size, height: size }}
      className={cn("relative shrink-0", className)}
      role="img"
      aria-label={ariaLabel ?? `점수 ${Math.round(value)}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        aria-hidden
      >
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
        />
        {/* value arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
        {label != null && (
          <span className="mt-1.5 text-sm font-medium text-neutral-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export default ScoreGauge;
