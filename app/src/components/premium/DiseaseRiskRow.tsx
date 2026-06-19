/**
 * `DiseaseRiskRow` — one per-disease projection row for the selected age band on
 * the 생애주기 위험 예측 screen (p28). Shows the category label (with a small
 * "예시" tag on the fabricated demo categories), a magnitude bar of the projected
 * incidence index, and a demo-mock estimated cost.
 *
 * Single-accent discipline: the bar fill carries the only colour, keyed to the
 * incidence band (low/medium/high → success/warn/danger). Numbers stay neutral.
 */

import type { DiseaseRow } from "../../lib/premium/mockData";
import { cn } from "../../lib/cn";
import { formatManwon } from "../../lib/premium/mockData";

const BAND_FILL: Record<DiseaseRow["band"], string> = {
  low: "var(--color-semantic-success)",
  medium: "var(--color-semantic-warn)",
  high: "var(--color-semantic-danger)",
};

export interface DiseaseRiskRowProps {
  row: DiseaseRow;
  className?: string;
}

export function DiseaseRiskRow({ row, className }: DiseaseRiskRowProps) {
  return (
    <div className={cn("flex items-center gap-4 py-3.5", className)}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-neutral-900">{row.label}</span>
          {row.fabricated && (
            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-400">
              예시
            </span>
          )}
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full"
            style={{ width: `${row.incidence}%`, backgroundColor: BAND_FILL[row.band] }}
          />
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span className="block text-[15px] font-bold text-neutral-900 tabular-nums">
          {row.incidence}
          <span className="text-[12px] font-medium text-neutral-300"> 지수</span>
        </span>
        <span className="text-[12px] text-neutral-400 tabular-nums">{formatManwon(row.estCost)}</span>
      </div>
    </div>
  );
}

export default DiseaseRiskRow;
