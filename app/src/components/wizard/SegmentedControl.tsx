/**
 * `SegmentedControl` — a row of large chips, one selected at a time.
 *
 * Used for binary or 3–5-way categorical inputs (성별, 흡연, 운동 빈도,
 * 스트레스, 야근, …). Behaves like a single-select radio group but is sized for
 * thumbs — minimum 56px touch target per chip. The selected chip carries the
 * brand wash/border; everything else is a quiet neutral outline.
 */

import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface SegmentedOption<V extends string> {
  value: V;
  label: ReactNode;
  /** Optional short helper rendered below the main label (e.g. 시간/빈도 안내). */
  hint?: ReactNode;
}

export interface SegmentedControlProps<V extends string> {
  /** Identifier used for `aria-labelledby` linkage. Optional. */
  id?: string;
  /** Accessible group label — usually the parent FieldGroup handles it. */
  ariaLabel?: string;
  /** Current selected value (undefined = nothing selected). */
  value?: V;
  /** Available options. */
  options: ReadonlyArray<SegmentedOption<V>>;
  /** Called when the user picks a chip. */
  onChange: (value: V) => void;
  /**
   * Layout: "row" lays chips side-by-side and asks each to grow equally
   * (good for 2–3 options); "grid" lays them in 2 columns (good for 4+).
   */
  layout?: "row" | "grid";
  className?: string;
}

export function SegmentedControl<V extends string>({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  layout = "row",
  className,
}: SegmentedControlProps<V>) {
  // `id` is intentionally forwarded so a parent <FieldGroup htmlFor=… />
  // can target the group for screen-reader linkage even though we expose a
  // radiogroup rather than a native <input>.
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        layout === "row"
          ? "grid auto-cols-fr grid-flow-col gap-2"
          : "grid grid-cols-2 gap-2",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex min-h-[56px] flex-col items-center justify-center",
              "rounded-xl px-3 py-2 text-center",
              "transition-[background-color,border-color,color,transform] duration-150",
              "active:scale-[0.98]",
              selected
                ? "border-2 border-brand-500 bg-brand-50 text-brand-700"
                : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
            )}
          >
            <span
              className={cn(
                "text-base leading-tight",
                selected ? "font-semibold" : "font-medium",
              )}
            >
              {option.label}
            </span>
            {option.hint ? (
              <span
                className={cn(
                  "mt-1 text-xs",
                  selected ? "text-brand-700/80" : "text-neutral-500",
                )}
              >
                {option.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
