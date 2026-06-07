/**
 * Shared motion presets for RiskFit.
 *
 * Built on the `motion` library (the new package name for what was
 * previously `framer-motion`). These presets mirror the design tokens
 * exposed in `src/index.css` so animation timing stays consistent with
 * the rest of the UI.
 *
 * Usage:
 *   import { motion } from "motion/react";
 *   import { fadeIn } from "../lib/motion";
 *
 *   <motion.div {...fadeIn}> ... </motion.div>
 */

import type { Transition, Variants } from "motion/react";

/* ------------------------------------------------------------------
   Easing curves (mirrors --ease-* tokens in index.css)
   ------------------------------------------------------------------ */
export const easeOutQuart: Transition["ease"] = [0.25, 1, 0.5, 1];
export const easeOutExpo: Transition["ease"] = [0.16, 1, 0.3, 1];
export const easeSpring: Transition["ease"] = [0.34, 1.56, 0.64, 1];
export const easeInOut: Transition["ease"] = [0.65, 0, 0.35, 1];

/* ------------------------------------------------------------------
   Durations in seconds (mirrors --duration-* tokens, which are in ms)
   ------------------------------------------------------------------ */
export const durations = {
  instant: 0.08,
  fast: 0.16,
  base: 0.22,
  slow: 0.32,
  // Capped at 400ms per Toss guide §6: "400ms 초과 모션은 없다 — 답답함 유발".
  slower: 0.4,
} as const;

/* ------------------------------------------------------------------
   Transition presets
   ------------------------------------------------------------------ */
export const transitions = {
  /** Default ease for opacity/colour changes. */
  fade: {
    duration: durations.base,
    ease: easeOutQuart,
  } satisfies Transition,
  /** Standard ease for slide/translate animations. */
  slide: {
    duration: durations.slow,
    ease: easeOutExpo,
  } satisfies Transition,
  /** Bouncy spring for scale-in / pop animations (modals, toasts). */
  spring: {
    type: "spring",
    stiffness: 380,
    damping: 28,
    mass: 0.8,
  } satisfies Transition,
} as const;

/* ------------------------------------------------------------------
   Variant presets — use directly with <motion.div variants={...}>
   or spread the helper props returned below.
   ------------------------------------------------------------------ */

/** Plain opacity fade. */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/** Translate up + fade. Toss uses this for card entries / list rows. */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/** Scale-in with a tiny spring overshoot. Good for score reveals/modals. */
export const springScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

/* ------------------------------------------------------------------
   Ready-to-spread props (no variants needed) for one-shot animations
   ------------------------------------------------------------------ */

export const fadeIn = {
  initial: "hidden",
  animate: "visible",
  exit: "hidden",
  variants: fadeInVariants,
  transition: transitions.fade,
} as const;

export const slideUp = {
  initial: "hidden",
  animate: "visible",
  exit: "hidden",
  variants: slideUpVariants,
  transition: transitions.slide,
} as const;

export const springScale = {
  initial: "hidden",
  animate: "visible",
  exit: "hidden",
  variants: springScaleVariants,
  transition: transitions.spring,
} as const;

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */

/**
 * Stagger children by a fixed delay. Apply on the parent
 * `<motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible">`.
 */
export function staggerContainer(staggerChildren = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
}
