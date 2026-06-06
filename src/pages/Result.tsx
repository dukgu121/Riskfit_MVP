/**
 * `Result` — the 4-tab result dashboard.
 *
 * The page is intentionally one file end-to-end: it owns the data flow
 * (read profile + insurances from localStorage → run the calc pipeline →
 * memoise a ReportSummary), then delegates each tab body to a dedicated
 * component under `components/result/*`. The page itself never holds
 * tab-specific rendering logic.
 *
 * Routing contract:
 *   - If there's no profile in storage we bounce back to /input/basic so a
 *     user can't deep-link past the wizard.
 *   - The route is already wrapped in `<ConsentGate>` at the router level,
 *     so we don't have to re-check consent here.
 */

import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { calculateCompleteness } from "../lib/completeness";
import {
  coverageFit as coverageFitOf,
  outOfPocket as outOfPocketOf,
  selectUserType,
  totalRiskScore,
} from "../lib/calc";
import { readInsurances, readProfile } from "../lib/storage";
import type {
  Insurance,
  ReportSummary,
  UserProfileInput,
} from "../types";

import { ChecklistTab } from "../components/result/ChecklistTab";
import { CoverageItemRow } from "../components/result/CoverageItemRow";
import { CoverageOverviewCard } from "../components/result/CoverageOverviewCard";
import { DisclaimerBanner } from "../components/result/DisclaimerBanner";
import { OutOfPocketCard } from "../components/result/OutOfPocketCard";
import { ReportTab } from "../components/result/ReportTab";
import { RiskFactorCard } from "../components/result/RiskFactorCard";
import { RiskScoreHero } from "../components/result/RiskScoreHero";
import { ResultTabs, type ResultTabId } from "../components/result/ResultTabs";
import { RiskBreakdownBars } from "../components/charts/RiskBreakdownBars";
import { Card } from "../components/ui/card";
import { riskBand } from "../lib/calc/interpret";

/* ----------------------------------------------------------------------
   Detail tab — interpretation helpers
   ----------------------------------------------------------------------
   We translate raw factor scores into a one-line Toss-tone interpretation
   and 2–3 plain-language reasons. The reasons are NOT calculated from the
   exact rule that fired (that would be a maintenance trap with the JSON
   rule files); they're derived from the user's input values so the user
   can recognise why their score landed where it did.
*/

function describeHealth(profile: UserProfileInput, score: number): {
  interpretation: string;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (profile.heightCm && profile.weightKg) {
    const bmi =
      profile.weightKg / Math.pow((profile.heightCm ?? 1) / 100, 2);
    if (bmi >= 25) reasons.push(`BMI ${bmi.toFixed(1)}, 비만 구간.`);
    else if (bmi >= 23)
      reasons.push(`BMI ${bmi.toFixed(1)}, 과체중 구간.`);
    else reasons.push(`BMI ${bmi.toFixed(1)}, 정상 범위.`);
  }
  if (profile.checkupIssue) reasons.push("최근 건강검진 이상 소견.");
  if (profile.currentDisease) reasons.push("치료 중인 질환.");
  const family = (profile.familyHistory ?? []).filter(
    (item) => item !== "none" && item !== "unknown",
  );
  if (family.length > 0)
    reasons.push(`가족력 ${family.length}건 반영.`);
  if (profile.hospitalVisits === "visits_6_plus")
    reasons.push("최근 1년 병원 방문 6회 이상.");

  const interpretation =
    score < 30
      ? "건강 신호는 낮은 편이에요."
      : score < 60
        ? "건강 신호는 평균 수준이에요."
        : "건강 신호가 평균보다 조금 높아요.";

  return { interpretation, reasons };
}

