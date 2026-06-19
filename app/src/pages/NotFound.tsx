/**
 * 404 fallback. The router wildcard-matches "*" to this page; it renders inside
 * the shared web `AppShell` so the header/wordmark stay consistent with every
 * other screen (no bare phone-width column).
 */

import { Link } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/button";

export function NotFound() {
  return (
    <AppShell brandTo="/onboarding">
      <div
        aria-labelledby="notfound-heading"
        className="mx-auto flex max-w-xl flex-col items-center py-16 text-center"
      >
        <p className="text-sm font-semibold tracking-wider text-brand-600">
          404
        </p>
        <h1
          id="notfound-heading"
          className="mt-2 text-[28px] font-bold tracking-tight text-neutral-900 lg:text-[32px]"
        >
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
          주소가 잘못 입력되었거나 더 이상 존재하지 않는 페이지예요. 처음
          화면으로 돌아가 다시 진단을 시작해 주세요.
        </p>
        <Button asChild className="mt-9 px-7">
          <Link to="/onboarding" aria-label="처음 화면으로 돌아가기">
            처음으로
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}

export default NotFound;
