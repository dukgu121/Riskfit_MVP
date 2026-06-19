/**
 * `KpiRow` / `KpiTile` — a compact grid of headline stats for the final report
 * (p26) and premium report (p29). Each tile is one fact: a label, a big tabular
 * value, and an optional sub-caption / delta.
 *
 * Toss tone: neutral surface tiles, one big number each, colour reserved for an
 * optional signed delta (the only coloured element).
 */

import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface KpiTileData {
  id: string;
  label: ReactNode;
  value: ReactNode;
  /** Small unit after the value (kept smaller / muted). */
  unit?: ReactNode;
  caption?: ReactNode;
  /** Optional tinted accent for the value (e.g. a band colour). */
  tone?: "neutral" | "brand" | "success" | "warn" | "danger" | "premium";
}

const VALUE_TONE: Record<NonNullable<KpiTileData["tone"]>, string> = {
  neutral: "text-neutral-900",
  brand: "text-brand-500",
  success: "text-success-600",
  warn: "text-warn-600",
  danger: "text-danger-500",
  premium: "text-premium-600",
};

export function KpiTile({ label, value, unit, caption, tone = "neutral" }: KpiTileData) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-neutral-50 px-4 py-4">
      <span className="text-[12px] font-medium text-neutral-400">{label}</span>
      <span className="flex items-baseline gap-0.5">
        <span
          className={cn(
            "text-[24px] font-extrabold leading-none tracking-tight tabular-nums",
            VALUE_TONE[tone],
          )}
        >
          {value}
        </span>
        {unit != null && (
          <span className="text-[14px] font-bold text-neutral-300">{unit}</span>
        )}
      </span>
      {caption != null && (
        <span className="text-[12px] text-neutral-400">{caption}</span>
      )}
    </div>
  );
}

export interface KpiRowProps {
  tiles: KpiTileData[];
  /** Columns at the sm+ breakpoint (default = tiles.length, capped at 4). */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

export function KpiRow({ tiles, columns, className }: KpiRowProps) {
  const cols = columns ?? (Math.min(4, Math.max(2, tiles.length)) as 2 | 3 | 4);
  return (
    <div className={cn("grid grid-cols-2 gap-2.5", COLS[cols], className)}>
      {tiles.map((tile) => (
        <KpiTile key={tile.id} {...tile} />
      ))}
    </div>
  );
}

export default KpiRow;
