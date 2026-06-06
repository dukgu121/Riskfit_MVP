/**
 * Per-page enter/exit wrapper used inside `<AnimatePresence mode="wait">`.
 *
 * The animation is intentionally subtle (Toss-style) — a small upward
 * translation plus opacity fade-in, faster fade-out — so navigation feels
 * physical without distracting from the content.
 *
 * Honours `prefers-reduced-motion`: when set, opacity-only fades are used
 * (no Y translation) and durations are halved.
 */

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { durations, easeOutExpo } from "../../lib/motion";

/** True when the user has requested reduced motion. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export interface PageTransitionProps {
  children: ReactNode;
  /** Stable key per route — typically `location.pathname`. */
  routeKey: string;
}

export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const reduced = usePrefersReducedMotion();

  const initial = reduced
    ? { opacity: 0 }
    : { opacity: 0, y: 12 };
  const animate = reduced
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };
  const exit = { opacity: 0 };

  return (
    <motion.div
      key={routeKey}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={{
        duration: reduced ? durations.fast : durations.slow,
        ease: easeOutExpo,
      }}
      // `flex-1` so the page fills the remaining vertical space inside AppLayout.
      className="flex-1 flex flex-col w-full"
    >
      {children}
    </motion.div>
  );
}
