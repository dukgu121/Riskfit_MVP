/**
 * PROTOTYPE — `/proto` preview hub. A clickable map of all 29 migration
 * screens grouped by flow, so the whole desktop-web migration can be reviewed
 * without auth or walking the wizard. Every tile links to `/proto/<slug>`,
 * which seeds sample data and renders the REAL page component ungated. The
 * "완료" badge marks screens whose final Toss layout has shipped.
 */

import { Link } from "react-router-dom";

import { AppShell } from "../../components/layout/AppShell";
import { ALL_SCREENS, SCREEN_GROUPS } from "./screens";

const DONE = ALL_SCREENS.filter((s) => s.done).length;

/**
 * Preview link for a screen. Param screens (보험 세부 / 영역별 상세) route through
 * dedicated `/proto/insurance/:coverageType` and `/proto/detail/:area` paths so
 * `useParams` resolves; everything else uses `/proto/:slug`.
 */
function previewHref(route: string, slug: string): string {
  if (route.startsWith("/input/insurance/")) {
    return `/proto/insurance/${route.split("/").pop()}`;
  }
  if (route.startsWith("/result/detail/")) {
    return `/proto/detail/${route.split("/").pop()}`;
  }
  return `/proto/${slug}`;
}

export function ProtoHub() {
  return (
    <AppShell brandTo="/proto">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-brand-500">UI/UX 마이그레이션 · 프리뷰</span>
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[40px]">
          전체 화면 미리보기
        </h1>
        <p className="mt-2 text-[16px] leading-relaxed text-neutral-500">
          PDF 레퍼런스 29개 화면을 토스 스타일 <strong className="font-semibold text-neutral-700">데스크톱 웹</strong>
          {" "}레이아웃으로 옮기는 중이에요. 아래에서 각 화면을 눌러 플로우와 라우팅을 확인할 수 있어요.
          현재 <strong className="font-semibold text-brand-500">{DONE}개</strong> 실제 제작 · 나머지는 자리표시.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-9">
        {SCREEN_GROUPS.map((group) => (
          <section key={group.group}>
            <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-wide text-neutral-400">
              {group.group}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.screens.map((s) => (
                <Link
                  key={s.slug}
                  to={previewHref(s.route, s.slug)}
                  className="group flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[13px] font-bold text-neutral-500 tabular-nums">
                    {s.pdf}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-neutral-900">
                      {s.title}
                    </span>
                    <span className="block truncate text-[12px] text-neutral-400">{s.route}</span>
                  </span>
                  {s.done ? (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">
                      완료
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
                      기본
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

export default ProtoHub;
