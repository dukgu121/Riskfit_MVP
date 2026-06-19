/**
 * `AppShell` — the RiskFit web layout shell. RiskFit is a desktop web app, so
 * every screen sits inside this shell: a sticky top header with the wordmark +
 * optional title/back/right-action, and a centred max-width content container
 * that uses horizontal space rather than a narrow mobile column. White header on
 * a neutral-50 page, single brand accent.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../lib/cn";

export interface AppShellProps {
  /** Optional center title in the header (e.g. "분석 결과"). */
  title?: string;
  /** Optional right-aligned header action. */
  headerAction?: ReactNode;
  /** Optional back affordance: a target path renders a back chevron link. */
  backTo?: string;
  /** Content max width in px (default 1080). Wizards can pass a tighter value. */
  maxWidth?: number;
  /** Where the wordmark links (default "/onboarding", the in-flow home). */
  brandTo?: string;
  children: ReactNode;
}

export function AppShell({
  title,
  headerAction,
  backTo,
  maxWidth = 1080,
  brandTo = "/onboarding",
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div
          className="mx-auto flex h-16 w-full items-center gap-3 px-6 lg:px-8"
          style={{ maxWidth }}
        >
          {backTo && (
            <Link
              to={backTo}
              aria-label="뒤로"
              className="-ml-2 flex size-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
            >
              <ChevronLeft />
            </Link>
          )}

          <Link to={brandTo} className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-500 text-[15px] font-extrabold text-white">
              R
            </span>
            <span className="text-[17px] font-bold tracking-tight text-neutral-900">
              Risk<span className="text-brand-500">Fit</span>
            </span>
          </Link>

          {title && (
            <span className="ml-1 hidden text-sm font-medium text-neutral-400 sm:inline">
              {title}
            </span>
          )}

          <div className="ml-auto flex items-center">{headerAction}</div>
        </div>
      </header>

      <main className="flex-1">
        <div
          className={cn("mx-auto w-full px-6 py-10 lg:px-8 lg:py-14")}
          style={{ maxWidth }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default AppShell;
