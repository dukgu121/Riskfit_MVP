/**
 * p26 「최종 분석 리포트」 — /report.
 *
 * Reads the cached analysis (READ-ONLY) + source inputs, builds the improvement
 * plan, and renders:
 *   - a hero ScoreDoughnut whose number is the PROJECTED post-improvement FIT
 *     (64px) — explicitly labelled "개선 후 보장 적합도" so it's never mistaken for a
 *     risk-score "improvement",
 *   - a 4-tile KpiRow (현재 적합도 / 개선 후 적합도 / 위험점수 / 입력 완성도),
 *   - the long-form narrative (reuses `generateReport` with template fallback,
 *     cached to `riskfit.report`),
 *   - area mini-cards (per-coverage fit) behind a "보장별로 보기" disclosure.
 * CTAs: 생애주기 위험 예측 → isPremium() ? /premium/lifecycle : /premium ;
 *       다시 진단하기 → resetDiagnosis() → /input/basic.
 */

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ScoreDoughnut } from "../../components/charts/ScoreDoughnut";
import { CoverageBar } from "../../components/charts/CoverageBar";
import { KpiRow } from "../../components/improve/KpiRow";
import { ReportNarrative } from "../../components/improve/ReportNarrative";
import { improvementPlan } from "../../lib/calc/improvement";
import { isPremium, readAnalysis, resetDiagnosis } from "../../lib/draft";
import { calculateCompleteness } from "../../lib/completeness";
import { readInsurances, readProfile } from "../../lib/storage";
import type {
  CoverageBandId,
  Insurance,
  ReportSummary,
  UserProfileInput,
} from "../../types";

const BADGE_VARIANT: Record<CoverageBandId, "success" | "warn" | "danger" | "info"> = {
  sufficient: "success",
  caution: "warn",
  insufficient: "danger",
  excessive: "info",
};

const BAND_LABEL: Record<CoverageBandId, string> = {
  sufficient: "충분",
  caution: "주의",
  insufficient: "부족",
  excessive: "과도",
};

export function Report() {
  const navigate = useNavigate();
  const [areasOpen, setAreasOpen] = useState(false);

  // Compute once on mount (lazy initializer) — reads the analysis cache + profile
  // a single time, like the result screens. Avoids a manual-memo the compiler
  // can't preserve.
  const [model] = useState(() => {
    const analysis = readAnalysis();
    if (!analysis) return null;
    const profile = readProfile<UserProfileInput>();
    const insurances = readInsurances<Insurance>();
    const plan = improvementPlan(analysis, profile, insurances);
    const completeness = calculateCompleteness(profile, insurances);

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
    };

    return { analysis, plan, completeness, summary, name: profile.name };
  });

  if (!model) return <Navigate to="/analyzing" replace />;

  const { analysis, plan, completeness, summary, name } = model;
  const projectedFit = plan.projectedOverallFit;
  const currentFit = plan.currentOverallFit;
  const gain = Math.max(0, projectedFit - currentFit);

  const goPremium = () => navigate(isPremium() ? "/premium/lifecycle" : "/premium");
  const reDiagnose = () => {
    resetDiagnosis();
    navigate("/input/basic");
  };

  return (
    <AppShell
      title="최종 리포트"
      maxWidth={1080}
      headerAction={
        <button
          type="button"
          onClick={reDiagnose}
          className="h-9 rounded-lg px-3.5 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
        >
          다시 진단하기
        </button>
      }
    >
      {/* Title */}
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-brand-500">분석 리포트</span>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[38px]"
        >
          {name ? `${name}님의 보장 리포트예요` : "보장 리포트가 준비됐어요"}
        </motion.h1>
        <p className="mt-2 text-[16px] leading-relaxed text-neutral-500 lg:text-[17px]">
          지금 보장과 개선 후 모습을 한 장에 정리했어요.
        </p>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT — hero + KPIs */}
        <section className="lg:col-span-5">
          <div className="flex h-full flex-col items-center rounded-3xl bg-white px-8 py-9 shadow-card">
            <span className="text-[13px] font-bold text-brand-500">개선 후 보장 적합도</span>
            <div className="relative mt-4 flex items-center justify-center">
              <ScoreDoughnut value={projectedFit} size={188} ariaLabel={`개선 후 보장 적합도 ${projectedFit}%`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="flex items-baseline">
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[64px] font-extrabold leading-none tracking-tight text-neutral-900 tabular-nums"
                  >
                    {projectedFit}
                  </motion.span>
                  <span className="ml-1 text-[26px] font-bold text-neutral-400">%</span>
                </span>
                <span className="mt-1.5 text-[13px] font-medium text-neutral-400 tabular-nums">
                  지금 {currentFit}% {gain > 0 ? `· +${gain}%p` : ""}
                </span>
              </div>
            </div>

            <div className="mt-7 w-full">
              <KpiRow
                columns={2}
                tiles={[
                  { id: "now", label: "지금 적합도", value: currentFit, unit: "%" },
                  { id: "after", label: "개선 후", value: projectedFit, unit: "%", tone: "brand" },
                  { id: "risk", label: "위험점수", value: analysis.riskScore.total, unit: "점", caption: analysis.riskScore.bandLabel },
                  { id: "complete", label: "입력 완성도", value: completeness.percent, unit: "%" },
                ]}
              />
            </div>
          </div>
        </section>

        {/* RIGHT — narrative + areas */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          <ReportNarrative summary={summary} />

          {/* Area mini-cards behind disclosure */}
          <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
            <button
              type="button"
              onClick={() => setAreasOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left focus:outline-none"
              aria-expanded={areasOpen}
            >
              <h2 className="text-[17px] font-bold text-neutral-900">보장별로 보기</h2>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-500">
                {areasOpen ? "접기" : `${analysis.coverageFit.items.length}개 보장`}
                <Chevron open={areasOpen} />
              </span>
            </button>

            {areasOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2"
              >
                {analysis.coverageFit.items.map((item) => (
                  <div key={item.type}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-[15px] font-medium text-neutral-800">{item.label}</span>
                        <Badge variant={BADGE_VARIANT[item.band]} size="sm">
                          {BAND_LABEL[item.band]}
                        </Badge>
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums text-neutral-500">
                        {item.fit}
                        <span className="text-neutral-300">%</span>
                      </span>
                    </div>
                    <CoverageBar value={item.fit} band={item.band} ariaLabel={`${item.label} ${item.fit}%`} />
                  </div>
                ))}
              </motion.div>
            )}
          </section>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
          <Button variant="default" size="lg" fullWidth onClick={goPremium}>
            생애주기 위험 예측
          </Button>
          <Button variant="outline" size="lg" fullWidth onClick={reDiagnose}>
            다시 진단하기
          </Button>
        </div>
        <p className="text-[12px] leading-relaxed text-neutral-400">
          이 리포트는 입력 정보를 바탕으로 한 참고용 분석이에요.
        </p>
      </div>
    </AppShell>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="transition-transform"
      style={{ transform: open ? "rotate(-90deg)" : "rotate(90deg)" }}
    >
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default Report;
