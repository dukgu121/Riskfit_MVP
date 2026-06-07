/**
 * `FieldGroup` — label + input + helper text wrapper used throughout the
 * RiskFit wizard.
 *
 * Toss rules baked in:
 *   - Label sits *above* the input (no placeholder-as-label).
 *   - Label is 13px / Medium / `--gray-700`; the input it labels uses the
 *     standard 17–18px reading size from the shared <Input/> component.
 *   - Optional "(선택)" suffix and helper text below the input keep the
 *     pattern consistent — no surprise marks that would scare a user.
 *
 * The component is intentionally a pure layout primitive. It does *not*
 * render an `<input>` — pages compose it with the platform Input/Select/
 * SegmentedControl. The `htmlFor` prop is forwarded to the `<label>` so
 * screen readers connect the label to whichever control the page renders.
 */

import type { ReactNode } from "react";

import { Label } from "../ui/label";
import { cn } from "../../lib/cn";

export interface FieldGroupProps {
  /** The visible label text — keep it short, Toss-style. */
  label: ReactNode;
  /** When true, appends a muted "(선택)" suffix. */
  optional?: boolean;
  /** Optional helper text shown below the control in gray-500. */
  helperText?: ReactNode;
  /** Optional error text (renders red, overrides helperText visibility). */
  errorText?: ReactNode;
  /** ID of the control this label is for. Forwarded to <Label htmlFor=…/>. */
  htmlFor?: string;
  /** The actual input / select / segmented control. */
  children: ReactNode;
  className?: string;
}

export function FieldGroup({
  label,
  optional,
  helperText,
  errorText,
  htmlFor,
  children,
  className,
}: FieldGroupProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[13px] font-medium text-neutral-700"
      >
        <span>{label}</span>
        {optional ? (
          <span className="text-[13px] font-normal text-neutral-500">
            (선택)
          </span>
        ) : null}
      </Label>
      {children}
      {errorText ? (
        <p className="text-xs font-medium text-semantic-danger">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export default FieldGroup;
