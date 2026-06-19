/**
 * `InfoBanner` — borderless tinted note for inline framing / disclaimers.
 *
 * Generalises `result/DisclaimerBanner` into a reusable, tone-aware banner:
 * a soft surface wash (no border per Toss "tint over stroke") + a small leading
 * glyph + free-form children. Used for "예측 추정치" / 면책 / 참고 notes across
 * the migration. Single accent discipline: tones map to token surfaces only,
 * never gradients.
 *
 *   tone="info"     brand-50 wash, brand glyph      (참고 / 안내)
 *   tone="neutral"  neutral-100 wash, muted glyph    (면책 / 일반 노트)
 *   tone="warn"     warn-50 wash, warn glyph         (주의)
 *   tone="premium"  premium-50 wash, premium glyph   (예측 추정치, Premium)
 */

import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { cn } from "../../lib/cn";

export type InfoBannerTone = "info" | "neutral" | "warn" | "premium";

export interface InfoBannerProps {
  tone?: InfoBannerTone;
  /** Optional leading icon override (defaults to an info glyph). */
  icon?: ReactNode;
  /** Hide the leading glyph entirely. */
  hideIcon?: boolean;
  className?: string;
  children: ReactNode;
}

const toneSurface: Record<InfoBannerTone, string> = {
  info: "bg-brand-50 text-brand-700",
  neutral: "bg-neutral-100 text-neutral-700",
  warn: "bg-warn-50 text-warn-700",
  premium: "bg-premium-50 text-premium-700",
};

const toneIcon: Record<InfoBannerTone, string> = {
  info: "text-brand-500",
  neutral: "text-neutral-500",
  warn: "text-warn-500",
  premium: "text-premium-500",
};

export function InfoBanner({
  tone = "neutral",
  icon,
  hideIcon = false,
  className,
  children,
}: InfoBannerProps) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2.5 rounded-2xl px-4 py-3",
        "text-[13px] leading-snug",
        toneSurface[tone],
        className,
      )}
    >
      {!hideIcon &&
        (icon ?? (
          <Info
            aria-hidden
            className={cn("mt-px size-4 shrink-0", toneIcon[tone])}
            strokeWidth={2}
          />
        ))}
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default InfoBanner;
