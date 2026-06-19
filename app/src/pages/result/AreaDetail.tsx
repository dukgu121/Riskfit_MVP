/**
 * p18–p22 「영역별 상세」 — ONE param template for the five drill-down areas
 * (`/result/detail/:area`, area ∈ lifestyle/health/family/job/financial).
 *
 * Layout per area: a hero gauge + band (the area's own 0–100 RISK score), a
 * ranked 기여 list (factor + `+N` + `RiskContributionBar`), one deterministic
 * AI 코멘트 (`areaComments.ts`, NOT an LLM), and a 점수 구성 strip behind a
 * toggle. Footer walks the FROZEN order (MIGRATION_PLAN OD-1):
 *   17 → 18 lifestyle → 19 health → 20 family → 21 job → 22 financial → 26 report
 *
 * Real vs demo-mock factors (MIGRATION_PLAN §3): lifestyle = all real; health =
 * BMI/검진/진료/가족력 real + 혈압/혈당/콜레스테롤 추정; family = per-condition
 * 추정; job = 추정 sub-split summing to jobRisk; financial = 저축/부채/보험 real
 * + 소득안정성/재무목표 추정. Demo rows carry a "추정" tag.
 *
 * Reads the cache READ-ONLY (per-area score) + the profile (factor breakdown via
 * `riskContributions.ts`). Invalid `:area` redirects to /result/detail.
 */

import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Badge } from "../../components/ui/badge";
import { InfoBanner } from "../../components/ui/InfoBanner";
import { RiskContributionBar } from "../../components/ui/RiskContributionBar";
import { ScoreGauge } from "../../components/ui/ScoreGauge";
import {
  AREA_META,
  AREA_ORDER,
  BAND_BADGE,
  BAND_COLOR,
  BAND_LABEL,
  bandOf,
  contributionBand,
  isAreaId,
  nextAreaPath,
  prevAreaPath,
} from "../../components/result/areaMeta";
import { areaRawScore } from "../../components/result/areaScores";
import {
  contributionsForArea,
  topContribution,
} from "../../lib/calc/riskContributions";
import type { RiskContribution } from "../../lib/calc/riskContributions";
import { areaComment } from "../../lib/report/areaComments";
import { readAiContent } from "../../lib/report/aiContent";
import { readAnalysis } from "../../lib/draft";
import { readInsurances, readProfile } from "../../lib/storage";
import type {
  AnalysisCache,
  Insurance,
  RiskBandId,
  UserProfileInput,
} from "../../types";

const RISK_BAND_CAPTION: Record<RiskBandId, string> = {
  low: "위험이 낮은 편이에요",
  medium: "위험이 보통 수준이에요",
  high: "위험이 높은 편이에요",
};

/** Bar scale max per area — keeps the longest factor bar from pinning at 100%. */
const AREA_BAR_MAX: Record<string, number> = {
  lifestyle: 25, // smoking tops out at 25
  health: 40, // BMI obese = 40
  family: 12,
  job: 30,
  financial: 30,
};

