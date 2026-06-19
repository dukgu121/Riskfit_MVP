/**
 * p3 「온보딩 — 제공 결과 안내 · 동의」 (/onboarding/result-intro)
 *
 * 진단을 마치면 무엇을 받게 되는지 5가지 결과를 보여 주고, 데이터 처리 동의를
 * 한 번 받는다. CTA "시작하기"는 동의 전 비활성. 동의 + CTA → setConsent(true)
 * 후 /input/basic 으로 이동(ConsentGate 통과).
 *
 * 동의 로직은 기존 Landing.tsx의 ConsentCard를 그대로 차용 — useConsent().setConsent.
 * 토스 톤(데스크톱 WEB): AppShell 좁은 컬럼(640), 결과 미리보기 리스트 + 강조되는
 * 동의 카드 + 단일 브랜드 CTA + 면책 한 줄.
 */

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Check,
  Gauge,
  LayoutList,
  ListChecks,
  FileText,
} from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { cn } from "../../lib/cn";
import { useConsent } from "../../lib/useConsent";

const OUTCOMES: ReadonlyArray<{
  icon: typeof Gauge;
  title: string;
  desc: string;
}> = [
  {
    icon: Gauge,
    title: "보장 적합도 점수",
    desc: "내 보장이 얼마나 충분한지 한 숫자로",
  },
  {
    icon: LayoutList,
    title: "영역별 보장 진단",
    desc: "실손·암·입원·수술 등 영역마다 충분/주의/부족",
  },
  {
    icon: ListChecks,
    title: "우선 점검 항목",
    desc: "공백이 큰 보장부터 무엇을 채울지",
  },
  {
    icon: Check,
    title: "위험 분석",
    desc: "건강·생활습관·가족력 기반 위험 요인",
  },
  {
    icon: FileText,
    title: "내 보장 리포트",
    desc: "결과를 한 장으로 정리해 다시 보기",
  },
];

export function OnboardingResultIntro() {
  const navigate = useNavigate();
  const { consent, setConsent } = useConsent();

  const handleStart = () => {
    if (!consent) {
      setConsent(true);
    }
    navigate("/input/basic");
  };

  return (
    <AppShell
      brandTo="/onboarding"
      backTo="/onboarding/info"
      maxWidth={640}
    >
      <div className="flex flex-col">
        <div className="pt-2">
          <span className="text-[14px] font-semibold text-brand-500">
            결과 미리 보기
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="mt-1.5 text-[28px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[34px]"
          >
            이런 결과를 받아요
          </motion.h1>
          <p className="mt-2 text-[16px] leading-relaxed text-neutral-500 lg:text-[17px]">
            입력을 마치면 아래 다섯 가지를 정리해 드려요.
          </p>
        </div>

        {/* Outcome list */}
        <ul className="mt-8 flex flex-col gap-2.5">
          {OUTCOMES.map((o, i) => (
            <motion.li
              key={o.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.32,
                delay: 0.06 + i * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-center gap-4 rounded-3xl bg-white px-5 py-4 shadow-card"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                <o.icon className="size-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-neutral-900">
                  {o.title}
                </span>
                <span className="mt-0.5 block text-[13px] text-neutral-500">
                  {o.desc}
                </span>
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Consent card (ported from Landing.tsx ConsentCard) */}
        <label
          htmlFor="riskfit-consent"
          className={cn(
            "mt-7 flex cursor-pointer items-start gap-3 rounded-3xl border bg-white p-5",
            "transition-colors duration-150",
            consent ? "border-brand-500" : "border-neutral-200 hover:border-neutral-300",
          )}
        >
          <Checkbox
            id="riskfit-consent"
            checked={consent}
            onCheckedChange={(value) => setConsent(value === true)}
            aria-label="데이터 분석 및 리포트 생성 동의"
            className="mt-0.5"
          />
          <span className="text-[14px] leading-relaxed text-neutral-700">
            내 보험·건강 정보를 분석해 맞춤 보장 진단을 받는 데 동의해요.
            <span className="mt-1 block text-[13px] text-neutral-400">
              정보는 이 브라우저에 저장되며, 로그인 시 안전하게 백업돼요.
            </span>
          </span>
        </label>

        {/* CTA */}
        <div className="mt-8">
          {!consent ? (
            <p className="mb-3 text-center text-[13px] font-medium text-neutral-400">
              동의 후 시작할 수 있어요.
            </p>
          ) : null}
          <Button
            type="button"
            variant="default"
            fullWidth
            disabled={!consent}
            onClick={handleStart}
          >
            시작하기
          </Button>
          <p className="mt-4 text-center text-[12px] leading-relaxed text-neutral-400">
            본 결과는 참고용이며, 의료·보험 가입을 대신하지 않아요.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default OnboardingResultIntro;
