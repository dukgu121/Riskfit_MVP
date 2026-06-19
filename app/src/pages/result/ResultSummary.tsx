/**
 * p16 「분석 결과 요약」 — the real result summary (was the gold-reference
 * prototype `ProtoResultSummary`, now reading the cached `riskfit.analysis`).
 *
 * HERO = 보장 적합도 FIT (`coverageFit.overall`, higher = better) — NOT the
 * risk score (FIT/RISK polarity contract, MIGRATION_PLAN §9). The risk-score
 * "영역별 기여도" bars that the PDF crammed here moved to p17 per the Toss
 * simplification.
 *
 * Reads READ-ONLY via `lib/draft.readAnalysis()`; on the ungated `/proto`
 * surface Agent A seeds the cache first. If the cache is genuinely missing we
 * self-seed the preview sample so the screen always renders something real.
 *
 * Layout: desktop WEB, two-column grid (hero left, coverage detail right),
 * Toss-minimal — white cards, single brand accent, colour only on band badges /
 * bar fills. One primary CTA (개선 방법 보기 → /improve) + one secondary
 * (상세 보기 → /result/detail).
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { CoverageBar } from "../../components/charts/CoverageBar";
import { ScoreDoughnut } from "../../components/charts/ScoreDoughnut";
import { readAnalysis, resetDiagnosis } from "../../lib/draft";
import { readProfile } from "../../lib/storage";
import { buildSummaryBlurb } from "../../lib/report/areaComments";
import type {
  AnalysisCache,
  CoverageBandId,
  CoverageFitItem,
  UserProfileInput,
} from "../../types";

/* ------------------------------------------------------------------ */
/*  Band → presentation tokens                                         */
/* ------------------------------------------------------------------ */

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

/** Overall fit band → hero badge + caption. */
const OVERALL_BADGE: Record<
  CoverageBandId,
  { variant: "success" | "warn" | "danger" | "info"; caption: string }
> = {
  sufficient: { variant: "success", caption: "보장이 충분해요" },
  caution: { variant: "warn", caption: "몇 가지 보장을 점검해 보세요" },
  insufficient: { variant: "danger", caption: "비어 있는 보장이 많아요" },
  excessive: { variant: "info", caption: "보장이 과도한 편이에요" },
};

