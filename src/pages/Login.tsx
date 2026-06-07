import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import {
  Info,
  Loader2,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../lib/firebase/authContext";

export function Login() {
  const { user, loading, configured, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(
    null,
  );
  const from = getRedirectPath(location.state);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      setError({ message: friendlyAuthMessage(code), code });
      if (import.meta.env.DEV) console.error("[auth] sign-in failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col overflow-hidden bg-white px-6 antialiased"
      aria-labelledby="login-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[18%] size-72 -translate-x-1/2 rounded-full bg-brand-100/55 blur-3xl"
      />

      <header className="relative pt-14">
        <span className="text-[13px] font-semibold tracking-tight text-neutral-500">
          RiskFit
        </span>
      </header>

      <motion.section
        variants={CONTAINER}
        initial="hidden"
        animate="show"
        className="relative flex flex-1 flex-col items-center justify-center text-center"
      >
        <motion.div variants={ITEM}>
          <BrandMark />
        </motion.div>

        <motion.h1
          variants={ITEM}
          id="login-heading"
          className="mt-7 text-[28px] font-bold leading-tight tracking-tight text-neutral-900"
        >
          보험, 충분한가요.
        </motion.h1>

        <motion.p
          variants={ITEM}
          className="mt-3 text-[15px] leading-relaxed text-neutral-600"
        >
          내 보장 상태를 한눈에 진단해 드려요.
        </motion.p>

        <motion.div variants={ITEM} className="w-full">
          <BenefitList />
        </motion.div>

        <motion.div variants={ITEM} className="mt-8 w-full">
          {error ? (
            <ErrorAlert message={error.message} code={error.code} />
          ) : null}

          <GoogleSignInButton
            onClick={handleSignIn}
            disabled={busy || loading || !configured}
            busy={busy}
          />

          <p className="mt-3 text-xs font-medium text-neutral-400">
            {configured
              ? "Google 계정으로만 로그인할 수 있어요."
              : "로그인 설정이 준비되면 이용할 수 있어요."}
          </p>
        </motion.div>
      </motion.section>

      <footer className="relative pb-9 pt-10 text-center">
        <p className="text-[11px] font-medium text-neutral-400">
          본 결과는 참고용입니다.
        </p>
        <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-neutral-400">
          금융인공지능실무 학부 프로젝트 · 이준호 · 엄덕현 · 소위륜
        </p>
      </footer>
    </main>
  );
}

const CONTAINER: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
  },
};

function BrandMark() {
  return (
    <div className="flex size-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[var(--shadow-cta)]">
      <ShieldCheck className="size-8" strokeWidth={2.2} aria-hidden />
    </div>
  );
}

function BenefitList() {
  return (
    <ul className="mx-auto mt-9 w-full max-w-[360px] space-y-1 rounded-2xl bg-neutral-50 p-3 text-left">
      <BenefitRow
        icon={<Lock className="size-4" aria-hidden />}
        text="입력한 정보를 안전하게 저장해요"
      />
      <BenefitRow
        icon={<MonitorSmartphone className="size-4" aria-hidden />}
        text="다른 기기에서도 이어서 볼 수 있어요"
      />
    </ul>
  );
}

function BenefitRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-xs">
        {icon}
      </span>
      <span className="text-sm font-medium text-neutral-700">{text}</span>
    </li>
  );
}

function ErrorAlert({ message, code }: { message: string; code?: string }) {
  return (
    <div
      role="alert"
      className="mb-3 flex items-start gap-2 rounded-xl bg-danger-50 px-4 py-3 text-left text-[13px] font-medium text-danger-600"
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {message}
        {code ? (
          <span className="mt-1 block font-mono text-[11px] font-normal text-danger-400">
            {code}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function GoogleSignInButton({
  onClick,
  disabled,
  busy,
}: {
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Google 계정으로 로그인"
      className={[
        "inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl",
        "border-[1.5px] border-neutral-200 bg-white px-6",
        "text-[15px] font-semibold text-neutral-900 select-none",
        "shadow-xs transition-[background-color,border-color,box-shadow,transform]",
        "duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-card",
        "active:scale-[0.98] active:bg-neutral-100",
        "focus:outline-none focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        "disabled:pointer-events-none disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:shadow-none",
      ].join(" ")}
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin text-neutral-400" aria-hidden />
      ) : (
        <GoogleLogo />
      )}
      {busy ? "로그인 중…" : "Google 계정으로 로그인"}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
      />
    </svg>
  );
}

function friendlyAuthMessage(code: string | undefined): string {
  switch (code) {
    case "auth/configuration-not-found":
    case "auth/operation-not-allowed":
      return "Google 로그인이 아직 켜져 있지 않아요. Firebase 콘솔 → Authentication에서 Google 로그인을 사용 설정해 주세요.";
    case "auth/unauthorized-domain":
      return "현재 접속 주소가 허용 목록에 없어요. Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 추가해 주세요.";
    case "auth/popup-blocked":
      return "브라우저가 로그인 팝업을 막았어요. 팝업을 허용한 뒤 다시 시도해 주세요.";
    case "auth/network-request-failed":
      return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
    default:
      return "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.";
  }
}

function getRedirectPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from !== "string") return "/";
  if (!from.startsWith("/") || from.startsWith("//")) return "/";
  if (
    from === "/login" ||
    from.startsWith("/login?") ||
    from.startsWith("/login#")
  ) {
    return "/";
  }
  return from;
}

export default Login;