function describeLifestyle(profile: UserProfileInput, score: number): {
  interpretation: string;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (profile.smoking === "yes") reasons.push("흡연.");
  if (profile.drinking === "weekly_3_plus")
    reasons.push("주 3회 이상 음주.");
  if (profile.exercise === "rare" || profile.exercise === "weekly_1_or_less")
    reasons.push("운동 주 1회 이하.");
  if (profile.sleep === "under_6") reasons.push("평균 수면 6시간 미만.");
  if (profile.stress === "high") reasons.push("스트레스 높음.");
  if (profile.overtime === "weekly_3_plus")
    reasons.push("주 3회 이상 야근.");

  const interpretation =
    score < 25
      ? "생활 습관 신호는 낮은 편이에요."
      : score < 60
        ? "생활 습관에서 살펴볼 부분이 있어요."
        : "생활 신호가 평균보다 조금 높아요.";

  return { interpretation, reasons };
}

function describeJob(profile: UserProfileInput, score: number): {
  interpretation: string;
  reasons: string[];
} {
  const map: Record<string, string> = {
    student: "학생",
    office: "사무직",
    service: "서비스직",
    driving: "운전직",
    field: "현장직",
  };
  const label = profile.jobGroup ? map[profile.jobGroup] ?? "기타" : "기타";
  const reasons: string[] = [];
  if (profile.jobGroup)
    reasons.push(`${label} 분류 평균 산업재해 지표 기준.`);
  if (score >= 60) reasons.push("업무 환경의 사고·질환 노출이 평균보다 높음.");

  const interpretation =
    score < 30
      ? "직업 환경 신호는 낮은 편이에요."
      : score < 60
        ? "직업 환경 신호는 평균 수준이에요."
        : "직업 환경 신호가 평균보다 조금 높아요.";

  return { interpretation, reasons };
}

function describeFinance(
  profile: UserProfileInput,
  insurances: Insurance[],
  score: number,
): { interpretation: string; reasons: string[] } {
  const reasons: string[] = [];
  if (
    profile.emergencyFund != null &&
    profile.monthlyExpense &&
    profile.monthlyExpense > 0
  ) {
    const months = profile.emergencyFund / profile.monthlyExpense;
    if (months < 1)
      reasons.push("비상금 1개월치 미만.");
    else if (months < 3)
      reasons.push(`비상금 약 ${months.toFixed(1)}개월치.`);
    else reasons.push(`비상금 약 ${months.toFixed(1)}개월치 확보.`);
  }
  if (
    profile.monthlyIncome &&
    profile.monthlyExpense &&
    profile.monthlyIncome > 0
  ) {
    const ratio = profile.monthlyExpense / profile.monthlyIncome;
    if (ratio >= 0.7)
      reasons.push("월 고정지출 소득의 70% 이상.");
    else if (ratio >= 0.5)
      reasons.push("월 고정지출 소득의 50% 이상.");
  }
  if (profile.hasDependents) reasons.push("부양가족 가중치 반영.");
  const totalPremium = insurances.reduce(
    (sum, item) => sum + (item.monthlyPremium ?? 0),
    0,
  );
  if (profile.monthlyIncome && totalPremium / profile.monthlyIncome >= 0.05)
    reasons.push("보험료 월 소득의 5% 이상.");

  const interpretation =
    score < 25
      ? "재무 신호는 낮은 편이에요."
      : score < 60
        ? "재무 신호에서 살펴볼 부분이 있어요."
        : "재무 신호가 평균보다 조금 높아요.";

  return { interpretation, reasons };
}

/* ----------------------------------------------------------------------
   Main page
   ---------------------------------------------------------------------- */

