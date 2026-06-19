/**
 * p2 「온보딩 — 수집 정보 안내」 (/onboarding/info)
 *
 * 진단을 위해 어떤 정보를 입력받는지 미리 보여 준다. 4개 영역(건강 · 생활습관 ·
 * 가족력 · 보험)을 ListRow로 나열하고, 안심 문구 한 줄 + 단일 CTA "다음" →
 * /onboarding/result-intro. 저장하는 것 없음.
 *
 * 토스 톤(데스크톱 WEB): AppShell 좁은 컬럼(640), 흰 카드 위 정적 리스트(탭 불가
 * → hideChevron), 단일 브랜드 액센트.
 */

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { HeartPulse, Coffee, Users, ShieldCheck } from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { InfoBanner } from "../../components/ui/InfoBanner";
import { ListRow } from "../../components/ui/ListRow";

const ITEMS: ReadonlyArray<{
  icon: typeof HeartPulse;
  title: string;
  subtitle: string;
}> = [
  {
    icon: HeartPulse,
    title: "건강 정보",
    subtitle: "키·체중, 혈압·혈당, 만성질환 등",
  },
  {
    icon: Coffee,
    title: "생활습관",
    subtitle: "운동·식습관·흡연·음주·수면",
  },
  {
    icon: Users,
    title: "가족력",
    subtitle: "암·심혈관·당뇨 등 가족 병력",
  },
  {
    icon: ShieldCheck,
    title: "보험 가입 현황",
    subtitle: "실손·암·입원·수술 등 보장 내용",
  },
];

export function OnboardingCollect() {
  const navigate = useNavigate();

  return (
    <AppShell brandTo="/onboarding" backTo="/onboarding" maxWidth={640}>
      <div className="flex flex-col">
        <div className="pt-2">
          <span className="text-[14px] font-semibold text-brand-500">
            입력 안내
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="mt-1.5 text-[28px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[34px]"
          >
            이런 정보를 여쭤볼게요
          </motion.h1>
          <p className="mt-2 text-[16px] leading-relaxed text-neutral-500 lg:text-[17px]">
            정확한 진단을 위해 4가지를 입력받아요. 모르는 항목은 건너뛰어도 괜찮아요.
          </p>
        </div>

        {/* Info list */}
        <div className="mt-8 rounded-3xl bg-white px-3 py-2 shadow-card">
          <ul className="flex flex-col">
            {ITEMS.map((item, i) => (
              <li key={item.title}>
                {i > 0 && <div className="mx-4 h-px bg-neutral-100" />}
                <ListRow
                  hideChevron
                  title={item.title}
                  subtitle={item.subtitle}
                  leading={
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                      <item.icon className="size-5" strokeWidth={2} aria-hidden />
                    </span>
                  }
                  meta={
                    <span className="flex size-6 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-bold text-neutral-400 tabular-nums">
                      {i + 1}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Reassurance */}
        <InfoBanner tone="info" className="mt-5">
          입력한 정보는 분석에만 쓰이고, 이 브라우저에 안전하게 보관돼요.
        </InfoBanner>

        {/* CTA */}
        <div className="mt-10">
          <Button
            type="button"
            variant="default"
            fullWidth
            onClick={() => navigate("/onboarding/result-intro")}
          >
            다음
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default OnboardingCollect;
