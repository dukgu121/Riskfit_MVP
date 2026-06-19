/**
 * PROTOTYPE — p16 「분석 결과 요약」 restyled in minimal Toss style, WEB layout.
 * Ungated route `/proto/result`.
 *
 * Direction (PO, 2026-06-14): desktop web app, no phone frame. Uses the shared
 * `AppShell` (sticky web header + max-width container) and a two-column grid
 * (hero left, coverage detail right). Same content/components/flow as PDF p16;
 * only the layout is web-native.
 *
 * Demonstrates MIGRATION_PLAN.md §1: single accent (brand blue), one big
 * tabular hero number, gray surface tints over borders, color only on band
 * badges / bar fills, one primary CTA. Reuses CoverageBar / Badge / ScoreDoughnut.
 *
 * Data is a hand-authored SAMPLE over the 6 user-facing 보장 types (OD-11).
 * Real screens will read the cached `riskfit.analysis`.
 */

import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { CoverageBar } from "../../components/charts/CoverageBar";
import { ScoreDoughnut } from "../../components/charts/ScoreDoughnut";
import type { CoverageBandId } from "../../types";

/* ------------------------------------------------------------------ */
/*  Sample data (6 user-facing 보장, twenties_new_worker → 72%, 주의)    */
/* ------------------------------------------------------------------ */

type Unit = "presence" | "krw_per_event" | "krw_per_day" | "krw_per_month";

interface AreaItem {
  label: string;
  fit: number;
  band: CoverageBandId;
  current: number | null; // null = presence-only (가입/미가입)
  standard: number | null;
  unit: Unit;
}

const AREAS: AreaItem[] = [
  { label: "실손의료비", fit: 100, band: "sufficient", current: null, standard: null, unit: "presence" },
  { label: "수술비", fit: 100, band: "sufficient", current: null, standard: null, unit: "presence" },
  { label: "암 진단비", fit: 90, band: "sufficient", current: 36_000_000, standard: 40_000_000, unit: "krw_per_event" },
  { label: "질병 입원비", fit: 80, band: "caution", current: 40_000, standard: 50_000, unit: "krw_per_day" },
  { label: "상해 입원비", fit: 60, band: "caution", current: 18_000, standard: 30_000, unit: "krw_per_day" },
  { label: "소득중단 보장", fit: 0, band: "insufficient", current: 0, standard: 1_500_000, unit: "krw_per_month" },
];

const OVERALL = Math.round(AREAS.reduce((s, a) => s + a.fit, 0) / AREAS.length); // 72

const COUNTS = {
  sufficient: AREAS.filter((a) => a.band === "sufficient").length,
  caution: AREAS.filter((a) => a.band === "caution").length,
  insufficient: AREAS.filter((a) => a.band === "insufficient").length,
  excessive: AREAS.filter((a) => a.band === "excessive").length,
};

// 우선 점검 TOP3 — 공백이 큰 순(미가입 먼저).
const PRIORITY = [AREAS[5], AREAS[4], AREAS[3]];

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

const UNIT_SUFFIX: Record<Unit, string> = {
  presence: "",
  krw_per_event: "",
  krw_per_day: " / 일",
  krw_per_month: " / 월",
};

function formatKrw(n: number): string {
  if (n >= 100_000_000) {
    const eok = n / 100_000_000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억원`;
  }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export function ProtoResultSummary() {
  return (
    <AppShell
      brandTo="/proto"
      title="분석 결과"
      headerAction={
        <button
          type="button"
          className="h-9 rounded-lg px-3.5 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
        >
          다시 진단하기
        </button>
      }
    >
      {/* Title */}
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-brand-500">분석 완료</span>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[40px]"
        >
          분석이 끝났어요
        </motion.h1>
        <p className="mt-2 text-[16px] leading-relaxed text-neutral-500 lg:text-[17px]">
          엄덕현님께 필요한 보장을 정리했어요. 비어 있는 보장부터 먼저 채워 보세요.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT — hero */}
        <section className="lg:col-span-5">
          <div className="flex h-full flex-col items-center rounded-3xl bg-white px-8 py-10 shadow-card">
            <div className="relative flex items-center justify-center">
              <ScoreDoughnut value={OVERALL} size={208} ariaLabel={`보장 적합도 ${OVERALL}%`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-baseline">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[64px] font-extrabold leading-none tracking-tight text-neutral-900 tabular-nums"
                  >
                    {OVERALL}
                  </motion.span>
                  <span className="ml-1 text-[26px] font-bold text-neutral-400">%</span>
                </div>
                <span className="mt-1.5 text-sm font-medium text-neutral-400">보장 적합도</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Badge variant="warn" size="default">
                주의
              </Badge>
              <span className="text-[15px] font-medium text-neutral-700">
                몇 가지 보장을 점검해 보세요
              </span>
            </div>

            <dl className="mt-7 grid w-full grid-cols-4 gap-2.5">
              <CountCell label="충분" count={COUNTS.sufficient} tone="text-success-600" />
              <CountCell label="주의" count={COUNTS.caution} tone="text-warn-600" />
              <CountCell label="부족" count={COUNTS.insufficient} tone="text-danger-500" />
              <CountCell label="과도" count={COUNTS.excessive} tone="text-info-600" />
            </dl>
          </div>
        </section>

        {/* RIGHT — detail */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* 보장 영역별 적합도 */}
          <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
            <h2 className="text-[17px] font-bold text-neutral-900">보장 영역별 적합도</h2>
            <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {AREAS.map((a) => (
                <div key={a.label}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[15px] font-medium text-neutral-800">{a.label}</span>
                    <span className="text-[13px] font-semibold tabular-nums text-neutral-500">
                      {a.fit}
                      <span className="text-neutral-300">%</span>
                    </span>
                  </div>
                  <CoverageBar value={a.fit} band={a.band} ariaLabel={`${a.label} ${a.fit}%`} />
                </div>
              ))}
            </div>
          </section>

          {/* 우선 점검이 필요한 보장 */}
          <section className="rounded-3xl bg-white px-7 py-6 shadow-card">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold text-neutral-900">우선 점검이 필요한 보장</h2>
              <span className="text-[13px] text-neutral-400">공백이 큰 순서</span>
            </div>
            <ul className="mt-3 flex flex-col">
              {PRIORITY.map((a, i) => {
                const gap = (a.standard ?? 0) - (a.current ?? 0);
                return (
                  <li key={a.label}>
                    {i > 0 && <div className="h-px bg-neutral-100" />}
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 rounded-2xl px-2 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold text-neutral-500 tabular-nums">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[16px] font-semibold text-neutral-900">{a.label}</span>
                          <Badge variant={BADGE_VARIANT[a.band]} size="sm">
                            {BAND_LABEL[a.band]}
                          </Badge>
                        </span>
                        <span className="mt-0.5 block text-[13px] text-neutral-400">
                          {a.current === 0
                            ? "현재 미가입"
                            : `현재 ${formatKrw(a.current ?? 0)} · 권장 ${formatKrw(a.standard ?? 0)}`}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-right">
                        <span className="text-[16px] font-bold text-neutral-900 tabular-nums">
                          +{formatKrw(gap)}
                          <span className="text-[12px] font-medium text-neutral-400">
                            {UNIT_SUFFIX[a.unit]}
                          </span>
                        </span>
                        <Chevron />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
          <Button variant="default" size="default" fullWidth>
            개선 방법 보기
          </Button>
          <Button variant="outline" size="default" fullWidth>
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

export default ProtoResultSummary;
