/**
 * p24 「개선 우선순위 및 계획」 — /improve/plan.
 *
 * The full list of fillable improvement items (every user-facing gap, not just
 * TOP3) with the recommended target behind a "권장 보기" tap, plus a PlanChecklist
 * whose progress is shared with the result ChecklistTab (same storage key).
 * CTA → /improve/preview ; back → /improve.
 */

import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { ImprovementPriorityCard } from "../../components/improve/ImprovementPriorityCard";
import { PlanChecklist } from "../../components/improve/PlanChecklist";
import { improvementPlan } from "../../lib/calc/improvement";
import { readAnalysis } from "../../lib/draft";
import { readInsurances, readProfile } from "../../lib/storage";
import type { Insurance, UserProfileInput } from "../../types";

export function ImprovePlan() {
  const navigate = useNavigate();

  const model = useMemo(() => {
    const analysis = readAnalysis();
    if (!analysis) return null;
    const profile = readProfile<UserProfileInput>();
    const insurances = readInsurances<Insurance>();
    return improvementPlan(analysis, profile, insurances);
  }, []);

  if (!model) return <Navigate to="/analyzing" replace />;

  const allDone = model.items.length === 0;

  return (
    <AppShell title="개선 계획" backTo="/improve" maxWidth={680}>
      <div className="mx-auto w-full max-w-[560px]">
        <div>
          <span className="text-sm font-semibold text-brand-500">개선 계획</span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[32px]"
          >
            채울 보장을 정리했어요
          </motion.h1>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
            {allDone
              ? "지금은 채울 보장이 없어요."
              : "각 항목의 권장 수준을 확인하고, 살펴본 항목은 체크해 두세요."}
          </p>
        </div>

        {!allDone && (
          <section className="mt-7">
            <h2 className="text-[17px] font-bold text-neutral-900">개선 항목 전체</h2>
            <div className="mt-3 flex flex-col gap-3">
              {model.items.map((item, i) => (
                <ImprovementPriorityCard
                  key={item.type}
                  rank={i + 1}
                  item={item}
                  targetHidden
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <PlanChecklist items={model.items} />
        </section>

        <div className="mt-8 flex flex-col gap-2.5">
          <Button
            variant="default"
            size="lg"
            fullWidth
            onClick={() => navigate("/improve/preview")}
          >
            개선 효과 미리보기
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => navigate("/improve")}
          >
            이전으로
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default ImprovePlan;
