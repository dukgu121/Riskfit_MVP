/**
 * `TriStateRow` — a labelled 3-way 선택 row (없음 / 있음 / 모름) for the 가족력
 * screen. Each condition gets a row: the name on the left, a 3-segment selector
 * on the right. The 모름 ("unknown") option lets the user decline per-condition
 * without skewing toward 없음.
 *
 * Selected visuals follow the wizard chip convention (brand-50 wash, brand-500
 * text), but compact and inline so a stack of rows reads as a tidy list.
 */

import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export type TriState = "none" | "yes" | "unknown";

export interface TriStateRowProps {
  /** Condition / question label. */
  label: ReactNode;
  /** Optional secondary line. */
  hint?: ReactNode;
  value: TriState;
  onChange: (value: TriState) => void;
  /** Override the option labels (defaults 없음/있음/모름). */
  labels?: Partial<Record<TriState, string>>;
  className?: string;
}

const ORDER: TriState[] = ["none", "yes", "unknown"];
const DEFAULT_LABELS: Record<TriState, string> = {
  none: "없음",
  yes: "있음",
  unknown: "모름",
};

export function TriStateRow({
  label,
  hint,
  value,
  onChange,
  labels,
  className,
}: TriStateRowProps) {
  const resolved = { ...DEFAULT_LABELS, ...labels };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-[16px] font-semibold text-neutral-900">
          {label}
        </span>
        {hint != null && (
          <span className="mt-0.5 block text-[13px] text-neutral-400">
            {hint}
          </span>
        )}
      </span>

      <div
        role="radiogroup"
        aria-label={typeof label === "string" ? label : undefined}
        className="grid w-full shrink-0 auto-cols-fr grid-flow-col gap-1.5 sm:w-auto sm:min-w-[252px]"
      >
        {ORDER.map((state) => {
          const selected = state === value;
          return (
            <button
              key={state}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(state)}
              className={cn(
                "flex h-11 items-center justify-center rounded-xl px-3 text-[14px] font-semibold",
                "transition-[background-color,border-color,color,transform] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                "active:scale-[0.98] focus:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                selected
                  ? "border-[1.5px] border-brand-500 bg-brand-50 text-brand-700"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
              )}
            >
              {resolved[state]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TriStateRow;
