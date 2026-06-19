/**
 * p29 「Premium 리포트」 — /premium/report (behind PremiumGate).
 *
 * The extended premium report:
 *   - a RISK ScoreDoughnut (위험점수, higher = worse — the REAL cached score),
 *   - a 현재 / 5년 후 / 10년 후 KpiRow of projected RISK (demo-mock),
 *   - a 5-year `LifecycleLineChart` (demo-mock),
 *   - 예상 의료비 (demo-mock),
 *   - a static narrative from `lib/premium/mockData.ts` (NOT LLM — fixed demo
 *     copy parameterised by the projection numbers).
 * Every projected number carries the "예측 추정치" label + a disclaimer. Back →
 * /premium/lifecycle.
 */

import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { InfoBanner } from "../../components/ui/InfoBanner";
import { PremiumSurface } from "../../components/ui/PremiumSurface";
import { ScoreDoughnut } from "../../components/charts/ScoreDoughnut";
import { KpiRow } from "../../components/improve/KpiRow";
import { LifecycleLineChart } from "../../components/premium/LifecycleLineChart";
import { readAnalysis, resetDiagnosis } from "../../lib/draft";
import { readProfile } from "../../lib/storage";
import { riskBand } from "../../lib/calc/interpret";
import type { UserProfileInput } from "../../types";
import {
  expectedMedicalCost,
  fiveYearProjection,
  formatManwon,
  PREMIUM_DISCLAIMER,
  PREMIUM_ESTIMATE_CAPTION,
  premiumHorizonKpis,
  premiumReportNarrative,
} from "../../lib/premium/mockData";

export function PremiumReport() {
  const navigate = useNavigate();

  const model = useMemo(() => {
    const analysis = readAnalysis();
    if (!analysis) return null;
    const profile = readProfile<UserProfileInput>();
    const age = typeof profile.age === "number" && profile.age > 0 ? profile.age : 30;
    const risk = analysis.riskScore.total;
    return {
      risk,
      bandLabel: analysis.riskScore.bandLabel,
      age,
      name: profile.name,
      kpis: premiumHorizonKpis(risk, age),
      curve: fiveYearProjection(risk, age),
      cost: expectedMedicalCost(risk, age),
      narrative: premiumReportNarrative({ name: profile.name, baselineRisk: risk, baselineAge: age }),
    };
  }, []);

  if (!model) return <Navigate to="/analyzing" replace />;

  const { risk, bandLabel, name, kpis, curve, cost } = model;
  const labels = curve.map((p) => String(p.age));
  const values = curve.map((p) => p.risk);

  // RESET#3 (MIGRATION_PLAN p29): scoped reset (keeps consent + premium) then
  // re-enters the wizard, asking /analyzing to return here via ?return=.
  const reDiagnose = () => {
    resetDiagnosis();
    navigate("/input/basic?return=premium-report");
  };

  // RISK polarity: a HIGHER score is worse, so colour the doughnut by band.
  const riskColor =
    riskBand(risk).id === "high"
      ? "var(--color-semantic-danger)"
      : riskBand(risk).id === "medium"
        ? "var(--color-semantic-warn)"
        : "var(--color-semantic-success)";

  return (
    <AppShell title="Premium 리포트" backTo="/premium/lifecycle" maxWidth={1080}>
      {/* Title */}
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-premium-600">Premium 리포트</span>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[38px]"
        >
          {name ? `${name}님의 생애주기 리포트` : "생애주기 리포트"}
        </motion.h1>
        <p className="mt-2 text-[16px] leading-relaxed text-neutral-500 lg:text-[17px]">
          현재 위험과 앞으로의 변화, 예상 의료비를 한 장에 정리했어요.
        </p>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT — risk hero + horizon KPIs */}
        <section className="lg:col-span-5">
          <div className="flex h-full flex-col items-center rounded-3xl bg-white px-8 py-9 shadow-card">
            <span className="text-[13px] font-bold text-neutral-400">현재 위험점수</span>
            <div className="relative mt-4 flex items-center justify-center">
              <ScoreDoughnut
                value={risk}
                size={188}
                color={riskColor}
                ariaLabel={`위험점수 ${risk}점`}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="flex items-baseline">
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[64px] font-extrabold leading-none tracking-tight text-neutral-900 tabular-nums"
                  >
                    {risk}
                  </motion.span>
                  <span className="ml-1 text-[24px] font-bold text-neutral-400">점</span>
                </span>
                <span className="mt-1.5 text-[13px] font-medium text-neutral-400">{bandLabel}</span>
              </div>
            </div>

            <div className="mt-7 w-full">
              <span className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-bold text-neutral-700">위험점수 전망</span>
                <span className="rounded-full bg-premium-50 px-2.5 py-1 text-[11px] font-bold text-premium-600">
                  {PREMIUM_ESTIMATE_CAPTION}
                </span>
              </span>
              <KpiRow
                columns={3}
                tiles={kpis.map((kpi) => ({
                  id: kpi.id,
                  label: kpi.label,
                  value: kpi.risk,
                  unit: "점",
                  caption: `${kpi.age}세`,
                  tone: kpi.id === "in10" ? "premium" : "neutral",
                }))}
              />
            </div>
          </div>
        </section>

        {/* RIGHT — 5y curve + cost + narrative */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          <PremiumSurface hideCrown>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-neutral-900">5년 위험 추이</h2>
              <span className="rounded-full bg-premium-100 px-2.5 py-1 text-[11px] font-bold text-premium-600">
                {PREMIUM_ESTIMATE_CAPTION}
              </span>
            </div>
            <div className="mt-4 rounded-2xl bg-white px-3 py-4">
              <LifecycleLineChart
                labels={labels}
                values={values}
                highlightIndex={0}
                color="var(--color-premium-500)"
                height={200}
                ariaLabel="5년 위험점수 추이 그래프"
              />
            </div>
          </PremiumSurface>

          {/* Expected medical cost */}
          <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-neutral-900">예상 의료비</h2>
              <span className="rounded-full bg-premium-50 px-2.5 py-1 text-[11px] font-bold text-premium-600">
                {PREMIUM_ESTIMATE_CAPTION}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-neutral-50 px-4 py-4">
                <span className="text-[12px] font-medium text-neutral-400">5년 후 연간</span>
                <p className="mt-1 text-[22px] font-extrabold tracking-tight text-neutral-900 tabular-nums">
                  {formatManwon(cost.annual)}
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 px-4 py-4">
                <span className="text-[12px] font-medium text-neutral-400">5년 누적</span>
                <p className="mt-1 text-[22px] font-extrabold tracking-tight text-neutral-900 tabular-nums">
                  {formatManwon(cost.fiveYearCumulative)}
                </p>
              </div>
            </div>
          </section>

          {/* Narrative (static demo template) */}
          <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
            <h2 className="text-[17px] font-bold text-neutral-900">생애주기 요약</h2>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-neutral-800">
              {model.narrative.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-6">
        <InfoBanner tone="premium">{PREMIUM_DISCLAIMER}</InfoBanner>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-2.5">
        <div className="flex w-full max-w-md flex-col gap-2.5">
          <Button
            variant="default"
            size="lg"
            fullWidth
            onClick={() => navigate("/premium/lifecycle")}
          >
            생애주기 예측으로 돌아가기
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={reDiagnose}>
            다시 입력하기
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default PremiumReport;
