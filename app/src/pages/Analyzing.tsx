/**
 * p15 「AI 분석 중」 — the analysis interstitial.
 *
 * This is the ONE place the live analysis is computed: on mount we read the
 * merged profile + insurances and call `computeAndCacheAnalysis(...)` ONCE,
 * writing `riskfit.analysis`. Every result/improve/report/premium screen then
 * reads that cache READ-ONLY. The visible progress is a scripted ~4s checklist,
 * not a real progress meter — the math itself is sub-millisecond.
 *
 * After the minimum dwell we navigate, branching on `?return=`:
 *   (default)        → /result
 *   lifecycle        → /premium/lifecycle
 *   premium-report   → /premium/report
 *
 * Back is disabled (this is a transient compute step). Under reduced motion the
 * spinner + staged reveal collapse to a static heading with the checklist shown
 * complete; the dwell + navigate still apply.
 *
 * An empty profile (deep-link without walking the wizard) redirects to
 * /input/basic — except under the ungated `/proto` preview, which seeds a sample
 * first so the cache/profile are populated.
 */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "../lib/cn";
import { calculateCompleteness } from "../lib/completeness";
import { computeAndCacheAnalysis, readAnalysis } from "../lib/draft";
import { improvementPlan } from "../lib/calc/improvement";
import {
  contributionsForArea,
  topContribution,
  topRealContributions,
} from "../lib/calc/riskContributions";
import type { AreaId } from "../lib/calc/riskContributions";
import { familyAreaScore } from "../lib/calc/riskContributions";
import { ensureAiContent, type AiContentInput } from "../lib/report/aiContent";
import { readInsurances, readProfile } from "../lib/storage";
import { AREA_META } from "../components/result/areaMeta";
import type {
  AnalysisCache,
  Insurance,
  ReportSummary,
  UserProfileInput,
} from "../types";

/** Total scripted dwell (ms) — staged checklist + a beat on the final line. */
const TOTAL_DELAY_MS = 4_000;
/** Hard cap (ms) on waiting for the AI content generation before proceeding. */
const AI_CONTENT_TIMEOUT_MS = 90_000;
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

const AREA_IDS: readonly AreaId[] = [
  "lifestyle",
  "health",
  "family",
  "job",
  "financial",
] as const;

/**
 * Build the `AiContentInput` for the whole flow from the freshly-computed
 * analysis + raw inputs. The `summary` must be constructed exactly like
 * Report.tsx (same grounding whitelist, same signature the report screen will
 * look its cache up with), and per-area data must mirror what AreaDetail feeds
 * `areaComment` — otherwise the cached copy won't match. Pure, no React.
 */
