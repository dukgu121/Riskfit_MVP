/**
 * p17 「상세 리스크 분석」 — the risk drill-down OVERVIEW.
 *
 * HERO = 위험점수 RISK (`analysis.riskScore.total`, higher = WORSE) in the
 * open-arc `ScoreGauge` — visually distinct from the p16 FIT doughnut so the
 * polarity reads at a glance (MIGRATION_PLAN §9). Below: a 2-row 5-tile grid
 * (생활습관/건강/가족력/직업/재무) → each area's detail screen, plus the signed
 * +N weighted-contribution bars (the block the PDF crammed onto p16, moved here
 * per the Toss simplification). All contributions read `+N` — band/colour shows
 * good vs bad, never the sign.
 *
 * Reads the cache READ-ONLY; the per-area weighted deltas are `areaScore ×
 * weight` (no recompute). Footer: 이전 → /result, 다음 → 첫 영역(생활습관).
 */

import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Badge } from "../../components/ui/badge";
import { RiskContributionBar } from "../../components/ui/RiskContributionBar";
import { ScoreGauge } from "../../components/ui/ScoreGauge";
import {
  AREA_META,
  AREA_ORDER,
  BAND_BADGE,
  BAND_COLOR,
  BAND_LABEL,
  bandOf,
} from "../../components/result/areaMeta";
import {
  areaRawScore,
  areaWeightedDelta,
  areaWeightedMax,
  isWeightedArea,
} from "../../components/result/areaScores";
import { readAnalysis } from "../../lib/draft";
import { readProfile } from "../../lib/storage";
import { overviewComment } from "../../lib/report/areaComments";
import { readAiContent } from "../../lib/report/aiContent";
import type { AreaId } from "../../lib/calc/riskContributions";
import type { AnalysisCache, RiskBandId, UserProfileInput } from "../../types";

const RISK_BAND_CAPTION: Record<RiskBandId, string> = {
  low: "위험이 낮은 편이에요",
  medium: "위험이 보통 수준이에요",
  high: "위험 신호가 높은 편이에요",
};

