/**
 * `PremiumSurface` — a calm premium-tinted card surface with a flat crown
 * glyph. Differentiates the Premium tier (p27–p29) WITHOUT the PDF's purple
 * gradient (OD-8): a soft `premium-50` wash + a `premium-500` crown. Primary
 * CTAs inside stay brand blue so single-accent action discipline holds — this
 * component only sets the surface, not the buttons.
 *
 * Use as a section wrapper for premium upsell / lifecycle framing. The crown is
 * optional and can be hidden for a plainer tinted panel.
 */

import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface PremiumSurfaceProps {
  /** Small eyebrow label above the title (e.g. "RiskFit Premium"). */
  eyebrow?: ReactNode;
  title?: ReactNode;
  /** Hide the leading crown glyph. */
  hideCrown?: boolean;
  className?: string;
  children?: ReactNode;
}

export function PremiumSurface({
  eyebrow,
  title,
  hideCrown = false,
  className,
  children,
}: PremiumSurfaceProps) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-premium-50 px-7 py-6",
        className,
      )}
    >
      {(eyebrow != null || title != null || !hideCrown) && (
        <div className="flex items-center gap-3">
          {!hideCrown && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-premium-100 text-premium-600">
              <Crown />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow != null && (
              <span className="block text-[12px] font-bold uppercase tracking-wide text-premium-600">
                {eyebrow}
              </span>
            )}
            {title != null && (
              <h2 className="text-[18px] font-bold tracking-tight text-neutral-900">
                {title}
              </h2>
            )}
          </div>
        </div>
      )}
      {children != null && (
        <div className={cn(eyebrow != null || title != null || !hideCrown ? "mt-5" : "")}>
          {children}
        </div>
      )}
    </section>
  );
}

/** Flat duotone crown — no gradient, single premium accent. */
function Crown() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 8l4 4 5-7 5 7 4-4-1.5 11h-15L3 8z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path
        d="M3 8l4 4 5-7 5 7 4-4-1.5 11h-15L3 8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default PremiumSurface;
