/**
 * `CoverageItemRow` — one row inside a `RiskFactorCard`, showing how the
 * user's current coverage stacks up against the standard for a single
 * coverage type (실손, 암 진단비, 질병 입원비, ...).
 *
 * Layout: label on the left, value on the right, full-width bar below.
 * The bar's colour reflects the band (sufficient/caution/insufficient) —
 * the score number stays neutral-900 per Toss rule.
 */

import type { CoverageFitItem } from "../../types";
import { CoverageBar } from "../charts/CoverageBar";
import { cn } from "../../lib/cn";

export interface CoverageItemRowProps {
  item: CoverageFitItem;
  className?: string;
}

const KRW_UNITS: Record<string, string> = {
  krw: "원",
  krw_per_event: "원",
  krw_per_day: "원/일",
  krw_per_month: "원/월",
  presence: "",
};

function formatAmount(value: number): string {
  if (value <= 0) return "0";
  const eok = value / 100_000_000;
  if (eok >= 1) {
    const display = eok % 1 === 0 ? eok.toFixed(0) : eok.toFixed(1);
    return `${display}억`;
  }
  const manwon = Math.round(value / 10_000);
  return `${manwon.toLocaleString("ko-KR")}만`;
}

function describeCurrent(item: CoverageFitItem): string {
  if (typeof item.current === "boolean") {
    return item.current ? "가입함" : "미가입";
  }
  if (item.current <= 0) return "0원";
  const unit = KRW_UNITS[item.unit] ?? "원";
  return `${formatAmount(item.current)} ${unit}`.trim();
}

function describeStandard(item: CoverageFitItem): string {
  if (typeof item.standard === "boolean") {
    return item.standard ? "필요" : "선택";
  }
  if (item.standard === null) return "기준 없음";
  if (item.standard <= 0) return "0원";
  const unit = KRW_UNITS[item.unit] ?? "원";
  return `${formatAmount(item.standard)} ${unit}`.trim();
}

export function CoverageItemRow({ item, className }: CoverageItemRowProps) {
  const isPresence = typeof item.current === "boolean";
  const current = describeCurrent(item);
  const standard = describeStandard(item);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-neutral-700">{item.label}</p>
        <p className="text-sm tabular-nums text-neutral-500">
          <span className="font-semibold text-neutral-900">{current}</span>
          {!isPresence && (
            <span className="ml-1 text-neutral-500">/ {standard}</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <CoverageBar
          value={item.fit}
          band={item.band}
          ariaLabel={`${item.label} 적합도 ${item.fit}퍼센트, ${item.bandLabel}`}
          className="flex-1"
        />
        <span className="w-10 text-right text-sm font-semibold tabular-nums text-neutral-900">
          {item.fit}%
        </span>
      </div>
    </div>
  );
}

export default CoverageItemRow;
