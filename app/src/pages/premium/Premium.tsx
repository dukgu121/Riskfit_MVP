/**
 * p27 「Premium 구독하기」 — /premium. Demo paywall (no real payment).
 *
 * A `PremiumSurface` (premium-50 wash + flat crown — no gradient) frames two
 * benefit rows from `data/premiumPlan.json` and a free-trial caption. The
 * primary CTA flips the demo flag (`setPremium(true)`) and routes to
 * /premium/lifecycle; "나중에" returns to /report. Single-accent discipline: the
 * CTA stays brand blue inside the purple surface.
 */

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, LineChart, FileText } from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { PremiumSurface } from "../../components/ui/PremiumSurface";
import { setPremium } from "../../lib/draft";
import plan from "../../data/premiumPlan.json";

const BENEFIT_ICON: Record<string, typeof LineChart> = {
  lifecycle: LineChart,
  "premium-report": FileText,
};

export function Premium() {
  const navigate = useNavigate();

  const subscribe = () => {
    setPremium(true);
    navigate("/premium/lifecycle");
  };

  return (
    <AppShell title="Premium" backTo="/report" maxWidth={620}>
      <div className="mx-auto w-full max-w-[520px]">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 rounded-full bg-premium-50 px-3 py-1 text-[12px] font-bold text-premium-600"
          >
            <Sparkles className="size-3.5" strokeWidth={2.4} aria-hidden />
            {plan.eyebrow}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[32px]"
          >
            {plan.tagline}
          </motion.h1>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">
            나이에 따른 위험 변화와 예상 의료비까지 확장 리포트로 살펴봐요.
          </p>
        </div>

        {/* Premium surface with benefit rows */}
        <PremiumSurface
          className="mt-7"
          eyebrow={plan.eyebrow}
          title={plan.name}
        >
          <ul className="flex flex-col gap-4">
            {plan.benefits.map((benefit) => {
              const Icon = BENEFIT_ICON[benefit.id] ?? Sparkles;
              return (
                <li key={benefit.id} className="flex items-start gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-premium-100 text-premium-600">
                    <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-neutral-900">{benefit.title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex items-baseline justify-between rounded-2xl bg-white/70 px-4 py-3">
            <span className="text-[13px] font-medium text-neutral-500">구독료</span>
            <span className="text-[18px] font-extrabold text-neutral-900 tabular-nums">
              {plan.priceLabel}
            </span>
          </div>
        </PremiumSurface>

        {/* CTA */}
        <div className="mt-7 flex flex-col gap-2.5">
          <Button variant="default" size="lg" fullWidth onClick={subscribe}>
            무료로 시작하기
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => navigate("/report")}>
            나중에
          </Button>
        </div>

        <p className="mt-4 text-center text-[12px] leading-relaxed text-neutral-400">
          {plan.trialCaption}
        </p>
      </div>
    </AppShell>
  );
}

export default Premium;
