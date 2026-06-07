/**
 * `Analyzing` — the "calculating your risk" interstitial screen.
 *
 * Toss-style minimal loading experience:
 *   - Single 48px circular spinner (brand-500) dead-centre.
 *   - h3 reassurance line + 13px caption beneath.
 *   - Rotating progress messages (1.5s each) with 200ms fade-cross.
 *   - Indeterminate shimmer bar slides left→right on a 1.4s loop.
 *   - No CTAs, no cancel — deliberate Toss pattern: analysis is short
 *     enough that the user is best served by simply waiting.
 *
 * Side effects (run once on mount):
 *   1. Read the merged profile from localStorage. If it's empty (a user who
 *      deep-linked here without walking the wizard) we redirect back to
 *      `/input/basic`.
 *   2. Sleep for a minimum 3s (UX: an instantaneous flash undermines trust;
 *      Toss interstitials sit around 2-4 seconds) and then
 *      `navigate('/result')`. The actual risk math is sub-millisecond and is
 *      run by `/result` itself, so this screen does no computation — it is a
 *      deliberate, reassuring pause, not a progress meter.
 *
 * Honours `prefers-reduced-motion`:
 *   - Spinner rotation, shimmer bar and message-rotation are disabled.
 *   - A single static message ("분석 중이에요") is shown.
 *   - The 3-second minimum delay + navigation still apply.
 */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "../lib/cn";
import { calculateCompleteness } from "../lib/completeness";
import { durations, easeOutQuart } from "../lib/motion";
import { readProfile } from "../lib/storage";
import type { UserProfileInput } from "../types";

/** Minimum dwell time on the analysing screen (ms). */
const MIN_DELAY_MS = 3_000;
/** Per-message dwell (ms) for the rotating reassurance copy. */
const MESSAGE_INTERVAL_MS = 1_500;

const PROGRESS_MESSAGES = [
  "건강 신호를 계산하고 있어요",
  "보장 적합도를 점검하고 있어요",
  "예상 자기부담액을 추정하고 있어요",
  "리포트를 준비하고 있어요",
] as const;

const REDUCED_MOTION_MESSAGE = "분석 중이에요";

/** Subscribe to `(prefers-reduced-motion: reduce)`. */
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

/**
 * `true` once the stored profile has at least one meaningful field. We
 * use this to decide whether the user actually walked the input flow
 * (vs. deep-linking to `/analyzing` with a fresh session).
 */
function hasUsableProfile(profile: UserProfileInput): boolean {
  return calculateCompleteness(profile, []).completed > 0;
}

export function Analyzing() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  // Read the profile synchronously during render so the redirect fires before
  // we kick off the artificial delay. The wizard writes separate slices
  // (basic / health / family history) which `readProfile` merges.
  const profile = useMemo(() => readProfile<UserProfileInput>(), []);

  const profileReady = hasUsableProfile(profile);

  // Rotating message index. Pauses on the last message instead of
  // looping so it lines up with the "리포트를 준비하고 있어요" finale.
  const [messageIndex, setMessageIndex] = useState(0);

  /* ------------------------------------------------------------
     Effect: delayed navigate to /result. No computation happens
     here — /result runs the (sub-millisecond) math itself. This is
     purely a reassuring dwell. Strict-mode double invocation is
     safe: the cleanup cancels the pending timer.
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!profileReady) return;
    const timer = window.setTimeout(() => {
      navigate("/result", { replace: true });
    }, MIN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [profileReady, navigate]);

  /* ------------------------------------------------------------
     Effect: rotate the reassurance message every 1.5s.
     Skipped under prefers-reduced-motion (single static line).
     ------------------------------------------------------------ */
  useEffect(() => {
    if (reduced) return;
    if (!profileReady) return;

    const interval = window.setInterval(() => {
      setMessageIndex((prev) =>
        prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev,
      );
    }, MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [reduced, profileReady]);

  if (!profileReady) {
    return <Navigate to="/input/basic" replace />;
  }

  const activeMessage = reduced
    ? REDUCED_MOTION_MESSAGE
    : PROGRESS_MESSAGES[messageIndex];

  return (
    <section
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="analyzing-heading"
      className={cn(
        "flex-1 flex flex-col items-center justify-center",
        "w-full max-w-[480px] mx-auto px-6 pb-32",
        "min-h-[100dvh] bg-[var(--color-surface-muted)]",
      )}
    >
      {/* Spinner — 48px circular ring, brand-500. Rotation handled by
          motion so it can be paused under reduced-motion. */}
      <motion.div
        aria-hidden="true"
        className="h-12 w-12"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={
          reduced
            ? undefined
            : { duration: 1.2, ease: "linear", repeat: Infinity }
        }
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
        >
          {/* Track */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="var(--color-neutral-200)"
            strokeWidth="4"
          />
          {/* Arc — ~25% of the circumference (≈ 31.4 of 125.6) */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="var(--color-brand-500)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="31.4 125.6"
            transform="rotate(-90 24 24)"
          />
        </svg>
      </motion.div>

      {/* h3 reassurance — 24px / Bold (inherited from index.css) */}
      <h3
        id="analyzing-heading"
        className="mt-6 text-2xl font-bold tracking-tight text-neutral-900"
      >
        잠시만요, 분석하고 있어요
      </h3>

      {/* Caption — 13px / Medium / neutral-600 */}
      <p className="mt-2 text-[13px] font-medium leading-snug text-neutral-600">
        최대 10초 정도 걸려요
      </p>

      {/* Rotating message — fade-cross via AnimatePresence(mode='wait') */}
      <div className="mt-6 h-5 w-full text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={activeMessage}
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: durations.base, ease: easeOutQuart }}
            className="text-sm font-medium text-neutral-700"
          >
            {activeMessage}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Indeterminate progress bar — 240px wide track containing a 30%
          width shimmer that slides left→right. Under reduced motion it
          collapses to a static 30%-filled track. */}
      <div
        role="progressbar"
        aria-label="분석 진행 중"
        className={cn(
          "mt-6 h-1 w-60 overflow-hidden rounded-full",
          "bg-[var(--color-neutral-200)]",
        )}
      >
        {reduced ? (
          <div className="h-full w-[30%] rounded-full bg-brand-500" />
        ) : (
          <div className="riskfit-analyzing-shimmer h-full w-[30%] rounded-full bg-brand-500" />
        )}
      </div>

      {/* Scoped keyframes — kept inline so we don't pollute the global
          stylesheet. `<style>` here is rendered once per mount. */}
      <style>{`
        @keyframes riskfit-analyzing-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .riskfit-analyzing-shimmer {
          animation: riskfit-analyzing-shimmer 1.4s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .riskfit-analyzing-shimmer { animation: none; }
        }
      `}</style>
    </section>
  );
}

export default Analyzing;
