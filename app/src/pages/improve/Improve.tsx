/**
 * p23 「우선 개선 필요 항목」 — /improve.
 *
 * Reads the single cached analysis (READ-ONLY) + the source profile/insurances,
 * builds the improvement plan via `lib/calc/improvement.ts`, and shows:
 *   - a BeforeAfterCompare hero (지금 FIT → 개선 후 FIT, a REAL recompute — never a
 *     risk-score "improvement"),
 *   - the TOP3 우선 개선 항목 as ImprovementPriorityCard (부족 금액 + CoverageBar).
 * CTA → /improve/plan ; back → /result.
 *
 * Web/Toss tone via AppShell (tighter maxWidth for this single-column flow).
 */

import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { InfoBanner } from "../../components/ui/InfoBanner";
import { BeforeAfterCompare } from "../../components/improve/BeforeAfterCompare";
import { ImprovementPriorityCard } from "../../components/improve/ImprovementPriorityCard";
import { improvementPlan } from "../../lib/calc/improvement";
import { readAnalysis } from "../../lib/draft";
import { readInsurances, readProfile } from "../../lib/storage";
import type { Insurance, UserProfileInput } from "../../types";

export function Improve() {
  const navigate = useNavigate();

  const model = useMemo(() => {
    const analysis = readAnalysis();
    if (!analysis) return null;
    const profile = readProfile<UserProfileInput>();
    const insurances = readInsurances<Insurance>();
    return improvementPlan(analysis, profile, insurances);
  }, []);

  // No cached analysis → the user hasn't run /analyzing. Send them there.
  if (!model) return <Navigate to="/analyzing" replace />;

  const allDone = model.items.length === 0;
  const gain = Math.max(0, model.projectedOverallFit - model.currentOverallFit);

  return (
    <AppShell title="개선 방법" backTo="/result" maxWidth={680}>
      <div className="mx-auto w-full max-w-[560px]">
        {/* Title */}
        <div>
          <span className="text-sm font-semibold text-brand-500">보장 개선</span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[32px]"
          >
            {allDone ? "지금도 잘 갖춰져 있어요" : "이렇게 채우면 더 든든해져요"}
          </motion.h1>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
            {allDone
              ? "비어 있는 보장이 없어요. 현재 보장을 그대로 유지해도 좋아요."
              : `비어 있는 보장을 채우면 보장 적합도가 ${gain}%p 올라가요.`}
          </p>
        </div>

        {/* Before → After hero (projected FIT) */}
        <div className="mt-7">
          <BeforeAfterCompare
            current={model.currentOverallFit}
            projected={model.projectedOverallFit}
            caption="우선순위 항목을 모두 채웠을 때 예상되는 보장 적합도예요."
          />
        </div>

        {/* TOP3 우선 개선 */}
        {!allDone && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold text-neutral-900">먼저 채우면 좋은 보장</h2>
              <span className="text-[13px] text-neutral-400">공백이 큰 순서</span>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {model.top3.map((item, i) => (
                <ImprovementPriorityCard key={item.type} rank={i + 1} item={item} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-6">
          <InfoBanner tone="info">
            개선 효과는 입력하신 보장을 권장 수준까지 채웠다고 가정해 계산한 참고값이에요.
          </InfoBanner>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col gap-2.5">
          <Button
            variant="default"
            size="lg"
            fullWidth
            onClick={() => navigate("/improve/plan")}
          >
            {allDone ? "개선 계획 보기" : "개선 계획 세우기"}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => navigate("/result")}
          >
            결과로 돌아가기
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default Improve;
