/**
 * p28 「생애주기 위험 예측」 — /premium/lifecycle (behind PremiumGate).
 *
 * A `LifecycleLineChart` (single brand line) of projected RISK across the age
 * bands, anchored to the user's real `riskScore.total` + `profile.age`, plus an
 * age-band `SegmentedControl` that reveals the per-disease rows for the SELECTED
 * band ONLY (not a full matrix). Every number is a DEMO ESTIMATE — surfaced with
 * a "예측 추정치" caption + a disclaimer banner. Data comes exclusively from
 * `lib/premium/mockData.ts` (incl. clearly-labelled 호흡기/정신건강 demo rows).
 *
 * CTAs: 리포트 생성 → /premium/report ; 다시 입력 → resetDiagnosis() +
 *       /input/basic?return=lifecycle.
 */

import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { InfoBanner } from "../../components/ui/InfoBanner";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { PremiumSurface } from "../../components/ui/PremiumSurface";
import { LifecycleLineChart } from "../../components/premium/LifecycleLineChart";
import { DiseaseRiskRow } from "../../components/premium/DiseaseRiskRow";
import { readAnalysis, resetDiagnosis } from "../../lib/draft";
import { readProfile } from "../../lib/storage";
import type { UserProfileInput } from "../../types";
import {
  AGE_BANDS,
  type AgeBandId,
  ageBandForAge,
  diseaseRowsForBand,
  PREMIUM_DISCLAIMER,
  PREMIUM_ESTIMATE_CAPTION,
  riskProjectionCurve,
} from "../../lib/premium/mockData";

export function PremiumLifecycle() {
  const navigate = useNavigate();

  const anchor = useMemo(() => {
    const analysis = readAnalysis();
    if (!analysis) return null;
    const profile = readProfile<UserProfileInput>();
    const age = typeof profile.age === "number" && profile.age > 0 ? profile.age : 30;
    return {
      risk: analysis.riskScore.total,
      age,
      currentBand: ageBandForAge(age),
      name: profile.name,
    };
  }, []);

  const [band, setBand] = useState<AgeBandId>(anchor?.currentBand ?? "30s");

  if (!anchor) return <Navigate to="/analyzing" replace />;

  const curve = riskProjectionCurve(anchor.risk, anchor.age);
  const labels = curve.map((p) => String(p.age));
  const values = curve.map((p) => p.risk);
  const highlightIndex = AGE_BANDS.findIndex((b) => b.id === anchor.currentBand);
  const rows = diseaseRowsForBand(anchor.risk, anchor.age, band);
  const selectedBandLabel = AGE_BANDS.find((b) => b.id === band)?.label ?? "";

  const reDiagnose = () => {
    resetDiagnosis();
    navigate("/input/basic?return=lifecycle");
  };

  return (
    <AppShell title="생애주기 위험 예측" backTo="/report" maxWidth={760}>
      <div className="mx-auto w-full max-w-[640px]">
        {/* Title */}
        <div>
          <span className="text-sm font-semibold text-premium-600">Premium</span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[32px]"
          >
            나이에 따라 위험이 이렇게 변해요
          </motion.h1>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
            {anchor.name ? `${anchor.name}님의 ` : ""}현재 위험점수를 기준으로 한 생애주기 예측이에요.
          </p>
        </div>

        {/* Lifecycle chart */}
        <PremiumSurface className="mt-7" hideCrown>
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-neutral-900">생애주기 위험점수</h2>
            <span className="rounded-full bg-premium-100 px-2.5 py-1 text-[11px] font-bold text-premium-600">
              {PREMIUM_ESTIMATE_CAPTION}
            </span>
          </div>
          <div className="mt-4 rounded-2xl bg-white px-3 py-4">
            <LifecycleLineChart
              labels={labels}
              values={values}
              highlightIndex={highlightIndex >= 0 ? highlightIndex : undefined}
              color="var(--color-premium-500)"
              ariaLabel="연령대별 위험점수 예측 그래프"
            />
          </div>
          <p className="mt-3 text-[12px] text-neutral-500">
            점이 강조된 구간이 현재 연령대({AGE_BANDS.find((b) => b.id === anchor.currentBand)?.label})예요.
          </p>
        </PremiumSurface>

        {/* Age-band selector + per-disease rows (selected band only) */}
        <section className="mt-6 rounded-3xl bg-white px-7 py-6 shadow-card">
          <h2 className="text-[17px] font-bold text-neutral-900">연령대별 주요 위험</h2>
          <p className="mt-1 text-[13px] text-neutral-400">
            연령대를 선택하면 그 시기의 주요 질환 위험을 보여드려요.
          </p>

          <div className="mt-4">
            <SegmentedControl<AgeBandId>
              value={band}
              onChange={setBand}
              size="sm"
              ariaLabel="연령대 선택"
              options={AGE_BANDS.map((b) => ({ value: b.id, label: b.label }))}
            />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-[14px] font-bold text-neutral-700">{selectedBandLabel} 기준</span>
            <span className="text-[12px] text-neutral-400">위험 지수 · 예상 의료비</span>
          </div>

          <motion.div
            key={band}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-1 divide-y divide-neutral-100"
          >
            {rows.map((row) => (
              <DiseaseRiskRow key={row.id} row={row} />
            ))}
          </motion.div>

          <p className="mt-4 text-[12px] leading-relaxed text-neutral-400">
            호흡기·정신건강은 데모를 위한 예시 항목이에요.
          </p>
        </section>

        <div className="mt-6">
          <InfoBanner tone="premium">{PREMIUM_DISCLAIMER}</InfoBanner>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col gap-2.5">
          <Button
            variant="default"
            size="lg"
            fullWidth
            onClick={() => navigate("/premium/report")}
          >
            Premium 리포트 생성
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={reDiagnose}>
            다시 입력하기
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default PremiumLifecycle;
