/**
 * `WizardCard` — a calm white section card for wizard screens (rounded-3xl,
 * shadow-card). Optional section title + helper, then the fields. Keeps every
 * input screen's sections visually identical with generous whitespace.
 */

import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface WizardCardProps {
  /** Section heading (e.g. "신상", "재무"). Optional for a plain card. */
  title?: ReactNode;
  /** Muted "(선택)" / hint suffix beside the title. */
  titleSuffix?: ReactNode;
  /** Small helper line under the title. */
  helper?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function WizardCard({
  title,
  titleSuffix,
  helper,
  className,
  children,
}: WizardCardProps) {
  return (
    <section
      className={cn("rounded-3xl bg-white px-6 py-6 shadow-card lg:px-7", className)}
    >
      {title != null && (
        <div className="mb-5">
          <h2 className="flex items-baseline gap-2 text-[17px] font-bold text-neutral-900">
            <span>{title}</span>
            {titleSuffix != null && (
              <span className="text-[13px] font-normal text-neutral-400">
                {titleSuffix}
              </span>
            )}
          </h2>
          {helper != null && (
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-400">
              {helper}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export default WizardCard;
