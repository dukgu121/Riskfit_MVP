import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "../../lib/cn";

/**
 * Checkbox — Toss-style boolean toggle.
 *
 * Micro-detail notes:
 * - Keeps the 2px border so it reads as a control even at rest. 1.5px is
 *   too whispery on a 24px square against bright surfaces.
 * - Focus-visible adds the 4px brand halo via `--shadow-focus` so keyboard
 *   users always know which checkbox is "armed".
 * - Disabled state uses neutral-200 fill (token) rather than opacity-50.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-6 shrink-0 items-center justify-center",
      "rounded-md border-2 border-neutral-300 bg-white",
      "transition-[background-color,border-color,box-shadow] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
      "hover:border-neutral-400",
      "focus:outline-none focus-visible:border-brand-500 focus-visible:shadow-[var(--shadow-focus)]",
      "data-[state=checked]:bg-brand-500 data-[state=checked]:border-brand-500",
      "data-[state=checked]:text-white",
      "disabled:cursor-not-allowed disabled:bg-[var(--color-disabled-surface)] disabled:border-[var(--color-disabled-border)] disabled:text-[var(--color-disabled-fg)]",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="h-4 w-4" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
