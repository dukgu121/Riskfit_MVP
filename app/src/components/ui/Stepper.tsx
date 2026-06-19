/**
 * `Stepper` — a `−  value  +` numeric stepper, sized for the 부양가족 count and
 * similar small bounded integers. Toss-minimal: two round neutral buttons
 * flanking a big tabular value, with press feedback and min/max clamping.
 */

import { cn } from "../../lib/cn";

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Optional unit suffix rendered after the value (e.g. "명"). */
  suffix?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  suffix,
  ariaLabel,
  className,
  disabled = false,
}: StepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5",
        disabled && "opacity-60",
        className,
      )}
    >
      <StepButton
        sign="minus"
        onClick={dec}
        disabled={disabled || atMin}
        ariaLabel="감소"
      />
      <span className="flex min-w-[3ch] items-baseline justify-center gap-1">
        <span className="text-[24px] font-bold leading-none text-neutral-900 tabular-nums">
          {value}
        </span>
        {suffix && (
          <span className="text-[14px] font-medium text-neutral-400">
            {suffix}
          </span>
        )}
      </span>
      <StepButton
        sign="plus"
        onClick={inc}
        disabled={disabled || atMax}
        ariaLabel="증가"
      />
    </div>
  );
}

function StepButton({
  sign,
  onClick,
  disabled,
  ariaLabel,
}: {
  sign: "minus" | "plus";
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-700 shadow-xs",
        "transition-[background-color,color,transform] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:bg-neutral-100 active:scale-[0.96]",
        "focus:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-300 disabled:shadow-none disabled:active:scale-100",
      )}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 12h14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {sign === "plus" && (
          <path
            d="M12 5v14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}

export default Stepper;
