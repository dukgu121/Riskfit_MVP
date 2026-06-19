/**
 * `MetricCompareCard` — one before→after metric tile for the 개선 효과 미리보기
 * (p25). Shows a label, the current value (muted), an arrow, the projected value
 * (headline), and a signed change pill coloured by whether the change is GOOD.
 *
 * `betterWhen` declares the metric's polarity so each tile decides its own
 * "improvement" direction WITHOUT confusing FIT (higher better) with 공백 /
 * 자기부담금 (lower better). The pill turns success-green only when the move is in
 * the good direction; a no-change move is neutral. Numbers stay neutral; only the
 * delta pill carries colour (signed-delta exception).
 */

import { motion, useReducedMotion } from "motion/react";

import { cn } from "../../lib/cn";

export interface MetricCompareCardProps {
  label: string;
  before: number;
  after: number;
  /** Render a raw number into display text (e.g. "%" suffix, 만원 formatting). */
  format: (value: number) => string;
  /** Which direction counts as improvement. */
  betterWhen: "higher" | "lower";
  /** Optional sub-caption under the metric (e.g. "6개 항목 기준"). */
  caption?: string;
  /** Make this tile the visual hero (bigger projected number). */
  emphasis?: boolean;
  className?: string;
}

export function MetricCompareCard({
  label,
  before,
  after,
  format,
  betterWhen,
  caption,
  emphasis = false,
  className,
}: MetricCompareCardProps) {
  const reduce = useReducedMotion();
  const diff = after - before;
  const improved = betterWhen === "higher" ? diff > 0 : diff < 0;
  const unchanged = diff === 0;

  // Magnitude is always shown as a positive number with a direction glyph.
  const magnitude = format(Math.abs(diff));
  const arrowGlyph = diff === 0 ? "" : diff > 0 ? "▲" : "▼";

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl bg-white px-6 py-5 shadow-card",
        className,
      )}
    >
      <span className="text-[14px] font-semibold text-neutral-500">{label}</span>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[18px] font-bold text-neutral-300 tabular-nums">
          {format(before)}
        </span>
        <Arrow />
        <motion.span
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "font-extrabold tracking-tight text-neutral-900 tabular-nums",
            emphasis ? "text-[34px] leading-none" : "text-[26px] leading-none",
          )}
        >
          {format(after)}
        </motion.span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!unchanged && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums",
              improved
                ? "bg-success-50 text-success-600"
                : "bg-neutral-100 text-neutral-500",
            )}
          >
            <span aria-hidden className="text-[9px]">{arrowGlyph}</span>
            {magnitude}
          </span>
        )}
        {unchanged && (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-400">
            변화 없음
          </span>
        )}
        {caption && <span className="text-[12px] text-neutral-400">{caption}</span>}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 self-center text-neutral-300"
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

export default MetricCompareCard;
