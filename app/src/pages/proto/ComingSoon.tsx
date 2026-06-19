/**
 * PROTOTYPE — generic placeholder for a not-yet-built screen. Renders inside
 * the web `AppShell` so the migration skeleton is fully navigable (every
 * screen has a resolvable URL) before the real screens land. Reads the screen
 * slug from the route and shows its title, PDF reference, and prev/next walk.
 */

import { Link, useParams } from "react-router-dom";

import { AppShell } from "../../components/layout/AppShell";
import { ALL_SCREENS } from "./screens";

export function ComingSoon() {
  const { slug } = useParams<{ slug: string }>();
  const idx = ALL_SCREENS.findIndex((s) => s.slug === slug);
  const screen = idx >= 0 ? ALL_SCREENS[idx] : undefined;
  const prev = idx > 0 ? ALL_SCREENS[idx - 1] : undefined;
  const next = idx >= 0 && idx < ALL_SCREENS.length - 1 ? ALL_SCREENS[idx + 1] : undefined;

  return (
    <AppShell brandTo="/proto" backTo="/proto" title={screen?.title}>
      <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>

        {screen && (
          <span className="mt-6 text-sm font-semibold text-brand-500">
            화면 {screen.pdf} · {screen.route}
          </span>
        )}
        <h1 className="mt-2 text-[28px] font-bold tracking-tight text-neutral-900">
          {screen?.title ?? "알 수 없는 화면"}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
          이 화면은 마이그레이션 계획에 포함돼 있고, 곧 토스 스타일 웹 레이아웃으로
          제작됩니다. 전체 플로우와 라우팅을 미리 확인하기 위한 자리표시예요.
        </p>

        <div className="mt-10 flex w-full items-center justify-between gap-3">
          {prev ? (
            <Link
              to={`/proto/${prev.slug}`}
              className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white px-4 py-3 text-left shadow-card transition-shadow hover:shadow-card-hover"
            >
              <span className="text-[12px] font-medium text-neutral-400">이전</span>
              <span className="truncate text-[14px] font-semibold text-neutral-800">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              to={`/proto/${next.slug}`}
              className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white px-4 py-3 text-right shadow-card transition-shadow hover:shadow-card-hover"
            >
              <span className="text-[12px] font-medium text-neutral-400">다음</span>
              <span className="truncate text-[14px] font-semibold text-neutral-800">
                {next.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default ComingSoon;
