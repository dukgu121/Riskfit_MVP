/**
 * Root layout for every route in RiskFit.
 *
 * Responsibilities:
 *   1. Gate the entire app behind a desktop-width check (`DesktopOnlyGate`).
 *   2. Render the active route inside `<AnimatePresence mode="wait">` so
 *      page enter/exit animations are coordinated per pathname.
 *   3. Provide a minimal, Toss-style footer disclaimer on every route *except*
 *      the login and landing pages, which render their own bespoke footers.
 *
 * The layout itself does not impose any horizontal max-width — individual
 * pages own their own container so they can pick how wide / narrow they
 * want to feel.
 */

import { AnimatePresence } from "motion/react";
import { Outlet, useLocation } from "react-router-dom";

import { DesktopOnlyGate } from "./DesktopOnlyGate";
import { PageTransition } from "./PageTransition";

export function AppLayout() {
  const location = useLocation();
  // 랜딩("/")과 로그인("/login")은 각자의 전용 푸터를 렌더링한다.
  const hasBespokeFooter =
    location.pathname === "/" || location.pathname === "/login";

  return (
    <DesktopOnlyGate>
      <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 antialiased">
        <main className="flex-1 flex flex-col w-full">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition routeKey={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>

        {!hasBespokeFooter && (
          <footer className="shrink-0 border-t border-neutral-200 bg-white">
            <div className="mx-auto w-full max-w-[1080px] px-6 py-5 text-xs leading-relaxed text-neutral-500 lg:px-8">
              이 결과는 참고만 해주세요. 로그인하면 입력 정보는 Firebase에
              저장될 수 있고, 리포트 생성에 필요한 정보는 시연용 서버로 전달될 수 있어요.
            </div>
          </footer>
        )}
      </div>
    </DesktopOnlyGate>
  );
}

export default AppLayout;