export function Result() {
  const profile = readProfile<UserProfileInput>();
  const insurances = readInsurances<Insurance>();
  const [activeTab, setActiveTab] = useState<ResultTabId>("dashboard");

  const data = useMemo(() => {
    if (!profile) return null;
    const userType = selectUserType(profile);
    const riskScore = totalRiskScore(profile, insurances);
    const coverageFit = coverageFitOf(insurances, userType);
    const outOfPocket = outOfPocketOf(profile, insurances);
    const completeness = calculateCompleteness(profile, insurances);
    const summary: ReportSummary = {
      profileSummary: {
        name: profile.name,
        age: profile.age,
        jobGroup: profile.jobGroup,
        userType,
      },
      riskScore,
      coverageFit,
      weakCoverages: coverageFit.weakCoverages,
      cautionCoverages: coverageFit.cautionCoverages,
      expectedOutOfPocket: outOfPocket.total,
      expectedOutOfPocketText: outOfPocket.displayText,
      completeness: completeness.percent,
    };
    return { riskScore, coverageFit, outOfPocket, userType, summary };
  }, [profile, insurances]);

  if (!profile || !data) {
    return <Navigate to="/input/basic" replace />;
  }

  const { riskScore, coverageFit, outOfPocket, summary } = data;

  const breakdown = [
    { label: "건강", value: riskScore.health },
    { label: "생활", value: riskScore.lifestyle },
    { label: "직업", value: riskScore.job },
    { label: "재무", value: riskScore.finance },
  ];

  const healthDesc = describeHealth(profile, riskScore.health);
  const lifestyleDesc = describeLifestyle(profile, riskScore.lifestyle);
  const jobDesc = describeJob(profile, riskScore.job);
  const financeDesc = describeFinance(profile, insurances, riskScore.finance);

  return (
    <section
      aria-labelledby="result-heading"
      className="flex-1 px-5 pt-6 pb-32"
    >
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1
            id="result-heading"
            className="text-2xl font-bold tracking-tight text-neutral-900"
          >
            결과
          </h1>
          <p className="text-xs font-medium text-neutral-500 tabular-nums">
            입력 완성도 {summary.completeness}%
          </p>
        </header>

        <DisclaimerBanner />

        <ResultTabs
          value={activeTab}
          onValueChange={setActiveTab}
          dashboard={
            <>
              <RiskScoreHero
                riskScore={riskScore}
                userName={profile.name}
              />
              <Card className="p-6">
                <p className="text-sm font-medium text-neutral-600">
                  요인별 신호
                </p>
                <div className="mt-4">
                  <RiskBreakdownBars items={breakdown} />
                </div>
              </Card>
              <CoverageOverviewCard coverageFit={coverageFit} />
              <OutOfPocketCard outOfPocket={outOfPocket} />
            </>
          }
          detail={
            <>
              <RiskFactorCard
                title="건강 신호"
                subtitle="BMI · 검진 · 가족력 · 진료 빈도"
                score={riskScore.health}
                band={riskBand(riskScore.health).id}
                bandLabel={riskBand(riskScore.health).label}
                interpretation={healthDesc.interpretation}
                reasons={healthDesc.reasons}
              />
              <RiskFactorCard
                title="생활 신호"
                subtitle="흡연 · 음주 · 운동 · 수면 · 스트레스"
                score={riskScore.lifestyle}
                band={riskBand(riskScore.lifestyle).id}
                bandLabel={riskBand(riskScore.lifestyle).label}
                interpretation={lifestyleDesc.interpretation}
                reasons={lifestyleDesc.reasons}
              />
              <RiskFactorCard
                title="직업 신호"
                subtitle="업무 환경 분류 기준"
                score={riskScore.job}
                band={riskBand(riskScore.job).id}
                bandLabel={riskBand(riskScore.job).label}
                interpretation={jobDesc.interpretation}
                reasons={jobDesc.reasons}
              />
              <RiskFactorCard
                title="재무 신호"
                subtitle="비상금 · 고정지출 · 부양가족"
                score={riskScore.finance}
                band={riskBand(riskScore.finance).id}
                bandLabel={riskBand(riskScore.finance).label}
                interpretation={financeDesc.interpretation}
                reasons={financeDesc.reasons}
              />
              <Card className="p-6">
                <p className="text-sm font-medium text-neutral-600">
                  보장별 적합도
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  지금 가입한 보장과 표준치 비교.
                </p>
                <div className="mt-5 flex flex-col gap-5">
                  {coverageFit.items.map((item) => (
                    <CoverageItemRow key={item.type} item={item} />
                  ))}
                </div>
              </Card>
            </>
          }
          report={<ReportTab summary={summary} />}
          checklist={<ChecklistTab coverageFit={coverageFit} />}
        />
      </div>
    </section>
  );
}

export default Result;
