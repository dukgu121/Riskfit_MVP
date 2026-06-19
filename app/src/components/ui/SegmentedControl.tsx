/**
 * `SegmentedControl` (ui kit) — a 2–3 option sliding-pill selector. Distinct
 * from the wizard's chip-grid `SegmentedControl`: this is the compact "tab
 * switch" form where a single brand pill slides between options via motion
 * `layoutId`. Used for 연령대 / before-after toggles / small binary switches.
 *
 * The track is a neutral-100 rail; the active segment shows a white pill (the
 * sliding element) with the brand label. `prefers-reduced-motion` drops the
 * slide to an instant swap. Generic over the option value type.
 */

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../../lib/cn";

export interface SegmentOption<V extends string> {
  value: V;
  label: React.ReactNode;
}

export interface SegmentedControlProps<V extends string> {
  value: V;
  options: ReadonlyArray<SegmentOption<V>>;
  onChange: (value: V) => void;
  ariaLabel?: string;
  /** Visual size. */
  size?: "sm" | "default";
  className?: string;
}

export function SegmentedControl<V extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = "default",
  className,
}: SegmentedControlProps<V>) {
  const groupId = useId();
  const reduce = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-grid w-full auto-cols-fr grid-flow-col gap-1 rounded-full bg-neutral-100 p-1",
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
              "relative flex items-center justify-center rounded-full text-center font-semibold",
              "transition-colors duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              "focus:outline-none focus-visible:shadow-[var(--shadow-focus)]",
              size === "sm" ? "h-9 px-3 text-[13px]" : "h-11 px-4 text-[15px]",
              selected ? "text-brand-700" : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {selected && (
              <motion.span
                layoutId={`segmented-pill-${groupId}`}
                className="absolute inset-0 rounded-full bg-white shadow-card"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
