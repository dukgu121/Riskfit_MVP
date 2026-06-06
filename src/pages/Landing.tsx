import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { LoginButton } from "../components/auth/LoginButton";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { cn } from "../lib/cn";
import { useConsent } from "../lib/useConsent";

/**
 * Landing — RiskFit 진입 화면.
 *
 * 토스(viva republica) 단일 화면 미감.
 *   · 480px 단일 컬럼, 한 화면-한 결정 원칙.
 *   · 워드마크 → 한 줄 정보 → 한 줄 설명 → 동의 → CTA → 면책.
 *   · 마운트 시 fadeIn 320ms 한 번. 그 외 모션 없음.
 *
 * 다른 라우트 진입은 `ConsentGate`가 막으므로 이 화면의 책임은
 *   1. 동의 한 번 받기
 *   2. `/input/basic`으로 보내기
 * 두 가지뿐이다.
 */
export function Landing() {
  const navigate = useNavigate();
  const { consent, setConsent } = useConsent();

  const handleStart = () => {
    if (!consent) return;
    navigate("/input/basic");
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-white px-6 antialiased"
      aria-labelledby="landing-heading"
    >
      <header className="flex items-center justify-between pt-16">
        <Wordmark />
        <LoginButton />
      </header>
      <HeadlineBlock />
      <ConsentCard consent={consent} onConsentChange={setConsent} />
      <CtaBlock consent={consent} onStart={handleStart} />
      <FooterCredit />
    </motion.main>
  );
}

/* ----------------------------------------------------------- Wordmark */

/**
 * 상단의 작은 워드마크.
 *
 * 토스 가이드 §9.1 — 한 화면에는 하나의 `<h1>`만 둔다.
 * 따라서 브랜드명은 캡션 사이즈(13px)로 죽이고
 * 본문 헤드라인이 시각 무게의 주인공이 되게 한다.
 */
function Wordmark() {
  return (
    <div>
      <span
        role="text"
        className="text-[13px] font-semibold tracking-tight text-neutral-500"
      >
        RiskFit
      </span>
    </div>
  );
}

/* ---------------------------------------------------------- Headline */

/**
 * 본문 헤드라인.
 *
 *   "보험, 충분한가요." — 질문 1개. 마케팅 카피 없음.
 *
 * 토스 §9.1 — 한 화면-한 결정. 헤드라인 한 줄로 충분하다.
 * 타이포: 32px (text-3xl) bold, 한국어용 -0.02em letter-spacing.
 */
function HeadlineBlock() {
  return (
    <section className="mt-12">
      <h1
        id="landing-heading"
        className="text-3xl font-bold leading-tight tracking-tight text-neutral-900"
      >
        보험, 충분한가요.
      </h1>
    </section>
  );
}

/* ------------------------------------------------------ Consent card */

interface ConsentCardProps {
  /** 현재 동의 상태. true면 카드 테두리가 brand-500으로 강조된다. */
  consent: boolean;
  /** 체크박스 토글 시 호출. localStorage까지 즉시 반영된다. */
  onConsentChange: (next: boolean) => void;
}

/**
 * 데이터 처리 동의 카드.
 *
 * RiskFit은 입력 정보를 먼저 브라우저에 저장한다. Google 로그인과 동의가
 * 있으면 Firebase에 미러링되어 다른 기기에서도 다시 불러올 수 있다.
 *
 * 의도적으로 그림자(shadow) 없이 1px border만 사용. 시각 잡음 최소화.
 */
function ConsentCard({ consent, onConsentChange }: ConsentCardProps) {
  return (
    <section className="mt-16">
      <label
        htmlFor="riskfit-consent"
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-5",
          "transition-colors duration-150",
          consent
            ? "border-brand-500"
            : "border-neutral-200 hover:border-neutral-300",
        )}
      >
        <Checkbox
          id="riskfit-consent"
          checked={consent}
          onCheckedChange={(value) => onConsentChange(value === true)}
          aria-label="데이터 저장 및 리포트 생성 동의"
          className="mt-1"
        />
        <span className="text-sm leading-relaxed text-neutral-700">
          로그인하면 입력 정보가 Firebase에 저장되어 다시 불러올 수 있어요.
        </span>
      </label>
    </section>
  );
}

/* ----------------------------------------------------------- CTA */

interface CtaBlockProps {
  /** 동의 상태. false면 버튼은 disabled + 그 위 helper text 노출. */
  consent: boolean;
  /** 동의된 상태에서만 호출된다(가드는 Landing 본체가 책임). */
  onStart: () => void;
}

/**
 * Primary CTA + 면책 한 줄.
 *
 *   · 버튼 단 1개("시작하기"). 토스 §9.1 한 화면-한 결정.
 *   · 동의 전: helper text "동의 후 시작할 수 있어요."를 위에 띄운다.
 *   · 면책: "본 결과는 참고용입니다." 한 줄. 더 길게 쓰지 않는다.
 *
 * size="default" → h-14 (56px) — 토스 표준 primary 버튼 높이.
 */
function CtaBlock({ consent, onStart }: CtaBlockProps) {
  return (
    <section className="mt-8">
      {!consent ? (
        <p className="mb-3 text-xs font-medium text-neutral-500">
          동의 후 시작할 수 있어요.
        </p>
      ) : null}
      <Button
        type="button"
        size="default"
        fullWidth
        disabled={!consent}
        onClick={onStart}
        aria-label="시작하기"
      >
        시작하기
      </Button>
      <p className="mt-4 text-[11px] font-medium text-neutral-500">
        본 결과는 참고용입니다.
      </p>
    </section>
  );
}

/* --------------------------------------------------------- Footer */

/**
 * 페이지 하단 크레딧.
 *
 * 학부 프로젝트라는 사실은 신뢰의 일부다 — 광고/사업체로 오해받지
 * 않도록 명시한다. 다만 시각 무게는 최소화(11px neutral-500).
 */
function FooterCredit() {
  return (
    <footer className="mt-auto pb-10 pt-16">
      <p className="text-[11px] font-medium leading-relaxed text-neutral-500">
        금융인공지능실무 학부 프로젝트 · 이준호 · 엄덕현 · 소위륜
      </p>
    </footer>
  );
}

export default Landing;