function formatKrw(n: number): string {
  if (n >= 100_000_000) {
    const eok = n / 100_000_000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억원`;
  }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

/** Unit suffix for a per-day / per-month coverage gap. */
function unitSuffix(unit: CoverageFitItem["unit"]): string {
  if (unit === "krw_per_day") return " / 일";
  if (unit === "krw_per_month") return " / 월";
  return "";
}

/** Numeric current/standard for money items (presence items have no gap). */
function moneyOf(item: CoverageFitItem): { current: number; standard: number } | null {
  if (item.unit === "presence") return null;
  const current = typeof item.current === "number" ? item.current : 0;
  const standard = typeof item.standard === "number" ? item.standard : 0;
  return { current, standard };
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export function ResultSummary() {
  const navigate = useNavigate();

  // Read the analysis cache (written once by /analyzing). The ungated /proto
  // preview seeds sample data BEFORE this screen mounts, so we never seed here —
  // doing so would show a real (logged-in) user the sample person's data when
  // the cache is genuinely missing. Null falls through to the guard below.
  const [analysis] = useState<AnalysisCache | null>(() => readAnalysis());

  const profile = useMemo(() => readProfile<UserProfileInput>(), []);

  const handleReset = () => {
    resetDiagnosis();
    navigate("/input/basic");
  };

  if (!analysis) {
    return (
      <AppShell title="분석 결과">
        <div className="py-24 text-center text-neutral-400">
          분석 데이터를 불러올 수 없어요. 다시 진단해 주세요.
        </div>
      </AppShell>
    );
  }

  const fit = analysis.coverageFit;
  const items = fit.items;
  const overall = fit.overall;
  const overallBand = OVERALL_BADGE[fit.band];

  const counts = {
    sufficient: items.filter((i) => i.band === "sufficient").length,
    caution: items.filter((i) => i.band === "caution").length,
    insufficient: items.filter((i) => i.band === "insufficient").length,
    excessive: items.filter((i) => i.band === "excessive").length,
  };

  // 우선 점검 TOP3 — 부족(insufficient) 먼저, 그다음 주의(caution); 공백 큰 순.
  // Plain computations (cheap, no hooks) so they sit safely after the
  // `if (!analysis)` guard without violating hook order.
  const priority = buildPriority(items);

  const blurb = buildSummaryBlurb({
    fitScore: overall,
    fitBand: fit.band,
    weakCoverages: fit.weakCoverages,
    cautionCoverages: fit.cautionCoverages,
    name: profile.name,
  });

  const firstName = profile.name ? `${profile.name}님께` : "회원님께";

  return (
    <AppShell
      title="분석 결과"
      headerAction={
        <button
          type="button"
          onClick={handleReset}
          className="h-9 rounded-lg px-3.5 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
        >
          다시 진단하기
        </button>
      }
    >
      {/* Title */}
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500">
          분석 완료
          <span className="text-[12px] font-medium text-neutral-400">· 저장됨</span>
        </span>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[40px]"
        >
          분석이 끝났어요
        </motion.h1>
        <p className="mt-2 text-[16px] leading-relaxed text-neutral-500 lg:text-[17px]">
          {firstName} 필요한 보장을 정리했어요. {blurb}
        </p>
      </div>

      {/* Two-column grid */}
      <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT — hero */}
        <section className="lg:col-span-5">
          <div className="flex h-full flex-col items-center rounded-3xl bg-white px-8 py-10 shadow-card">
            <div className="relative flex items-center justify-center">
              <ScoreDoughnut value={overall} size={208} ariaLabel={`보장 적합도 ${overall}%`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-baseline">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[64px] font-extrabold leading-none tracking-tight text-neutral-900 tabular-nums"
                  >
                    {overall}
                  </motion.span>
                  <span className="ml-1 text-[26px] font-bold text-neutral-400">%</span>
                </div>
                <span className="mt-1.5 text-sm font-medium text-neutral-400">보장 적합도</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Badge variant={overallBand.variant} size="default">
                {fit.bandLabel}
              </Badge>
              <span className="text-[15px] font-medium text-neutral-700">
                {overallBand.caption}
              </span>
            </div>

            <dl className="mt-7 grid w-full grid-cols-4 gap-2.5">
              <CountCell label="충분" count={counts.sufficient} tone="text-success-600" />
              <CountCell label="주의" count={counts.caution} tone="text-warn-600" />
              <CountCell label="부족" count={counts.insufficient} tone="text-danger-500" />
              <CountCell label="과도" count={counts.excessive} tone="text-info-600" />
            </dl>
          </div>
        </section>

        {/* RIGHT — detail */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* 보장 영역별 적합도 */}
          <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
            <h2 className="text-[17px] font-bold text-neutral-900">보장 영역별 적합도</h2>
            <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item.type}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[15px] font-medium text-neutral-800">{item.label}</span>
                    <span className="text-[13px] font-semibold tabular-nums text-neutral-500">
                      {item.fit}
                      <span className="text-neutral-300">%</span>
                    </span>
                  </div>
                  <CoverageBar value={item.fit} band={item.band} ariaLabel={`${item.label} ${item.fit}%`} />
                </div>
              ))}
            </div>
          </section>

          {/* 우선 점검이 필요한 보장 */}
          {priority.length > 0 && (
            <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[17px] font-bold text-neutral-900">우선 점검이 필요한 보장</h2>
                <span className="text-[13px] text-neutral-400">공백이 큰 순서</span>
              </div>
              <ul className="mt-3 flex flex-col">
                {priority.map((item, i) => {
                  const money = moneyOf(item);
                  const gap = money ? Math.max(0, money.standard - money.current) : null;
                  const isMissing = money ? money.current <= 0 : item.fit <= 0;
                  return (
                    <li key={item.type}>
                      {i > 0 && <div className="h-px bg-neutral-100" />}
                      <button
                        type="button"
                        onClick={() => navigate("/result/detail")}
                        className="flex w-full items-center gap-4 rounded-2xl px-2 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold text-neutral-500 tabular-nums">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[16px] font-semibold text-neutral-900">{item.label}</span>
                            <Badge variant={BADGE_VARIANT[item.band]} size="sm">
                              {BAND_LABEL[item.band]}
                            </Badge>
                          </span>
                          <span className="mt-0.5 block text-[13px] text-neutral-400">
                            {money === null
                              ? isMissing
                                ? "현재 미가입"
                                : "가입 완료"
                              : isMissing
                                ? "현재 미가입"
                                : `현재 ${formatKrw(money.current)} · 권장 ${formatKrw(money.standard)}`}
                          </span>
                        </span>
                        {gap !== null && gap > 0 && (
                          <span className="flex shrink-0 items-center gap-1.5 text-right">
                            <span className="text-[16px] font-bold text-neutral-900 tabular-nums">
                              +{formatKrw(gap)}
                              <span className="text-[12px] font-medium text-neutral-400">
                                {unitSuffix(item.unit)}
                              </span>
                            </span>
                            <Chevron />
                          </span>
                        )}
                        {(gap === null || gap <= 0) && <Chevron />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
          <Button variant="default" size="default" fullWidth onClick={() => navigate("/improve")}>
            개선 방법 보기
          </Button>
          <Button variant="outline" size="default" fullWidth onClick={() => navigate("/result/detail")}>
            상세 분석 보기
          </Button>
        </div>
        <p className="text-[12px] leading-relaxed text-neutral-400">
          이 결과는 입력 정보를 바탕으로 한 참고용 분석이에요.
        </p>
      </div>
    </AppShell>
  );
}

/**
 * Pick the 우선 점검 TOP3: insufficient (부족) first, then caution (주의),
 * each worst-first by fit. Presence items with no gap sink below money gaps.
 */
function buildPriority(items: CoverageFitItem[]): CoverageFitItem[] {
  const weak = items.filter((i) => i.band === "insufficient");
  const caution = items.filter((i) => i.band === "caution");
  const ordered = [...weak, ...caution].sort((a, b) => a.fit - b.fit);
  return ordered.slice(0, 3);
}

function CountCell({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-neutral-50 py-3.5">
      <dt className="text-[12px] font-medium text-neutral-400">{label}</dt>
      <dd
        className={`text-[22px] font-bold leading-none tabular-nums ${
          count === 0 ? "text-neutral-300" : tone
        }`}
      >
        {count}
      </dd>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-neutral-300">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default ResultSummary;
