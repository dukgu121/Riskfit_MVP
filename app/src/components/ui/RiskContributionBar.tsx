/**
 * `RiskContributionBar` — a labelled risk-contribution row: factor label, an
 * explicit signed `+N` delta, and a horizontal magnitude bar. Distinct from
 * `CoverageBar` (unsigned 0–100 fit): this shows how much a factor ADDS to the
 * 위험점수, so it always reads `+N` (FROZEN contract: every `scoringRules`
 * value ≥ 0, so good areas read LOW, never negative — band/colour conveys
 * good vs bad, not the sign).
 *
 * Colour: pass an explicit `band`, or let it derive from the delta's share of
 * `max` (low neutral/blue, mid warn, high danger). Bar width = `delta/max`.
 */

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "../../lib/cn";

export type ContributionBand = "low" | "medium" | "high";

export interface RiskContributionBarProps {
  /** Factor name (e.g. "흡연", "BMI"). */
  label: ReactNode;
  /** Contribution to the risk score (≥ 0). Rendered as `+N`. */
  delta: number;
  /** Scale max for the bar width (default 30). */
  max?: number;
  /**
   * Override the colour band. When omitted it derives from `delta/max`:
   *   < 0.34 low, < 0.67 medium, else high.
   */
  band?: ContributionBand;
  /** Optional leading glyph/icon. */
  icon?: ReactNode;
  /** Optional right caption (e.g. "추정") shown next to the delta. */
  note?: ReactNode;
  className?: string;
}

const barColor: Record<ContributionBand, string> = {
  low: "var(--color-brand-400)",
  medium: "var(--color-semantic-warn)",
  high: "var(--color-semantic-danger)",
};

const deltaText: Record<ContributionBand, string> = {
  low: "text-neutral-700",
  medium: "text-warn-600",
  high: "text-danger-500",
};

function deriveBand(delta: number, max: number): ContributionBand {
  const r = max > 0 ? delta / max : 0;
  if (r < 0.34) return "low";
  if (r < 0.67) return "medium";
  return "high";
}

export function RiskContributionBar({
  label,
  delta,
  max = 30,
  band,
  icon,
  note,
  className,
}: RiskContributionBarProps) {
  const safeDelta = Math.max(0, delta);
  const resolved = band ?? deriveBand(safeDelta, max);
  const target = Math.max(0, Math.min(100, (safeDelta / (max || 1)) * 100));

  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setWidth(target));
    return () => window.cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          {icon != null && <span className="shrink-0">{icon}</span>}
          <span className="truncate text-[15px] font-medium text-neutral-800">
            {label}
          </span>
        </span>
        <span className="flex shrink-0 items-baseline gap-1.5">
          {note != null && (
            <span className="text-[11px] font-medium text-neutral-400">
              {note}
            </span>
          )}
          <span
            className={cn(
              "text-[15px] font-bold tabular-nums",
              deltaText[resolved],
            )}
          >
            +{Math.round(safeDelta)}
          </span>
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            backgroundColor: barColor[resolved],
            transition: "width 600ms cubic-bezier(0.25,1,0.5,1)",
          }}
        />
      </div>
    </div>
  );
}

export default RiskContributionBar;
