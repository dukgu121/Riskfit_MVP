import { cva } from "class-variance-authority";

/**
 * Toast - bottom-anchored ephemeral notification.
 *
 * Motion strategy:
 * - Enter: slide up from below + fade in over the slow tempo so the toast
 *   feels like it physically rose from the device edge.
 * - Exit: slide out to the right + fade out at the fast tempo because the
 *   user has already read it; lingering exits feel sluggish.
 * - Swipe: bound to translate-x via Radix data attrs; during move we
 *   explicitly disable transition so the drag tracks the finger 1:1.
 *
 * The broad catch-all transition was replaced with an explicit
 * `transition-[transform,opacity]` so we never inadvertently animate
 * colour/border.
 */
export const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-center justify-between gap-3",
    "overflow-hidden rounded-lg p-4 pr-10 shadow-card-hover",
    "transition-[transform,opacity] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-80",
    "data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:duration-300 data-[state=closed]:duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white",
        success: "bg-white text-neutral-900 border border-success-200",
        error: "bg-white text-neutral-900 border border-danger-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
