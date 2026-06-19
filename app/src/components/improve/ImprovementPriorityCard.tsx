/**
 * `ImprovementPriorityCard` — one ranked 우선 개선 항목 (p23 TOP3 / p24 list).
 *
 * Shows the rank, coverage label + band badge, the shortfall ("부족 금액" or
 * 미가입), and a `CoverageBar` of the current FIT. Optional `targetHidden`
 * collapses the recommended target behind a tap (p24 "권장 보기"), revealing the
 * standard amount + projected fit gain on demand — progressive disclosure rather
 * than dumping a number the user didn't ask for.
 *
 * Single-accent discipline: numbers stay neutral-900; only the band badge + bar
 * fill carry colour. The "권장 보기" toggle is a quiet ghost affordance.
 */

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

import type { ImprovementItem } from "../../lib/calc/improvement";
import { Badge } from "../ui/badge";
import { CoverageBar } from "../charts/CoverageBar";
import type { CoverageBandId } from "../../types";
import { cn } from "../../lib/cn";
import { formatKrw, unitSuffix } from "./format";

const BADGE_VARIANT: Record<CoverageBandId, "success" | "warn" | "danger" | "info"> = {
  sufficient: "success",
  caution: "warn",
  insufficient: "danger",
  excessive: "info",
};

const BAND_LABEL: Record<CoverageBandId, string> = {
  sufficient: "충분",
  caution: "주의",
  insufficient: "부족",
  excessive: "과도",
};

export interface ImprovementPriorityCardProps {
  rank: number;
  item: ImprovementItem;
  /** Hide the recommended target behind a "권장 보기" tap (p24). */
  targetHidden?: boolean;
  className?: string;
}

export function ImprovementPriorityCard({
  rank,
  item,
  targetHidden = false,
  className,
}: ImprovementPriorityCardProps) {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(!targetHidden);

  const missing = item.presence ? item.current <= 0 : false;
  const shortfallText = item.presence
    ? missing
      ? "현재 미가입"
      : "가입 완료"
    : `현재 ${formatKrw(item.current)}${unitSuffix(item.unit)}`;

  const targetText = item.presence
    ? "가입 권장"
    : `권장 ${formatKrw(item.standard ?? 0)}${unitSuffix(item.unit)}`;

  const gapText = item.presence
    ? null
    : `+${formatKrw(item.gapAmount)}${unitSuffix(item.unit)}`;

  return (
    <div className={cn("rounded-3xl bg-white px-6 py-5 shadow-card", className)}>
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold text-neutral-500 tabular-nums">
          {rank}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-bold text-neutral-900">{item.label}</span>
            <Badge variant={BADGE_VARIANT[item.band]} size="sm">
              {BAND_LABEL[item.band]}
            </Badge>
          </div>
          <p className="mt-0.5 text-[13px] text-neutral-400">{shortfallText}</p>
        </div>

        {gapText && (
          <div className="shrink-0 text-right">
            <span className="block text-[11px] font-medium text-neutral-400">부족 금액</span>
            <span className="text-[17px] font-bold text-neutral-900 tabular-nums">{gapText}</span>
          </div>
        )}
      </div>

      {/* current fit bar */}
      <div className="mt-4 flex items-center gap-3">
        <CoverageBar
          value={item.currentFit}
          band={item.band}
          ariaLabel={`${item.label} 현재 적합도 ${item.currentFit}%`}
        />
        <span className="w-10 shrink-0 text-right text-[13px] font-semibold tabular-nums text-neutral-500">
          {item.currentFit}
          <span className="text-neutral-300">%</span>
        </span>
      </div>

      {/* recommended target (progressive disclosure on p24) */}
      {targetHidden && (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 rounded-lg text-[13px] font-semibold text-brand-500 transition-colors hover:text-brand-600 focus:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          aria-expanded={revealed}
        >
          {revealed ? "권장 접기" : "권장 보기"}
          <Chevron open={revealed} />
        </button>
      )}

      <AnimatePresence initial={false}>
        {revealed && targetHidden && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3">
              <span className="text-[13px] font-medium text-neutral-500">{targetText}</span>
              <span className="inline-flex items-center gap-1 text-[13px] font-bold text-success-600 tabular-nums">
                채우면 +{item.fitGain}%p
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="transition-transform"
      style={{ transform: open ? "rotate(90deg)" : "none" }}
    >
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ImprovementPriorityCard;
