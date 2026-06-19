/**
 * `BeforeAfterCompare` — a compact "지금 N → 개선 후 M" hero for the 개선 flow.
 *
 * ALWAYS a 보장 적합도 FIT comparison (higher = better). It NEVER shows a
 * risk-score "improvement" — the +Δ here is a real `coverageFit` recompute from
 * `lib/calc/improvement.ts`. The arrow + green delta read as an upgrade; the
 * current value is muted, the projected value is the brand-blue headline.
 *
 * Toss tone: two big tabular numbers, a thin arrow between, a signed +Δ pill in
 * success green. Single accent: the projected number is brand-500, the delta is
 * success-600 (a signed-delta exception, per the design contract).
 */

import { motion, useReducedMotion } from "motion/react";

import { cn } from "../../lib/cn";

export interface BeforeAfterCompareProps {
  /** Current FIT 0–100 (from the cached analysis). */
  current: number;
  /** Projected FIT 0–100 (real recompute). */
  projected: number;
  /** Unit suffix shown after each number. */
  unit?: string;
  /** Small caption under the numbers. */
  caption?: string;
  className?: string;
}

export function BeforeAfterCompare({
  current,
  projected,
  unit = "%",
  caption,
  className,
}: BeforeAfterCompareProps) {
  const reduce = useReducedMotion();
  const delta = Math.max(0, projected - current);

  return (
    <div className={cn("rounded-3xl bg-white px-7 py-7 shadow-card", className)}>
      <div className="flex items-center justify-center gap-5 sm:gap-8">
        {/* 지금 */}
        <div className="flex flex-col items-center">
          <span className="text-[13px] font-medium text-neutral-400">지금</span>
          <span className="mt-1 flex items-baseline">
            <span className="text-[40px] font-extrabold leading-none tracking-tight text-neutral-400 tabular-nums">
              {current}
            </span>
            <span className="ml-0.5 text-[18px] font-bold text-neutral-300">{unit}</span>
          </span>
        </div>

        {/* arrow */}
        <Arrow />

        {/* 개선 후 */}
        <div className="flex flex-col items-center">
          <span className="text-[13px] font-bold text-brand-500">개선 후</span>
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-1 flex items-baseline"
          >
            <span className="text-[52px] font-extrabold leading-none tracking-tight text-brand-500 tabular-nums">
              {projected}
            </span>
            <span className="ml-0.5 text-[22px] font-bold text-brand-300">{unit}</span>
          </motion.span>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-2">
        {delta > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-3 py-1 text-[13px] font-bold text-success-600 tabular-nums">
            <TrendUp />
            적합도 +{delta}
            {unit === "%" ? "%p" : unit}
          </span>
        )}
        {caption && (
          <p className="text-center text-[13px] leading-relaxed text-neutral-400">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 text-neutral-300"
    >
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 17l6-6 4 4 7-7M21 8v5M21 8h-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default BeforeAfterCompare;
