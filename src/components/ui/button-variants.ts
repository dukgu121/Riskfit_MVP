import { cva } from "class-variance-authority";

/**
 * Button - Toss-style primary action.
 *
 * Micro-detail notes:
 * - Transition is restricted to colour + box-shadow + transform (never the
 *   broad catch-all) and tuned to 160ms ease-out-expo. Toss's signature
 *   springy feel comes from this exact pair: a short duration with a
 *   long-tailed ease.
 * - Active state uses `scale-[0.98]` because Toss accepts a tiny scale dip on
 *   press because finger pressure should produce *some* visual feedback.
 * - Disabled state shifts to neutral chrome (neutral-200 bg, neutral-400
 *   text) rather than opacity-50. Opacity-50 over coloured surfaces
 *   produces washed-out artefacts that read as a render bug.
 * - Focus-visible draws the 4px brand halo via the global `--shadow-focus`
 *   token. We also strip the native outline so the halo stands alone.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-semibold select-none",
    "transition-[background-color,color,box-shadow,transform]",
    "duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
    "focus:outline-none focus-visible:outline-none",
    "focus-visible:shadow-[var(--shadow-focus)]",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-fg)] disabled:shadow-none",
    "[&_svg]:shrink-0 [&_svg]:size-5",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
        secondary:
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
        ghost:
          "bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200",
        outline:
          "bg-white text-neutral-900 border-[1.5px] border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100",
        destructive:
          "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        default: "h-14 px-6 text-base",
        lg: "h-16 px-7 text-lg",
        icon: "h-14 w-14 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);
