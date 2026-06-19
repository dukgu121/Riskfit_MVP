/**
 * p1 「온보딩 — 시작 화면」 (/onboarding)
 *
 * 진입 화면. 브랜드 2-line 히어로 + 이 앱이 무엇을 해주는지 4가지 포인트 +
 * 단일 CTA "시작하기" → /onboarding/info.
 *
 * 토스 톤(데스크톱 WEB): AppShell 안의 좁은 단일 컬럼(maxWidth≈640), 큰 헤드라인
 * 하나, 단일 브랜드 액센트, 면책 한 줄. 입력은 저장하지 않고, setOnboardingSeen()으로
 * "본 적 있음" 플래그만 기록한다(재방문 스킵 후크용).
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Activity, FileText, ShieldCheck, Sparkles } from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/button";
import { setOnboardingSeen } from "../../lib/draft";

const POINTS: ReadonlyArray<{
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
}> = [
  {
    icon: ShieldCheck,
    title: "보장이 충분한지 한눈에",
    desc: "지금 가입한 보험이 나에게 맞는지 적합도로 보여드려요.",
  },
  {
    icon: Activity,
    title: "비어 있는 보장 찾기",
    desc: "부족하거나 빠진 보장을 영역별로 콕 집어드려요.",
  },
  {
    icon: Sparkles,
    title: "어떻게 채울지 제안",
    desc: "무엇을 먼저 보완하면 좋을지 우선순위로 알려드려요.",
  },
  {
    icon: FileText,
    title: "내 보장 리포트",
    desc: "분석 결과를 한 장으로 정리해 언제든 다시 볼 수 있어요.",
  },
];

export function OnboardingStart() {
  const navigate = useNavigate();

  // 재방문 스킵 후크가 참조하는 "온보딩 본 적 있음" 플래그. 화면 진입 시 기록.
  useEffect(() => {
    setOnboardingSeen();
  }, []);

  return (
    <AppShell brandTo="/onboarding" maxWidth={640}>
      <div className="flex flex-col">
        {/* Hero */}
        <div className="pt-2">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-600"
          >
            보험 보장 적합도 진단
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-[34px] font-bold leading-[1.18] tracking-tight text-neutral-900 lg:text-[44px]"
          >
            내 보험,
            <br />
            충분한지 알려드릴게요
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 text-[16px] leading-relaxed text-neutral-500 lg:text-[18px]"
          >
            몇 가지 정보만 입력하면 보장이 잘 맞는지, 어디가 비어 있는지
            정리해 드려요. 약 3분이면 충분해요.
          </motion.p>
        </div>

        {/* Feature points */}
        <ul className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {POINTS.map((p, i) => (
            <motion.li
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.36,
                delay: 0.12 + i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-start gap-3.5 rounded-3xl bg-white px-5 py-5 shadow-card"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                <p.icon className="size-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-neutral-900">
                  {p.title}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-neutral-500">
                  {p.desc}
                </span>
              </span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-10">
          <Button
            type="button"
            variant="default"
            fullWidth
            onClick={() => navigate("/onboarding/info")}
          >
            시작하기
          </Button>
          <p className="mt-4 text-center text-[12px] leading-relaxed text-neutral-400">
            본 결과는 입력 정보를 바탕으로 한 참고용 분석이에요.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default OnboardingStart;
