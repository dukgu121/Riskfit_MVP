/**
 * `InsuranceHubRow` — one of the fixed 6 rows on the 보험 hub (p8).
 *
 * Shows the 보장 label + a short "what it covers" line, a status pill
 * (입력완료 / 미가입 / 미입력), and a band badge when the user has entered an
 * amount. The whole row is a `Link` to that type's 세부 screen ("입력하기").
 *
 * Visual language matches the gold reference's priority rows: a neutral leading
 * chip, rounded-2xl hover, neutral-300 chevron, single brand accent. Band
 * colour (충분/주의/부족) is the only colour, carried by the `Badge`.
 */

import { Link } from "react-router-dom";

import { Badge } from "../ui/badge";
import { cn } from "../../lib/cn";
import type { CoverageBandId } from "../../types";
import type { HubRowState } from "./coverageSubMeta";

const BADGE_VARIANT: Record<CoverageBandId, "success" | "warn" | "danger" | "info"> = {
  sufficient: "success",
  caution: "warn",
  insufficient: "danger",
  excessive: "info",
};

export interface InsuranceHubRowProps {
  row: HubRowState;
  /** Target route for "입력하기" (e.g. /input/insurance/cancer). */
  to: string;
}

export function InsuranceHubRow({ row, to }: InsuranceHubRowProps) {
  const done = row.status !== "untouched";

  return (
    <Link
      to={to}
      aria-label={`${row.label} 입력하기`}
      className={cn(
        "group flex items-center gap-4 rounded-2xl px-3 py-3.5 text-left",
        "transition-colors hover:bg-neutral-50 active:bg-neutral-100",
        "focus:outline-none focus-visible:shadow-[var(--shadow-focus)]",
      )}
    >
      {/* Leading status chip */}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          done ? "bg-brand-50 text-brand-500" : "bg-neutral-100 text-neutral-300",
        )}
        aria-hidden
      >
        {done ? <CheckGlyph /> : <DotGlyph />}
      </span>

      {/* Title + description */}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[16px] font-semibold text-neutral-900">
            {row.label}
          </span>
          {row.band && row.bandLabel && (
            <Badge variant={BADGE_VARIANT[row.band]} size="sm">
              {row.bandLabel}
            </Badge>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-neutral-400">
          {row.description}
        </span>
      </span>

      {/* Meta: status / summary + chevron */}
      <span className="flex shrink-0 items-center gap-2 text-right">
        <span className="flex flex-col items-end">
          <StatusLabel row={row} />
          {row.status === "joined" && (
            <span className="mt-0.5 text-[12px] tabular-nums text-neutral-400">
              {row.summary}
            </span>
          )}
        </span>
        <Chevron />
      </span>
    </Link>
  );
}

function StatusLabel({ row }: { row: HubRowState }) {
  if (row.status === "joined") {
    return (
      <span className="text-[13px] font-semibold text-brand-500">입력완료</span>
    );
  }
  if (row.status === "declined") {
    return (
      <span className="text-[13px] font-semibold text-neutral-500">미가입</span>
    );
  }
  return <span className="text-[13px] font-medium text-neutral-400">미입력</span>;
}

function CheckGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5"
    >
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default InsuranceHubRow;
