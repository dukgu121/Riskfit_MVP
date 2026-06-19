/**
 * `AmountInput` — a numeric money field with thousands-separator display and a
 * unit suffix (만원 / 원/일 / 원/월 …). Mirrors `Input`'s Toss chrome (1.5px
 * border, brand focus ring) and keeps a clean numeric model: the parent holds
 * a `number | null`, the field shows it grouped with commas.
 *
 * The displayed value is the *form* value (e.g. whole 만원), not stored 원 —
 * conversion to/from 원 stays in `lib/insuranceForm.ts` (`toStoredAmount` /
 * `fromStoredAmount`). This component is unit-agnostic: pass the already-scaled
 * number + the suffix string.
 */

import * as React from "react";

import { cn } from "../../lib/cn";

const grouper = new Intl.NumberFormat("ko-KR");

function formatGrouped(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  return grouper.format(value);
}

/** Parse a possibly-grouped numeric string into a finite number or null. */
function parseGrouped(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export interface AmountInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type" | "size"
  > {
  /** Current numeric value (form units, e.g. whole 만원). `null` = empty. */
  value: number | null;
  /** Called with the parsed number (or null when cleared). */
  onValueChange: (value: number | null) => void;
  /** Suffix shown inside the field (e.g. "만원", "원/일"). */
  suffix?: string;
  state?: "default" | "error" | "success";
  className?: string;
}

const stateStyles: Record<
  NonNullable<AmountInputProps["state"]>,
  string
> = {
  default:
    "border-neutral-200 hover:border-neutral-300 focus-within:border-brand-500 focus-within:shadow-[var(--shadow-input-focus)]",
  error:
    "border-danger-500 hover:border-danger-500 focus-within:border-danger-500 focus-within:shadow-[var(--shadow-focus-danger)]",
  success: "border-success-500 hover:border-success-500",
};

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  (
    { value, onValueChange, suffix, state = "default", className, disabled, ...props },
    ref,
  ) => {
    return (
      <div
        className={cn(
          "flex h-14 w-full items-center rounded-md border-[1.5px] bg-white px-4",
          "transition-[border-color,box-shadow] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "focus-within:outline-none",
          disabled &&
            "cursor-not-allowed bg-[var(--color-disabled-surface)] border-[var(--color-disabled-border)]",
          stateStyles[state],
          className,
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={state === "error" || undefined}
          value={formatGrouped(value)}
          onChange={(e) => onValueChange(parseGrouped(e.target.value))}
          className={cn(
            "min-w-0 flex-1 bg-transparent py-3 text-lg text-right",
            "text-neutral-900 placeholder:text-neutral-400 caret-brand-500",
            "tabular-nums focus:outline-none",
            "disabled:cursor-not-allowed disabled:text-[var(--color-disabled-fg)]",
          )}
          {...props}
        />
        {suffix && (
          <span className="ml-2 shrink-0 text-base font-medium text-neutral-500">
            {suffix}
          </span>
        )}
      </div>
    );
  },
);
AmountInput.displayName = "AmountInput";

export default AmountInput;
