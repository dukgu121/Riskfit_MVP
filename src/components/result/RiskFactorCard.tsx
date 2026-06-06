/**
 * `RiskFactorCard` — one card per risk factor (건강 / 생활 / 직업 / 재무) on
 * the detail tab.
 *
 * Each card answers a single question: "이 영역의 신호가 평균보다 높을까?"
 * The card stacks:
 *   1. Factor name + 한줄 해석
 *   2. Factor score (neutral-900, tabular-nums) + band badge
 *   3. "왜?" 토글 — opens a short explanation of the inputs that drove the
 *      score. Closed by default so the card stays calm.
 *
 * Note: the per-coverage breakdown bars (CoverageItemRow) are rendered
 * by the page-level detail tab beneath these factor cards rather than
 * inside them — that keeps one card to one factor.
 */

import { useId, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

import type { RiskBandId } from "../../types";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { cn } from "../../lib/cn";

export interface RiskFactorCardProps {
  /** Short factor name e.g. "건강 신호". */
  title: string;
  /** Optional very short subtitle e.g. "BMI · 가족력 · 진료 빈도". */
  subtitle?: string;
  /** Score 0-100. */
  score: number;
  band: RiskBandId;
  bandLabel: string;
  /** One-line plain-language interpretation of the score. */
  interpretation: string;
  /** Free-form list of bullet points exposed under the "왜?" toggle. */
  reasons: string[];
}

type BadgeVariant = "success" | "warn" | "danger";

const bandStyle: Record<RiskBandId, { variant: BadgeVariant }> = {
  low: { variant: "success" },
  medium: { variant: "warn" },
  high: { variant: "danger" },
};

export function RiskFactorCard({
  title,
  subtitle,
  score,
  band,
  bandLabel,
  interpretation,
  reasons,
}: RiskFactorCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const style = bandStyle[band];

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-neutral-900 leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-medium text-neutral-500">{subtitle}</p>
          )}
        </div>
        <Badge
          size="default"
          variant={style.variant}
          aria-label={`${title} 단계 ${bandLabel}`}
        >
          {bandLabel}
        </Badge>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span
          className="text-3xl font-extrabold text-neutral-900 leading-none tabular-nums"
          style={{ letterSpacing: "-0.02em" }}
        >
          {Math.round(score)}
        </span>
        <span className="text-base font-semibold text-neutral-700 leading-none">
          점
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-700">
        {interpretation}
      </p>

      {reasons.length > 0 && (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls={detailsId}
            className={cn(
              "flex w-full items-center justify-between gap-2",
              "text-sm font-medium text-neutral-700",
              "transition-colors duration-150",
              "hover:text-neutral-900",
              "focus:outline-none focus-visible:text-neutral-900",
            )}
          >
            <span>왜 이런 점수인지</span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex"
            >
              <ChevronDown
                aria-hidden
                className="size-4 text-neutral-500"
                strokeWidth={2}
              />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                id={detailsId}
                key="content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700">
                  {reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-2 size-1 shrink-0 rounded-full bg-neutral-400"
                      />
                      <span className="flex-1">{reason}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}

export default RiskFactorCard;
