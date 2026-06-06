/**
 * `StepHeader` — top-of-page progress indicator for the RiskFit wizard.
 *
 * Sticks to the very top of the scroll container (just under the viewport
 * edge) with a thin progress bar showing position in the 7-step flow:
 * Landing → InputBasic → InputHealthLifestyle → InputFamilyHistory →
 * InputInsurance → Analyzing → Result. A small "current / total" caption
 * and an optional back button sit above the bar.
 *
 * The component is presentation-only — pages own navigation decisions
 * and pass an `onBack` callback (or omit it on step 1).
 */

import { ChevronLeft } from "lucide-react";

import { Progress } from "../ui/progress";
import { cn } from "../../lib/cn";

export interface StepHeaderProps {
  /** 1-based current step number. */
  step: number;
  /** Total step count — usually 7. */
  total?: number;
  /** Optional callback for the back chevron. If omitted, no back button is rendered. */
  onBack?: () => void;
  className?: string;
}

export function StepHeader({
  step,
  total = 7,
  onBack,
  className,
}: StepHeaderProps) {
  const percent = Math.round((step / total) * 100);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 -mx-5 bg-neutral-50/95 px-5 pt-4 pb-3 backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="이전 단계로"
            className={cn(
              "-ml-2 inline-flex h-10 w-10 items-center justify-center",
              "rounded-full text-neutral-700",
              "transition-colors duration-150",
              "hover:bg-neutral-100 active:bg-neutral-200",
              "focus-visible:outline-none",
            )}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} aria-hidden />
          </button>
        ) : (
          <span className="inline-block h-10 w-10" aria-hidden />
        )}

        <span className="text-xs font-medium tabular-nums text-neutral-600">
          {step} / {total}
        </span>

        {/* Spacer to balance the back chevron so the caption stays centred. */}
        <span className="inline-block h-10 w-10" aria-hidden />
      </div>

      <Progress
        value={percent}
        className="mt-3 h-1.5 bg-neutral-200"
        aria-label={`진행률 ${percent}%`}
      />
    </header>
  );
}

export default StepHeader;
