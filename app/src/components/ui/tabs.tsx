import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../../lib/cn";

/**
 * Tabs — Toss-style underline tab bar.
 *
 * Micro-detail notes:
 * - The active underline is a 2px pseudo-element drawn with an explicit
 *   `h-[2px]` so the weight reads identically regardless of Tailwind's
 *   spacing scale conventions and keeps us out of half-step territory.
 * - Underline transition is `transform` (scaleX) rather than colour so the
 *   line *slides* between active tabs instead of cross-fading — this is
 *   Toss's tab signature.
 * - Focus-visible draws a brand halo on the trigger; the underline itself
 *   keeps its colour cue so the two states stack.
 */
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative inline-flex h-12 items-stretch gap-1",
      "border-b border-neutral-100",
      "overflow-x-auto scrollbar-none",
      "w-full",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center",
      "px-4 py-3 text-base font-semibold whitespace-nowrap",
      "rounded-t-md",
      "text-neutral-500 hover:text-neutral-700",
      "transition-colors duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
      "focus:outline-none focus-visible:text-neutral-900 focus-visible:shadow-[var(--shadow-focus)]",
      "data-[state=active]:text-neutral-900",
      // 2px underline via scaleX transition — slides on activation.
      "after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full",
      "after:bg-neutral-900 after:origin-center after:scale-x-0",
      "after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.16,1,0.3,1)]",
      "data-[state=active]:after:scale-x-100",
      "disabled:pointer-events-none disabled:text-[var(--color-disabled-fg)]",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 focus:outline-none",
      "data-[state=inactive]:hidden",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
