/**
 * Web-native wizard chrome for the 보험 hub + 보험 세부 chain. Two small pieces
 * sized for the centred `AppShell` container:
 *
 *   - `WizardStepHeader` — an eyebrow ("입력 5/5" or "보험 3 / 6") + a thin
 *     brand progress bar at the top of the content column.
 *   - `WizardFooter` — an in-flow action row (not fixed): an optional ghost
 *     secondary on the left and a primary CTA on the right, full-width on
 *     mobile. Used for 임시저장 / 저장하고 다음으로.
 *
 * Presentation-only; pages own navigation + persistence.
 */

import type { ReactNode } from "react";

import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/cn";

/* ------------------------------------------------------------------ */
/*  Step header                                                        */
/* ------------------------------------------------------------------ */

export interface WizardStepHeaderProps {
  /** Small caption left of the bar, e.g. "입력 5 / 5" or "보험 3 / 6". */
  eyebrow: ReactNode;
  /** 0–100 progress for the bar. */
  percent: number;
  /** Optional right caption (e.g. "남은 보장 4개"). */
  trailing?: ReactNode;
  className?: string;
}

export function WizardStepHeader({
  eyebrow,
  percent,
  trailing,
  className,
}: WizardStepHeaderProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold tabular-nums text-brand-500">
          {eyebrow}
        </span>
        {trailing != null && (
          <span className="text-[13px] font-medium text-neutral-400">
            {trailing}
          </span>
        )}
      </div>
      {/* Same shared <Progress> primitive the input wizard uses, so the 보험
          chain's step bar is visually identical (height / fill / easing). */}
      <Progress
        value={clamped}
        className="mt-2.5 h-1.5"
        aria-label={`진행률 ${Math.round(clamped)}%`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer (in-flow action row)                                        */
/* ------------------------------------------------------------------ */

export interface WizardFooterProps {
  /** Primary CTA label. */
  primaryLabel: ReactNode;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  /** Optional ghost secondary on the left (e.g. 임시저장). */
  secondaryLabel?: ReactNode;
  onSecondary?: () => void;
  /** Small helper line above the buttons. */
  helperText?: ReactNode;
  className?: string;
}

export function WizardFooter({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  helperText,
  className,
}: WizardFooterProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {helperText != null && (
        <p className="text-center text-[13px] font-medium text-neutral-400">
          {helperText}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
        {secondaryLabel != null && onSecondary && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSecondary}
            className="text-neutral-600 sm:w-[160px] sm:shrink-0"
          >
            {secondaryLabel}
          </Button>
        )}
        <Button
          type="button"
          variant="default"
          fullWidth
          disabled={primaryDisabled}
          onClick={onPrimary}
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