function buildAiContentInput(
  analysis: AnalysisCache,
  profile: UserProfileInput,
  insurances: Insurance[],
): AiContentInput {
  const plan = improvementPlan(analysis, profile, insurances);
  const completeness = calculateCompleteness(profile, insurances);

  // Real-only top risk factors (demoMock excluded), same as Report.tsx.
  const realTop = topRealContributions(profile, insurances, 2);
  const topRiskFactors = realTop.map((c) => ({
    label: c.label,
    delta: c.delta,
    area: c.area,
    ...(c.detail ? { detail: c.detail } : {}),
  }));

  const summary: ReportSummary = {
    profileSummary: {
      name: profile.name,
      age: profile.age,
      jobGroup: profile.jobGroup,
      userType: analysis.userType,
    },
    riskScore: analysis.riskScore,
    coverageFit: analysis.coverageFit,
    weakCoverages: analysis.coverageFit.weakCoverages,
    cautionCoverages: analysis.coverageFit.cautionCoverages,
    expectedOutOfPocket: analysis.outOfPocket.total,
    expectedOutOfPocketText: analysis.outOfPocket.displayText,
    completeness: completeness.percent,
    topRiskFactors,
    improvement: {
      top: plan.top3.map((i) => ({ label: i.label, currentFit: i.currentFit })),
      currentOverallFit: plan.currentOverallFit,
      projectedOverallFit: plan.projectedOverallFit,
    },
  };

  // Per-area score + top contributing factor label (parity with AreaDetail's
  // `areaComment(area, score, topContribution(rows)?.label)`).
  const areaScore = (id: AreaId): number => {
    switch (id) {
      case "lifestyle":
        return analysis.riskScore.lifestyle;
      case "health":
        return analysis.riskScore.health;
      case "job":
        return analysis.riskScore.job;
      case "financial":
        return analysis.riskScore.finance;
      case "family":
        return familyAreaScore(profile);
    }
  };
  const areas = {} as AiContentInput["areas"];
  for (const id of AREA_IDS) {
    const rows = contributionsForArea(id, profile, insurances);
    const top = topContribution(rows);
    areas[id] = {
      score: areaScore(id),
      ...(top?.label ? { topFactorLabel: top.label } : {}),
    };
  }

  // p17 overview "worst area" = dominant REAL risk driver's area (consistent
  // with the report's causal headline; never a demoMock estimate).
  const worstAreaLabel = realTop[0]
    ? AREA_META[realTop[0].area].label
    : undefined;

  const gain = Math.max(0, plan.projectedOverallFit - plan.currentOverallFit);

  return {
    summary,
    resultSummary: {
      fitScore: analysis.coverageFit.overall,
      fitBand: analysis.coverageFit.band,
      weakCoverages: analysis.coverageFit.weakCoverages,
      cautionCoverages: analysis.coverageFit.cautionCoverages,
      name: profile.name,
    },
    riskOverview: {
      totalRisk: analysis.riskScore.total,
      worstAreaLabel,
    },
    areas,
    improveIntro: { gain, allDone: plan.top3.length === 0 },
    premium: {
      name: profile.name,
      baselineRisk: analysis.riskScore.total,
      baselineAge:
        typeof profile.age === "number" && profile.age > 0 ? profile.age : 30,
    },
  };
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
  // The last line ("맞춤 리포트를 준비하고 있어요") holds as a spinner until the AI
  // bundle is ready, so the wait never reads as "all done but stuck".
  const [contentReady, setContentReady] = useState(false);
  /* Compute + cache the analysis, generate the single AI-content bundle, and
   * navigate once BOTH the scripted dwell and the generation (or its ~45s cap)
   * finish. Compute is idempotent (reuse the cache a prior mount wrote) and the
   * generation is deduped at module scope, so StrictMode's dev double-mount
   * awaits the same in-flight bundle instead of navigating before it's ready.
   * On failure/timeout each screen falls back to its own template. */
  useEffect(() => {
    if (!profileReady) return;

    let cancelled = false;
    let dwellDone = false;
    let workDone = false;
    let navTimer = 0;

    const go = () => {
      if (cancelled || !dwellDone || !workDone) return;
      navigate(destination, { replace: true });
    };

    const insurances = readInsurances<Insurance>();
    // Errors are swallowed so a bad input can't strand the user on the spinner —
    // /result handles a null cache with a re-diagnose message and never re-seeds.
    let analysis = readAnalysis();
    if (!analysis) {
      try {
        analysis = computeAndCacheAnalysis(profile, insurances);
      } catch {
        analysis = null;
      }
    }

    if (analysis) {
      // One sidecar call for all screen copy, cached under the report summary's
      // signature. Deduped module-wide so both StrictMode mounts await it.
      const input = buildAiContentInput(analysis, profile, insurances);
      ensureAiContent(input, { timeoutMs: AI_CONTENT_TIMEOUT_MS }).finally(() => {
        workDone = true;
        setContentReady(true);
        go();
      });
    } else {
      // No analysis → navigate at the dwell; the last step stays a spinner until
      // then (no AI wait to hold for).
      workDone = true;
    }

    // Scripted dwell — the floor so the checklist never flashes past.
    navTimer = window.setTimeout(() => {
      dwellDone = true;
      go();
    }, TOTAL_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(navTimer);
    };
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

  // Hold the final step active (spinner) until the AI bundle resolves, unless
  // reduced motion (then the checklist is static all-done from the start).
  const effectiveDone =
    reduced || contentReady ? doneCount : Math.min(doneCount, STEPS.length - 1);
  const activeIndex = Math.min(effectiveDone, STEPS.length - 1);
  const heading = reduced ? "분석하고 있어요" : "잠시만요, 분석하고 있어요";
  // Once the scripted checklist is done but the AI bundle is still generating,
  // show a friendlier "writing" state so the wait never reads as stuck.
  const writing = !reduced && doneCount >= STEPS.length && !contentReady;

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

        {/* Caption — the rotating step line, or the "AI is writing" state once
            the scripted checklist is done but the bundle is still generating. */}
        <div className="mt-2 flex min-h-[2.75rem] flex-col items-center justify-start text-center">
          {writing ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-2.5"
            >
              <p className="text-[15px] font-semibold text-brand-500">
                AI가 맞춤 리포트를 작성하고 있어요
              </p>
              <BouncingDots />
              <p className="text-[12px] text-neutral-400">거의 다 됐어요 · 멈춘 게 아니에요</p>
            </motion.div>
          ) : reduced ? (
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
            const done = i < effectiveDone;
            const active = !reduced && i === effectiveDone;
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

/** Three dots bouncing in a wave — the "AI is working" cue. */
function BouncingDots() {
  return (
    <span aria-hidden className="inline-flex items-end gap-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2.5 rounded-full bg-brand-500"
          animate={{ y: [0, -10, 0], scale: [1, 1.25, 1], opacity: [0.45, 1, 0.45] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.18,
          }}
        />
      ))}
    </span>
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
