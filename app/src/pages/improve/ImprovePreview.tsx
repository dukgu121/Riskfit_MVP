/**
 * p25 「개선 효과 미리보기」 — /improve/preview.
 *
 * Runs the REAL `simulateImprovement` (virtual-gap recompute of coverageFit +
 * outOfPocket) and shows the 3-metric before/after:
 *   - 보장 적합도 FIT (HERO, higher better) — this is the headline,
 *   - 보장 공백 개수 (lower better),
 *   - 예상 자기부담금 (lower better).
 * NEVER a risk-score "improvement". CTA → /report ; back → /improve/plan.
 */

import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { InfoBanner } from "../../components/ui/InfoBanner";
import { BeforeAfterCompare } from "../../components/improve/BeforeAfterCompare";
import { MetricCompareCard } from "../../components/improve/MetricCompareCard";
import { simulateImprovement } from "../../lib/calc/improvement";
import { readAnalysis } from "../../lib/draft";
import { readInsurances, readProfile } from "../../lib/storage";
import { formatKrw } from "../../components/improve/format";
import type { Insurance, UserProfileInput } from "../../types";

export function ImprovePreview() {
  const navigate = useNavigate();

  const sim = useMemo(() => {
    const analysis = readAnalysis();
    if (!analysis) return null;
    const profile = readProfile<UserProfileInput>();
    const insurances = readInsurances<Insurance>();
    return simulateImprovement(profile, insurances);
  }, []);

  if (!sim) return <Navigate to="/analyzing" replace />;

  const noChange =
    sim.fit.before === sim.fit.after &&
    sim.gapCount.before === sim.gapCount.after &&
    sim.outOfPocket.before === sim.outOfPocket.after;

  return (
    <AppShell title="개선 효과" backTo="/improve/plan" maxWidth={680}>
      <div className="mx-auto w-full max-w-[560px]">
        <div>
          <span className="text-sm font-semibold text-brand-500">개선 효과</span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[32px]"
          >
            {noChange ? "이미 잘 갖춰져 있어요" : "이만큼 든든해져요"}
          </motion.h1>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
            권장 보장을 모두 채웠다고 가정했을 때 달라지는 모습이에요.
          </p>
        </div>

        {/* HERO — FIT before/after */}
        <div className="mt-7">
          <BeforeAfterCompare
            current={sim.fit.before}
            projected={sim.fit.after}
            caption="보장 적합도가 이렇게 올라가요."
          />
        </div>

        {/* Secondary metrics */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCompareCard
            label="보장 공백"
            before={sim.gapCount.before}
            after={sim.gapCount.after}
            format={(v) => `${Math.round(v)}개`}
            betterWhen="lower"
            caption="부족·주의 보장 수"
          />
          <MetricCompareCard
            label="예상 자기부담금"
            before={sim.outOfPocket.before}
            after={sim.outOfPocket.after}
            format={(v) => formatKrw(v)}
            betterWhen="lower"
            caption="질병 7일 입원 기준"
          />
        </div>

        <div className="mt-6">
          <InfoBanner tone="info">
            보장 적합도·공백은 입력값으로 실제 다시 계산한 결과예요. 자기부담금은 표준
            시나리오 기준 추정치예요.
          </InfoBanner>
        </div>

        <div className="mt-8 flex flex-col gap-2.5">
          <Button
            variant="default"
            size="lg"
            fullWidth
            onClick={() => navigate("/report")}
          >
            최종 리포트 보기
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => navigate("/improve/plan")}
          >
            계획 다시 보기
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default ImprovePreview;