export function AreaDetail() {
  const { area } = useParams<{ area: string }>();

  // Read-only from the cache; never seed here (preview seeds beforehand —
  // seeding in production would leak the sample person's data).
  const [analysis] = useState<AnalysisCache | null>(() => readAnalysis());
  const profile = useMemo(() => readProfile<UserProfileInput>(), []);
  const insurances = useMemo(() => readInsurances<Insurance>(), []);
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!isAreaId(area)) {
    return <Navigate to="/result/detail" replace />;
  }

  if (!analysis) {
    return (
      <AppShell title="영역별 상세" backTo="/result/detail">
        <div className="py-24 text-center text-neutral-400">
          분석 데이터를 불러올 수 없어요. 다시 진단해 주세요.
        </div>
      </AppShell>
    );
  }

  const meta = AREA_META[area];
  const score = areaRawScore(area, analysis.riskScore, profile);
  const band = bandOf(score);
  const stepIndex = AREA_ORDER.indexOf(area);

  const rows: RiskContribution[] = contributionsForArea(area, profile, insurances)
    .slice()
    .sort((a, b) => b.delta - a.delta);
  const top = topContribution(rows);
  // Text SOURCE only: prefer the AI-written per-area comment from the /analyzing
  // cache (keyed by AreaId), fall back to the deterministic template. The score
  // and all factor numbers below stay engine-owned (never read from AI copy).
  const comment =
    readAiContent()?.areas?.[area] ?? areaComment(area, score, top?.label);

  const hasDemo = rows.some((r) => r.kind === "demoMock");
  const barMax = AREA_BAR_MAX[area] ?? 30;

  const isLast = stepIndex === AREA_ORDER.length - 1;

  return (
    <AppShell title={`${meta.label} 상세`} backTo="/result/detail" maxWidth={760}>
      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {AREA_ORDER.map((id, i) => (
          <span
            key={id}
            className={`h-1.5 rounded-full transition-all ${
              i === stepIndex ? "w-6 bg-brand-500" : "w-1.5 bg-neutral-200"
            }`}
          />
        ))}
        <span className="ml-2 text-[12px] font-medium text-neutral-400 tabular-nums">
          {stepIndex + 1} / {AREA_ORDER.length}
        </span>
      </div>

      {/* Hero */}
      <section className="mt-6 flex flex-col items-center rounded-3xl bg-white px-7 py-9 shadow-card">
        <span
          className="flex size-12 items-center justify-center rounded-2xl bg-neutral-50"
          style={{ color: BAND_COLOR[band] }}
        >
          {meta.icon}
        </span>
        <h1 className="mt-3 text-[22px] font-bold tracking-tight text-neutral-900">
          {meta.label} 위험
        </h1>
        <p className="mt-1 text-[13px] text-neutral-400">{meta.caption}</p>

        <div className="mt-5">
          <ScoreGauge
            value={score}
            size={184}
            color={BAND_COLOR[band]}
            ariaLabel={`${meta.label} 위험점수 ${score}점`}
          >
            <div className="flex items-baseline">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-[52px] font-extrabold leading-none tracking-tight text-neutral-900 tabular-nums"
              >
                {score}
              </motion.span>
              <span className="ml-1 text-[20px] font-bold text-neutral-400">점</span>
            </div>
          </ScoreGauge>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge variant={BAND_BADGE[band]} size="default">
            {BAND_LABEL[band]}
          </Badge>
          <span className="text-[14px] font-medium text-neutral-700">
            {RISK_BAND_CAPTION[band]}
          </span>
        </div>
      </section>

      {/* AI 코멘트 */}
      <section className="mt-4 rounded-3xl bg-white px-7 py-5 shadow-card">
        <p className="text-[13px] font-semibold text-brand-500">AI 코멘트</p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-800">{comment}</p>
      </section>

      {/* 기여 list */}
      <section className="mt-4 rounded-3xl bg-white px-7 py-6 shadow-card">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold text-neutral-900">위험에 영향을 준 요인</h2>
          <span className="text-[13px] text-neutral-400">높은 순서</span>
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 text-[14px] text-neutral-400">표시할 세부 요인이 없어요.</p>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {rows.map((row) => (
              <RiskContributionBar
                key={row.id}
                label={
                  <span className="flex items-center gap-2">
                    {row.label}
                    {row.detail && (
                      <span className="text-[12px] font-normal text-neutral-400">
                        {row.detail}
                      </span>
                    )}
                  </span>
                }
                delta={row.delta}
                max={barMax}
                band={contributionBand(row.delta, barMax)}
                note={row.kind === "demoMock" ? "추정" : undefined}
              />
            ))}
          </div>
        )}

        {hasDemo && (
          <InfoBanner tone="neutral" className="mt-5">
            <span className="font-semibold text-neutral-700">추정</span> 표시 항목은
            입력값을 바탕으로 한 예측 추정치예요. 위험점수 계산에는 일부만 반영돼요.
          </InfoBanner>
        )}
      </section>

      {/* 점수 구성 strip (toggle) */}
      <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-card">
        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          aria-expanded={showBreakdown}
          className="flex w-full items-center justify-between px-7 py-5 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
        >
          <span className="text-[15px] font-semibold text-neutral-900">점수 구성 자세히 보기</span>
          <Caret open={showBreakdown} />
        </button>
        {showBreakdown && (
          <div className="border-t border-neutral-100 px-7 py-5">
            <ul className="flex flex-col gap-2.5">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between text-[14px]">
                  <span className="flex items-center gap-2 text-neutral-600">
                    {row.label}
                    {row.kind === "demoMock" && (
                      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                        추정
                      </span>
                    )}
                  </span>
                  <span className="font-semibold tabular-nums text-neutral-800">
                    +{Math.round(row.delta)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-[14px]">
              <span className="font-semibold text-neutral-700">영역 위험점수</span>
              <span className="font-bold tabular-nums text-neutral-900">{score}점</span>
            </div>
          </div>
        )}
      </section>

      {/* Step footer 이전/다음 */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Link
          to={prevAreaPath(area)}
          className="inline-flex h-12 items-center rounded-xl px-5 text-[15px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
        >
          이전
        </Link>
        <Link
          to={nextAreaPath(area)}
          className="inline-flex h-12 items-center rounded-xl bg-brand-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
        >
          {isLast ? "리포트 보기" : "다음"}
        </Link>
      </div>
    </AppShell>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default AreaDetail;