export function RiskDetail() {
  // Read-only from the cache; never seed here (preview seeds beforehand —
  // seeding in production would leak the sample person's data).
  const [analysis] = useState<AnalysisCache | null>(() => readAnalysis());
  const profile = useMemo(() => readProfile<UserProfileInput>(), []);

  if (!analysis) {
    return (
      <AppShell title="상세 분석" backTo="/result">
        <div className="py-24 text-center text-neutral-400">
          분석 데이터를 불러올 수 없어요. 다시 진단해 주세요.
        </div>
      </AppShell>
    );
  }

  const risk = analysis.riskScore;
  const total = risk.total;
  const band = risk.band;
  const gaugeColor = BAND_COLOR[band];

  // Per-area raw score (gauge tiles) + weighted delta (contribution bars).
  const areas = AREA_ORDER.map((id) => ({
    id,
    meta: AREA_META[id],
    score: areaRawScore(id, risk, profile),
    weighted: areaWeightedDelta(id, risk),
  }));

  // Signed +N contribution bars — weighted areas only (가족력 is not weighted).
  const weightedBars = areas
    .filter((a) => isWeightedArea(a.id))
    .map((a) => ({
      id: a.id,
      label: a.meta.label,
      delta: a.weighted,
      max: areaWeightedMax(a.id as Exclude<AreaId, "family">),
    }))
    .sort((x, y) => y.delta - x.delta);

  const worst = weightedBars[0];
  // Text SOURCE only: prefer the AI-written overview from the /analyzing cache,
  // fall back to the deterministic template. Numbers/scores stay engine-owned.
  const comment =
    readAiContent()?.riskOverview ??
    overviewComment(total, worst ? AREA_META[worst.id].label : undefined);

  return (
    <AppShell title="상세 분석" backTo="/result" maxWidth={960}>
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-brand-500">상세 리스크 분석</span>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[34px]">
          위험점수를 영역별로 살펴봤어요
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
          점수가 높을수록 대비가 필요한 위험이 커요. 영역을 눌러 자세히 확인해 보세요.
        </p>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT — RISK hero */}
        <section className="lg:col-span-5">
          <div className="flex h-full flex-col items-center rounded-3xl bg-white px-8 py-10 shadow-card">
            <ScoreGauge
              value={total}
              size={208}
              color={gaugeColor}
              ariaLabel={`위험점수 ${total}점`}
              label="위험점수"
            >
              <div className="flex items-baseline">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[60px] font-extrabold leading-none tracking-tight text-neutral-900 tabular-nums"
                >
                  {total}
                </motion.span>
                <span className="ml-1 text-[22px] font-bold text-neutral-400">점</span>
              </div>
            </ScoreGauge>

            <div className="mt-5 flex items-center gap-2">
              <Badge variant={BAND_BADGE[band]} size="default">
                {risk.bandLabel}
              </Badge>
              <span className="text-[15px] font-medium text-neutral-700">
                {RISK_BAND_CAPTION[band]}
              </span>
            </div>

            {/* AI 코멘트 */}
            <div className="mt-6 w-full rounded-2xl bg-neutral-50 px-5 py-4">
              <p className="text-[13px] font-semibold text-brand-500">AI 코멘트</p>
              <p className="mt-1 text-[14px] leading-relaxed text-neutral-700">{comment}</p>
            </div>
          </div>
        </section>

        {/* RIGHT — area tiles + contribution bars */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* 5-tile grid */}
          <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
            <h2 className="text-[17px] font-bold text-neutral-900">영역별 위험</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {areas.map((a) => (
                <AreaTile
                  key={a.id}
                  to={a.meta.path}
                  label={a.meta.label}
                  icon={a.meta.icon}
                  score={a.score}
                />
              ))}
            </div>
          </section>

          {/* 위험점수 영역별 기여도 */}
          <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold text-neutral-900">위험점수 영역별 기여도</h2>
              <span className="text-[13px] text-neutral-400">총 {total}점 중</span>
            </div>
            <div className="mt-5 flex flex-col gap-4">
              {weightedBars.map((b) => (
                <RiskContributionBar
                  key={b.id}
                  label={b.label}
                  delta={b.delta}
                  max={b.max}
                  band={bandOf(areaRawScore(b.id, risk, profile))}
                />
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-neutral-400">
              각 영역 점수에 가중치를 적용해 합산한 값이에요. 가족력은 건강 점수에 반영돼 별도로 표시하지 않아요.
            </p>
          </section>
        </div>
      </div>

      {/* Footer nav */}
      <div className="mt-10 flex items-center justify-between gap-3">
        <Link
          to="/result"
          className="inline-flex h-12 items-center rounded-xl px-5 text-[15px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
        >
          이전
        </Link>
        <Link
          to={AREA_META.lifestyle.path}
          className="inline-flex h-12 items-center rounded-xl bg-brand-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
        >
          영역별 자세히 보기
        </Link>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Area tile (5-tile grid → :area)                                    */
/* ------------------------------------------------------------------ */

function AreaTile({
  to,
  label,
  icon,
  score,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  score: number;
}) {
  const band = bandOf(score);
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2.5 rounded-2xl bg-neutral-50 px-4 py-4 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:shadow-[var(--shadow-focus)]"
    >
      <span className="flex items-center justify-between">
        <span
          className="flex size-9 items-center justify-center rounded-xl bg-white text-neutral-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          style={{ color: BAND_COLOR[band] }}
        >
          {icon}
        </span>
        <Badge variant={BAND_BADGE[band]} size="sm">
          {BAND_LABEL[band]}
        </Badge>
      </span>
      <span className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold text-neutral-900">{label}</span>
        <span className="text-[18px] font-bold tabular-nums text-neutral-900">
          {score}
          <span className="ml-0.5 text-[12px] font-medium text-neutral-400">점</span>
        </span>
      </span>
    </Link>
  );
}

export default RiskDetail;
