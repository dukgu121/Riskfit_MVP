/**
 * `DisclaimerBanner` — sticky neutral-100 banner that lives directly under
 * the result-page header. Visible on every tab (대시보드/상세/리포트/체크) so
 * the legal framing never drops below the fold.
 *
 * Renders the canonical `result_banner` disclaimer text from `disclaimers.json`.
 */

import { Info } from "lucide-react";

import disclaimers from "../../data/disclaimers.json";
import { cn } from "../../lib/cn";

const RESULT_BANNER_FALLBACK =
  "참고용 결과입니다. 특정 상품 가입을 권하지 않아요.";

const bannerText =
  disclaimers.find((item) => item.id === "result_banner")?.text ??
  RESULT_BANNER_FALLBACK;

export interface DisclaimerBannerProps {
  className?: string;
}

export function DisclaimerBanner({ className }: DisclaimerBannerProps) {
  return (
    <div
      role="note"
      aria-label="결과 면책 안내"
      className={cn(
        "sticky top-0 z-30",
        "flex items-start gap-2 rounded-xl",
        "bg-neutral-100 px-4 py-3",
        "text-sm leading-snug text-neutral-700",
        className,
      )}
    >
      <Info
        aria-hidden
        className="mt-1 size-4 shrink-0 text-neutral-500"
        strokeWidth={2}
      />
      <p className="flex-1">{bannerText}</p>
    </div>
  );
}

export default DisclaimerBanner;
