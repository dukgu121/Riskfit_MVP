/**
 * p15 「AI 분석 중」 — the analysis interstitial (restyled, Toss-minimal, WEB).
 *
 * ARCHITECTURE (MIGRATION_PLAN §5/§7): this is the ONE place the live analysis
 * is computed. On mount we read the merged profile + insurances and call
 * `computeAndCacheAnalysis(...)` ONCE, writing `riskfit.analysis`; every result/
 * improve/report/premium screen then reads that cache READ-ONLY. The visible
 * progress is a SCRIPTED timed checklist (~4s), NOT a real progress meter — the
 * math itself is sub-millisecond.
 *
 * After the minimum dwell we navigate, branching on `?return=`:
 *   (default)        → /result
 *   lifecycle        → /premium/lifecycle
 *   premium-report   → /premium/report
 *
 * Back is intentionally disabled (this is a transient compute step). Honours
 * `prefers-reduced-motion`: the spinner + staged reveal collapse to a static
 * "분석하고 있어요" with the checklist shown complete; the dwell + navigate still
 * apply.
 *
 * If the profile is empty (deep-link without walking the wizard) we redirect to
 * /input/basic — except under the ungated `/proto` preview, where Agent A seeds
 * a sample first, so the cache/profile are populated.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "../lib/cn";
import { calculateCompleteness } from "../lib/completeness";
import { computeAndCacheAnalysis } from "../lib/draft";
import { readInsurances, readProfile } from "../lib/storage";
import type { Insurance, UserProfileInput } from "../types";

/** Total scripted dwell (ms) — staged checklist + a beat on the final line. */
const TOTAL_DELAY_MS = 4_000;
/** When each checklist line flips ○ → ✓ (ms from mount). */
const STEP_TIMES_MS = [700, 1_700, 2_700, 3_500] as const;

const STEPS = [
  "건강 신호를 분석하고 있어요",
  "보장 적합도를 점검하고 있어요",
  "예상 자기부담액을 추정하고 있어요",
  "맞춤 리포트를 준비하고 있어요",
] as const;

/** Resolve the post-analysis destination from `?return=`. */
function destinationFor(ret: string | null): string {
  if (ret === "lifecycle") return "/premium/lifecycle";
  if (ret === "premium-report") return "/premium/report";
  return "/result";
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/** `true` once the stored profile has at least one meaningful field. */
function hasUsableProfile(profile: UserProfileInput): boolean {
  return calculateCompleteness(profile, []).completed > 0;
}

export function Analyzing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reduced = usePrefersReducedMotion();

  const ret = searchParams.get("return");
  const destination = useMemo(() => destinationFor(ret), [ret]);

  // Read once during render so the redirect decision is synchronous.
  const profile = useMemo(() => readProfile<UserProfileInput>(), []);
  const profileReady = hasUsableProfile(profile);

  // How many checklist lines have flipped to ✓ (0..4).
  const [doneCount, setDoneCount] = useState(reduced ? STEPS.length : 0);
  // Guard so the (idempotent) compute runs once even under StrictMode.
  const computedRef = useRef(false);

  /* Compute + cache the analysis ONCE, then navigate after the scripted dwell. */
  useEffect(() => {
    if (!profileReady) return;

    if (!computedRef.current) {
      computedRef.current = true;
      const insurances = readInsurances<Insurance>();
      // The only live call to the analysis pipeline. Errors are swallowed so a
      // bad input can't strand the user on the spinner — /result handles a null
      // cache by showing an empty / re-diagnose message (never re-seeding sample data).
      try {
        computeAndCacheAnalysis(profile, insurances);
      } catch {
        /* no-op — downstream guards a missing cache */
      }
    }

    const timer = window.setTimeout(() => {
      navigate(destination, { replace: true });
    }, TOTAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [profileReady, profile, destination, navigate]);

  /* Stage the checklist ○ → ✓ on the scripted timeline. */
  useEffect(() => {
    if (reduced || !profileReady) return;
    const timers = STEP_TIMES_MS.map((t, i) =>
      window.setTimeout(() => setDoneCount((c) => Math.max(c, i + 1)), t),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [reduced, profileReady]);

  if (!profileReady) {
    return <Navigate to="/input/basic" replace />;
  }

  const activeIndex = Math.min(doneCount, STEPS.length - 1);
  const heading = reduced ? "분석하고 있어요" : "잠시만요, 분석하고 있어요";

  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "flex min-h-screen flex-1 flex-col items-center justify-center",
        "bg-neutral-50 px-6 py-16",
      )}
    >
      <section
        aria-labelledby="analyzing-heading"
        className="flex w-full max-w-[440px] flex-col items-center"
      >
        {/* Spinner — 48px ring, brand-500 */}
        <motion.div
          aria-hidden
          className="size-12"
          animate={reduced ? undefined : { rotate: 360 }}
          transition={reduced ? undefined : { duration: 1.2, ease: "linear", repeat: Infinity }}
        >
          <svg viewBox="0 0 48 48" fill="none" className="size-12">
            <circle cx="24" cy="24" r="20" stroke="var(--color-neutral-200)" strokeWidth="4" />
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

        <h1
          id="analyzing-heading"
          className="mt-6 text-[24px] font-bold tracking-tight text-neutral-900"
        >
          {heading}
        </h1>

        {/* Rotating active-line caption (skipped under reduced motion) */}
        <div className="mt-2 h-5 text-center">
          {reduced ? (
            <p className="text-[13px] font-medium text-neutral-500">분석이 거의 끝났어요</p>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="text-[13px] font-medium text-neutral-500"
              >
                {STEPS[activeIndex]}
              </motion.p>
            </AnimatePresence>
          )}
        </div>

        {/* Scripted checklist */}
        <ul className="mt-8 flex w-full flex-col gap-3 rounded-3xl bg-white px-6 py-6 shadow-card">
          {STEPS.map((step, i) => {
            const done = i < doneCount;
            const active = !reduced && i === doneCount;
            return (
              <li key={step} className="flex items-center gap-3">
                <StepMark done={done} active={active} />
                <span
                  className={cn(
                    "text-[15px] transition-colors",
                    done
                      ? "font-medium text-neutral-800"
                      : active
                        ? "font-medium text-neutral-700"
                        : "text-neutral-400",
                  )}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-[12px] text-neutral-400">입력하신 정보는 안전하게 보호돼요.</p>
      </section>
    </main>
  );
}

/** ○ (pending) → spinner (active) → ✓ (done) status mark. */
function StepMark({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return (
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-500"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
    );
  }
  if (active) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center">
        <motion.span
          aria-hidden
          className="size-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="size-4">
            <circle cx="8" cy="8" r="6.5" stroke="var(--color-neutral-200)" strokeWidth="2.5" />
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="var(--color-brand-500)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="10 30"
            />
          </svg>
        </motion.span>
      </span>
    );
  }
  return (
    <span className="flex size-6 shrink-0 items-center justify-center">
      <span className="size-3 rounded-full border-[1.5px] border-neutral-300" />
    </span>
  );
}

export default Analyzing;
