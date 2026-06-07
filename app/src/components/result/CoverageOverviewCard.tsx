/**
 * `CoverageOverviewCard` — dashboard summary of "내 보장 적합도".
 *
 * One card, one fact: the overall coverage-fit percentage and which side
 * of the band it falls in. We also reveal the count of sufficient /
 * caution / weak buckets so the user immediately knows whether the next
 * action is "거의 다 됐다" or "비어 있는 게 꽤 있다", without dumping the
 * full per-coverage list (that belongs to the detail tab).
 */

import { motion } from "motion/react";

import type { CoverageBandId, CoverageFit } from "../../types";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { CoverageBar } from "../charts/CoverageBar";
import { cn } from "../../lib/cn";

export interface CoverageOverviewCardProps {
  coverageFit: CoverageFit;
}

type BadgeVariant = "success" | "warn" | "danger" | "info";

const bandStyle: Record<
  CoverageBandId,
  {
    variant: BadgeVariant;
    headline: string;
  }
> = {
  sufficient: {
    variant: "success",
    headline: "필요한 보장이 대부분 갖춰져 있어요.",
  },
  caution: {
    variant: "warn",
    headline: "몇 가지 보장을 점검해 보세요.",
  },
  insufficient: {
    variant: "danger",
    headline: "비어 있는 보장이 있어요.",
  },
  excessive: {
    variant: "info",
    headline: "필요 이상으로 보이는 보장이 있어요.",
  },
};

export function CoverageOverviewCard({
  coverageFit,
}: CoverageOverviewCardProps) {
  const band = bandStyle[coverageFit.band];

  const sufficientCount = coverageFit.sufficientCoverages.length;
  const cautionCount = coverageFit.cautionCoverages.length;
  const weakCount = coverageFit.weakCoverages.length;
  const excessiveCount = coverageFit.excessiveCoverages.length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-600">
          보장 적합도
        </p>
        <Badge
          size="default"
          variant={band.variant}
          aria-label={`적합도 ${coverageFit.bandLabel}`}
        >
          {coverageFit.bandLabel}
        </Badge>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl font-extrabold text-neutral-900 leading-none tabular-nums"
          style={{ letterSpacing: "-0.02em" }}
        >
          {coverageFit.overall}
        </motion.span>
        <span className="text-xl font-semibold text-neutral-700 leading-none">
          %
        </span>
      </div>

      <CoverageBar
        value={coverageFit.overall}
        band={coverageFit.band}
        className="mt-4"
        ariaLabel={`전체 보장 적합도 ${coverageFit.overall}퍼센트`}
      />

      <p className="mt-4 text-sm leading-relaxed text-neutral-700">
        {band.headline}
      </p>

      <dl className="mt-5 grid grid-cols-4 gap-2 text-center">
        <SummaryCell label="충분" count={sufficientCount} tone="success" />
        <SummaryCell label="주의" count={cautionCount} tone="warn" />
        <SummaryCell label="부족" count={weakCount} tone="danger" />
        <SummaryCell label="과도" count={excessiveCount} tone="info" />
      </dl>
    </Card>
  );
}

interface SummaryCellProps {
  label: string;
  count: number;
  tone: "success" | "warn" | "danger" | "info";
}

const toneColorClass: Record<SummaryCellProps["tone"], string> = {
  success: "text-success-700",
  warn: "text-warn-700",
  danger: "text-danger-700",
  info: "text-info-700",
};

function SummaryCell({ label, count, tone }: SummaryCellProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-neutral-50 px-2 py-3">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd
        className={cn(
          "text-lg font-bold tabular-nums leading-none",
          count === 0 ? "text-neutral-400" : toneColorClass[tone],
        )}
      >
        {count}
      </dd>
    </div>
  );
}

export default CoverageOverviewCard;
