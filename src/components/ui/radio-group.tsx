import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "../../lib/cn";

/**
 * RadioGroup — Toss-style single-select control.
 *
 * Mirrors Checkbox's focus + disabled treatment so the two primitives feel
 * interchangeable in a form. The inner dot uses the spring duration on
 * scale so the "tick" feels physical without being bouncy.
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-3", className)}
    {...props}
  />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "aspect-square h-6 w-6 shrink-0 rounded-full border-2 border-neutral-300 bg-white",
      "transition-[border-color,box-shadow] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
      "hover:border-neutral-400",
      "focus:outline-none focus-visible:border-brand-500 focus-visible:shadow-[var(--shadow-focus)]",
      "data-[state=checked]:border-brand-500",
      "disabled:cursor-not-allowed disabled:bg-[var(--color-disabled-surface)] disabled:border-[var(--color-disabled-border)]",
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="h-3 w-3 rounded-full bg-brand-500" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
