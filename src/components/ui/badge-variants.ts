import { cva } from "class-variance-authority";

/**
 * Badge - small categorical/state pill.
 *
 * Toss uses badges as one-glance state markers. They never wrap and never
 * inflate the parent's line-height, so we pin a fixed height per size, set
 * `leading-none`, and truncate overflow. `max-w-full` keeps a long label from
 * breaking the parent grid.
 */
export const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1",
    "rounded-full font-semibold leading-none",
    "whitespace-nowrap select-none truncate max-w-full",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        success: "bg-success-50 text-success-700",
        warn: "bg-warn-50 text-warn-700",
        danger: "bg-danger-50 text-danger-700",
        info: "bg-brand-50 text-brand-700",
        neutral: "bg-neutral-100 text-neutral-700",
      },
      size: {
        sm: "h-5 px-2 text-[11px] [&_svg]:size-3",
        default: "h-7 px-3 text-xs [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  },
);
