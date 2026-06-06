/**
 * `StepFooter` — sticky bottom CTA bar used on every wizard step.
 *
 * Layout:
 *   - On a desktop viewport (≥480px) the page itself is constrained to a
 *     480px column. The footer matches that column so the buttons hug the
 *     bottom of the simulated mobile frame.
 *   - On a real mobile viewport the footer spans the full width with the
 *     same 20px horizontal padding as the page body.
 *
 * Visual chrome:
 *   - White background with 95% opacity + backdrop-blur so content
 *     visually slides under the CTA when the user scrolls.
 *   - Subtle 1px top border via `border-t border-neutral-200` for
 *     elevation without a heavy shadow.
 *
 * Behaviour:
 *   - `onNext` is required; the Primary CTA is disabled until the page
 *     reports `canContinue=true`.
 *   - `onBack` is optional (omitted means "this is the first wizard step").
 *   - `helperText` shows below the buttons when the CTA is disabled,
 *     telling the user what to finish (Toss "마찰을 줄여라" rule).
 */

import type { ReactNode } from "react";

import { Button } from "../ui/button";
import { cn } from "../../lib/cn";

export interface StepFooterProps {
  /** Disable / enable the primary CTA. */
  canContinue: boolean;
  /** Called when the user taps the primary CTA. */
  onNext: () => void;
  /** Optional "이전" button. */
  onBack?: () => void;
  /** Label for the primary CTA. Defaults to "다음". */
  nextLabel?: ReactNode;
  /** Label for the back button. Defaults to "이전". */
  backLabel?: ReactNode;
  /** Helper text shown above the buttons when `canContinue=false`. */
  helperText?: ReactNode;
}

export function StepFooter({
  canContinue,
  onNext,
  onBack,
  nextLabel = "다음",
  backLabel = "이전",
  helperText,
}: StepFooterProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30",
        "border-t border-neutral-200 bg-white/95 backdrop-blur",
      )}
    >
      <div className="mx-auto w-full max-w-[480px] px-5 pt-4 pb-6">
        {!canContinue && helperText ? (
          <p className="mb-3 text-center text-xs font-medium text-neutral-500">
            {helperText}
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="h-14 w-[96px] shrink-0 text-base text-neutral-700"
            >
              {backLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            fullWidth
            className="h-14 text-[17px]"
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StepFooter;
