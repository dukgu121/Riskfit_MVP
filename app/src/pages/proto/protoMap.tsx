/**
 * Slug → real page-component map for the ungated `/proto/:slug` preview.
 *
 * Each entry lazy-loads the REAL page module (the same one the production route
 * renders) so the preview surface always shows the live component, seeded with
 * sample data — no separate "ComingSoon" fork for built screens. While a screen
 * is still an Agent A placeholder it simply renders that placeholder here, which
 * is itself a valid navigable AppShell surface.
 *
 * Param screens (보험 세부 / 영역별 상세) are NOT served from this map — they have
 * dedicated real routes `/proto/insurance/:coverageType` and `/proto/detail/:area`
 * (see ProtoParam.tsx) so `useParams` resolves without a nested router.
 */

import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type Loader = () => Promise<{ default: ComponentType<unknown> }>;

/** Adapt a named export to a default for `React.lazy`. */
function named<K extends string>(
  loader: () => Promise<Record<K, ComponentType<unknown>>>,
  name: K,
): Loader {
  return async () => {
    const mod = await loader();
    return { default: mod[name] };
  };
}

/**
 * Map slug → the production route it should drive inside the preview router.
 * Param slugs map to a concrete path so the real param module reads it.
 */
export const PROTO_SLUG_ROUTE: Record<string, string> = {
  onboarding: "/onboarding",
  "onboarding-info": "/onboarding/info",
  "onboarding-result-intro": "/onboarding/result-intro",
  "input-basic": "/input/basic",
  "input-health": "/input/health",
  "input-lifestyle": "/input/lifestyle",
  "input-family": "/input/family",
  "input-insurance": "/input/insurance",
  "insurance-actual-medical": "/input/insurance/actual-medical",
  "insurance-cancer": "/input/insurance/cancer",
  "insurance-disease-hosp": "/input/insurance/disease-hospitalization",
  "insurance-accident-hosp": "/input/insurance/accident-hospitalization",
  "insurance-surgery": "/input/insurance/surgery",
  "insurance-income": "/input/insurance/income-interruption",
  analyzing: "/analyzing",
  result: "/result",
  detail: "/result/detail",
  "detail-lifestyle": "/result/detail/lifestyle",
  "detail-health": "/result/detail/health",
  "detail-family": "/result/detail/family",
  "detail-job": "/result/detail/job",
  "detail-finance": "/result/detail/financial",
  improve: "/improve",
  "improve-plan": "/improve/plan",
  "improve-preview": "/improve/preview",
  report: "/report",
  premium: "/premium",
  "premium-lifecycle": "/premium/lifecycle",
  "premium-report": "/premium/report",
};

/**
 * Map slug → lazy real component. Param screens share a single component; the
 * param value is supplied via the preview router URL (see `PROTO_SLUG_ROUTE`).
 */
export const PROTO_COMPONENTS: Record<
  string,
  LazyExoticComponent<ComponentType<unknown>>
> = {
  onboarding: lazy(
    named(() => import("../onboarding/OnboardingStart"), "OnboardingStart"),
  ),
  "onboarding-info": lazy(
    named(() => import("../onboarding/OnboardingCollect"), "OnboardingCollect"),
  ),
  "onboarding-result-intro": lazy(
    named(
      () => import("../onboarding/OnboardingResultIntro"),
      "OnboardingResultIntro",
    ),
  ),
  "input-basic": lazy(named(() => import("../InputBasic"), "InputBasic")),
  "input-health": lazy(named(() => import("../InputHealth"), "InputHealth")),
  "input-lifestyle": lazy(
    named(() => import("../InputLifestyle"), "InputLifestyle"),
  ),
  "input-family": lazy(named(() => import("../InputFamily"), "InputFamily")),
  "input-insurance": lazy(
    named(() => import("../InputInsurance"), "InputInsurance"),
  ),
  // 보험 세부 — all six share InsuranceSubScreen (slug → URL → :coverageType).
  "insurance-actual-medical": lazy(
    named(() => import("../insurance/InsuranceSubScreen"), "InsuranceSubScreen"),
  ),
  "insurance-cancer": lazy(
    named(() => import("../insurance/InsuranceSubScreen"), "InsuranceSubScreen"),
  ),
  "insurance-disease-hosp": lazy(
    named(() => import("../insurance/InsuranceSubScreen"), "InsuranceSubScreen"),
  ),
  "insurance-accident-hosp": lazy(
    named(() => import("../insurance/InsuranceSubScreen"), "InsuranceSubScreen"),
  ),
  "insurance-surgery": lazy(
    named(() => import("../insurance/InsuranceSubScreen"), "InsuranceSubScreen"),
  ),
  "insurance-income": lazy(
    named(() => import("../insurance/InsuranceSubScreen"), "InsuranceSubScreen"),
  ),
  analyzing: lazy(named(() => import("../Analyzing"), "Analyzing")),
  result: lazy(named(() => import("../result/ResultSummary"), "ResultSummary")),
  detail: lazy(named(() => import("../result/RiskDetail"), "RiskDetail")),
  "detail-lifestyle": lazy(
    named(() => import("../result/AreaDetail"), "AreaDetail"),
  ),
  "detail-health": lazy(named(() => import("../result/AreaDetail"), "AreaDetail")),
  "detail-family": lazy(named(() => import("../result/AreaDetail"), "AreaDetail")),
  "detail-job": lazy(named(() => import("../result/AreaDetail"), "AreaDetail")),
  "detail-finance": lazy(
    named(() => import("../result/AreaDetail"), "AreaDetail"),
  ),
  improve: lazy(named(() => import("../improve/Improve"), "Improve")),
  "improve-plan": lazy(named(() => import("../improve/ImprovePlan"), "ImprovePlan")),
  "improve-preview": lazy(
    named(() => import("../improve/ImprovePreview"), "ImprovePreview"),
  ),
  report: lazy(named(() => import("../report/Report"), "Report")),
  premium: lazy(named(() => import("../premium/Premium"), "Premium")),
  "premium-lifecycle": lazy(
    named(() => import("../premium/PremiumLifecycle"), "PremiumLifecycle"),
  ),
  "premium-report": lazy(
    named(() => import("../premium/PremiumReport"), "PremiumReport"),
  ),
};
