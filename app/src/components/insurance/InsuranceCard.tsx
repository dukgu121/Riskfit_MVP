/**
 * `InsuranceCard` — read-only summary tile for one registered insurance.
 *
 * One card = one fact: insurer + product line on top, coverage label as
 * the title, payout amount as the main number, monthly premium as a
 * caption. Tapping the card calls `onEdit`; the trailing trash icon
 * calls `onDelete` (page handles confirmation).
 *
 * Toss notes:
 *   - The amount is the only big number (20px / Semibold / gray-900,
 *     tabular). No colour — meaning is conveyed by the badge under it.
 *   - Card padding 24px, radius 16px (`Card` default).
 */

import { Trash2 } from "lucide-react";

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/cn";
import { formatStoredAmount, getCoverageType } from "../../lib/insuranceForm";
import type { Insurance } from "../../types";

export interface InsuranceCardProps {
  insurance: Insurance;
  onEdit: () => void;
  onDelete: () => void;
}

const krwFormatter = new Intl.NumberFormat("ko-KR");

export function InsuranceCard({
  insurance,
  onEdit,
  onDelete,
}: InsuranceCardProps) {
  const coverage = getCoverageType(insurance.coverageType);
  const amountText = formatStoredAmount(
    insurance.coverageType,
    insurance.coverageAmount,
  );

  return (
    <Card
      className={cn(
        "relative p-5",
        "transition-shadow duration-150 hover:shadow-card-hover",
      )}
    >
      {/* Whole card is tappable to open the edit modal. */}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`${insurance.productName ?? coverage.label} 수정`}
        className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none"
      />

      <div className="pointer-events-none relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-neutral-500">
              {insurance.company?.trim() || "보험사 미입력"}
              {insurance.productName?.trim()
                ? ` · ${insurance.productName.trim()}`
                : ""}
            </p>
            <h3 className="mt-1 truncate text-[17px] font-semibold text-neutral-900">
              {coverage.label}
            </h3>
          </div>
          <Badge variant="info" size="default" className="shrink-0">
            {coverage.includedInFit ? "점수 반영" : "참고"}
          </Badge>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-neutral-500">보장</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-neutral-900">
              {amountText}
            </p>
          </div>
          {insurance.monthlyPremium && insurance.monthlyPremium > 0 ? (
            <div className="text-right">
              <p className="text-xs font-medium text-neutral-500">월 보험료</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-700">
                {krwFormatter.format(Math.round(insurance.monthlyPremium))} 원
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        aria-label={`${coverage.label} 삭제`}
        className={cn(
          "absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center",
          "rounded-full text-neutral-500",
          "transition-colors duration-150",
          "hover:bg-neutral-100 hover:text-semantic-danger",
          "focus-visible:outline-none",
        )}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </Card>
  );
}

export default InsuranceCard;
