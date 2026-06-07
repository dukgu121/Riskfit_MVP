import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "../../lib/cn";

/**
 * Progress — determinate horizontal progress bar.
 *
 * Micro-detail notes:
 * - The indicator fill uses `transform: translateX(-X%)` so we paint the
 *   width once and only animate composite-cheap transforms. This is the
 *   Toss approach for any progress UI.
 * - Transition uses ease-out-expo at 320ms so a value jump from 20→80 still
 *   *feels* fast at the start but lands gently — never linear, which reads
 *   robotic.
 * - Indicator inherits a slight rounded right edge via `rounded-r-full` so
 *   even at intermediate values the leading edge looks soft, not chopped.
 */
export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => {
  const safeValue = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={safeValue}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-neutral-100",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full rounded-r-full bg-brand-500",
          "transition-transform duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
