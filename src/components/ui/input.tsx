import * as React from "react";

import { cn } from "../../lib/cn";

/**
 * Input — Toss-style text field.
 *
 * Micro-detail notes:
 * - 1.5px border (`border-[1.5px]`) makes the active state visible without
 *   shifting layout. Tailwind's default 1px feels under-stated next to
 *   16px input text on bright surfaces.
 * - Focus draws a 3px brand ring via the design-token `--shadow-input-focus`
 *   plus the active brand border. Together they read as "this field is hot"
 *   from across the screen, but never push siblings.
 * - `caret-brand-500` ties the cursor colour to the brand. Default OS carets
 *   are inconsistent (sometimes black, sometimes inverted), which breaks
 *   the Toss aesthetic.
 * - Disabled uses the neutral surface + muted text tokens rather than
 *   opacity-50 — see button.tsx for the same rationale.
 * - Hover only deepens the border one step (neutral-300) — Toss never
 *   reshapes hover; it only nudges colour.
 */
type InputState = "default" | "error" | "success";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  state?: InputState;
}

const stateStyles: Record<InputState, string> = {
  default:
    "border-neutral-200 hover:border-neutral-300 focus:border-brand-500 focus:shadow-[var(--shadow-input-focus)]",
  error:
    "border-danger-500 hover:border-danger-500 focus:border-danger-500 focus:shadow-[var(--shadow-focus-danger)]",
  success:
    "border-success-500 hover:border-success-500 focus:border-success-500",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", state = "default", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={state === "error" || undefined}
        className={cn(
          "flex h-14 w-full rounded-md border-[1.5px] bg-white px-4 py-3 text-lg",
          "text-neutral-900 placeholder:text-neutral-400 caret-brand-500",
          "transition-[border-color,box-shadow] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-[var(--color-disabled-surface)] disabled:text-[var(--color-disabled-fg)] disabled:border-[var(--color-disabled-border)]",
          "tabular-nums",
          stateStyles[state],
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
