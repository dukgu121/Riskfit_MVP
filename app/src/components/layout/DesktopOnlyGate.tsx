/**
 * Show a polite fallback when the viewport is narrower than the desktop
 * breakpoint (1024px). RiskFit is intentionally a PC-first experience —
 * the dense data inputs and side-by-side charts don't degrade well to
 * narrow widths, so we'd rather invite the user to switch devices than
 * ship a half-broken responsive layout.
 *
 * Implementation notes
 *   - Uses `window.matchMedia` (single, cheap listener) over ResizeObserver
 *     to avoid layout-thrash on every pixel of resize.
 *   - SSR / pre-hydration safe: the initial state is `true` (desktop) so
 *     server-rendered markup matches the most common case.
 */

import { useSyncExternalStore } from "react";
import { MonitorSmartphone } from "lucide-react";

const DESKTOP_QUERY = "(min-width: 1024px)";

function getDesktopSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function subscribeToDesktopChanges(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(DESKTOP_QUERY);
  const handleChange = () => onStoreChange();
  mql.addEventListener("change", handleChange);
  return () => mql.removeEventListener("change", handleChange);
}

export interface DesktopOnlyGateProps {
  children: React.ReactNode;
}

export function DesktopOnlyGate({ children }: DesktopOnlyGateProps) {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopChanges,
    getDesktopSnapshot,
    () => true,
  );

  if (isDesktop) {
    return <>{children}</>;
  }

  return (
    <main
      role="alert"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center bg-neutral-50 px-6 py-12"
    >
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        <div
          aria-hidden
          className="size-20 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center"
        >
          <MonitorSmartphone className="size-10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            PC에서 이용해 주세요
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed">
            RiskFit은 데스크탑 화면에 최적화되어 있어요.
            <br />
            PC에서 접속하시면 더 정확한 진단 결과를
            <br />
            보실 수 있어요.
          </p>
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          최소 권장 해상도 1024px 이상
        </p>
      </div>
    </main>
  );
}
