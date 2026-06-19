/**
 * RiskFit router configuration (full migration route map — MIGRATION_PLAN §2).
 *
 * Architecture
 *   - A single top-level `<AppLayout/>` route hosts the desktop-only gate,
 *     page-transition animations and the always-visible footer.
 *   - Page components are loaded via React Router 7's `lazy` field so the
 *     initial bundle stays lean.
 *   - `/login` is the only public route. `/onboarding/*` requires auth only
 *     (consent is CAPTURED on onboarding-3). Everything from `/input/basic`
 *     onward requires auth + consent; the Premium loop additionally requires
 *     the (demo) premium flag.
 *   - `/` redirects to `/onboarding` (the retired Landing is no longer routed).
 *   - The ungated `/proto` surface lets the whole migration be reviewed without
 *     login: `/proto/:slug` seeds sample data and renders the REAL page.
 *   - Unknown paths fall through a `*` route to the same `<NotFound/>` UI.
 *
 * Note on lazy + named exports
 *   Our page modules export `InputBasic`, `ResultSummary`, … (named exports),
 *   so we adapt each dynamic import to the `{ Component }` shape that React
 *   Router expects from a `lazy` factory.
 */

import type { ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import { AppLayout } from "./components/layout/AppLayout";
import { AuthGate } from "./components/layout/AuthGate";
import { ConsentGate } from "./components/layout/ConsentGate";
import { PremiumGate } from "./components/layout/PremiumGate";
import { NotFound } from "./pages/NotFound";

/**
 * Module shape: a dynamic import whose named export `K` is a React component.
 * We deliberately keep the prop type opaque (`AnyPage = ComponentType<…>`)
 * here because each page module owns its own prop contract — the router
 * never passes additional props, it just renders `<Page />`.
 */
type AnyPage = ComponentType<Record<string, never>>;
type LazyPageModule<K extends string> = Record<K, AnyPage>;

/** Helper: turn a `() => import("./pages/X")` into a `lazy` factory. */
function lazyNamed<K extends string>(
  loader: () => Promise<LazyPageModule<K>>,
  exportName: K,
) {
  return async () => {
    const mod = await loader();
    return { Component: mod[exportName] };
  };
}

/** Wrap a `lazy` factory in `<AuthGate>` (login required, no consent yet). */
function authedLazy<K extends string>(
  loader: () => Promise<LazyPageModule<K>>,
  exportName: K,
) {
  return async () => {
    const mod = await loader();
    const Page: AnyPage = mod[exportName];
    const Wrapped: AnyPage = function AuthedPage() {
      return (
        <AuthGate>
          <Page />
        </AuthGate>
      );
    };
    Wrapped.displayName = `Authed(${exportName})`;
    return { Component: Wrapped };
  };
}

/**
 * Wrap a `lazy` factory in `<AuthGate>` + `<ConsentGate>` while preserving
 * code-splitting. Login is required first; consent is the second gate. A
 * logged-out user bounces to `/login`, a logged-in-but-unconsented user to
 * `/onboarding`.
 */
function gatedLazy<K extends string>(
  loader: () => Promise<LazyPageModule<K>>,
  exportName: K,
) {
  return async () => {
    const mod = await loader();
    const Page: AnyPage = mod[exportName];
    const Wrapped: AnyPage = function GatedPage() {
      return (
        <AuthGate>
          <ConsentGate>
            <Page />
          </ConsentGate>
        </AuthGate>
      );
    };
    Wrapped.displayName = `Gated(${exportName})`;
    return { Component: Wrapped };
  };
}

/**
 * Wrap a `lazy` factory in `<AuthGate>` + `<ConsentGate>` + `<PremiumGate>`.
 * The Premium loop (p28–p29) sits behind the demo paywall; a non-subscriber
 * bounces to `/premium`.
 */
function premiumGatedLazy<K extends string>(
  loader: () => Promise<LazyPageModule<K>>,
  exportName: K,
) {
  return async () => {
    const mod = await loader();
    const Page: AnyPage = mod[exportName];
    const Wrapped: AnyPage = function PremiumGatedPage() {
      return (
        <AuthGate>
          <ConsentGate>
            <PremiumGate>
              <Page />
            </PremiumGate>
          </ConsentGate>
        </AuthGate>
      );
    };
    Wrapped.displayName = `PremiumGated(${exportName})`;
    return { Component: Wrapped };
  };
}

const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        // 시작 화면 — Google 로그인. 유일하게 인증 게이트가 없는 라우트.
        path: "/login",
        lazy: lazyNamed(() => import("./pages/Login"), "Login"),
      },

      /* ---------------- "/" → 온보딩 (Landing 폐기) ---------------- */
      {
        path: "/",
        element: <Navigate to="/onboarding" replace />,
      },

      /* ---------------- 온보딩 (auth-only; 동의는 여기서 캡처) ---------------- */
      {
        path: "/onboarding",
        lazy: authedLazy(
          () => import("./pages/onboarding/OnboardingStart"),
          "OnboardingStart",
        ),
      },
      {
        path: "/onboarding/info",
        lazy: authedLazy(
          () => import("./pages/onboarding/OnboardingCollect"),
          "OnboardingCollect",
        ),
      },
      {
        path: "/onboarding/result-intro",
        lazy: authedLazy(
          () => import("./pages/onboarding/OnboardingResultIntro"),
          "OnboardingResultIntro",
        ),
      },

      /* ---------------- 입력 위저드 (auth + consent) ---------------- */
      {
        path: "/input/basic",
        lazy: gatedLazy(() => import("./pages/InputBasic"), "InputBasic"),
      },
      {
        path: "/input/health",
        lazy: gatedLazy(() => import("./pages/InputHealth"), "InputHealth"),
      },
      {
        path: "/input/lifestyle",
        lazy: gatedLazy(
          () => import("./pages/InputLifestyle"),
          "InputLifestyle",
        ),
      },
      {
        path: "/input/family",
        lazy: gatedLazy(() => import("./pages/InputFamily"), "InputFamily"),
      },
      {
        path: "/input/insurance",
        lazy: gatedLazy(
          () => import("./pages/InputInsurance"),
          "InputInsurance",
        ),
      },
      {
        path: "/input/insurance/:coverageType",
        lazy: gatedLazy(
          () => import("./pages/insurance/InsuranceSubScreen"),
          "InsuranceSubScreen",
        ),
      },

      /* ---------------- 분석 + 결과 (auth + consent) ---------------- */
      {
        path: "/analyzing",
        lazy: gatedLazy(() => import("./pages/Analyzing"), "Analyzing"),
      },
      {
        path: "/result",
        lazy: gatedLazy(
          () => import("./pages/result/ResultSummary"),
          "ResultSummary",
        ),
      },
      {
        path: "/result/detail",
        lazy: gatedLazy(
          () => import("./pages/result/RiskDetail"),
          "RiskDetail",
        ),
      },
      {
        path: "/result/detail/:area",
        lazy: gatedLazy(
          () => import("./pages/result/AreaDetail"),
          "AreaDetail",
        ),
      },

      /* ---------------- 개선 + 리포트 (auth + consent) ---------------- */
      {
        path: "/improve",
        lazy: gatedLazy(() => import("./pages/improve/Improve"), "Improve"),
      },
      {
        path: "/improve/plan",
        lazy: gatedLazy(
          () => import("./pages/improve/ImprovePlan"),
          "ImprovePlan",
        ),
      },
      {
        path: "/improve/preview",
        lazy: gatedLazy(
          () => import("./pages/improve/ImprovePreview"),
          "ImprovePreview",
        ),
      },
      {
        path: "/report",
        lazy: gatedLazy(() => import("./pages/report/Report"), "Report"),
      },

      /* ---------------- Premium 루프 (auth + consent + premium) ---------------- */
      {
        // 구독 paywall 자체는 premium 게이트 없이(미구독자가 봐야 함).
        path: "/premium",
        lazy: gatedLazy(() => import("./pages/premium/Premium"), "Premium"),
      },
      {
        path: "/premium/lifecycle",
        lazy: premiumGatedLazy(
          () => import("./pages/premium/PremiumLifecycle"),
          "PremiumLifecycle",
        ),
      },
      {
        path: "/premium/report",
        lazy: premiumGatedLazy(
          () => import("./pages/premium/PremiumReport"),
          "PremiumReport",
        ),
      },

      /* ---------------- PROTOTYPE preview (ungated) ----------------
       * Lets the whole desktop-web migration (all 29 screens) be reviewed
       * without logging in or walking the wizard. Remove before ship. */
      {
        path: "/proto",
        lazy: lazyNamed(() => import("./pages/proto/ProtoHub"), "ProtoHub"),
      },
      {
        // Legacy direct link to the hand-authored gold reference.
        path: "/proto/result",
        lazy: lazyNamed(
          () => import("./pages/proto/ProtoResultSummary"),
          "ProtoResultSummary",
        ),
      },
      {
        // Param screens get REAL `/proto` param routes so `useParams` resolves
        // without a nested router. (React Router forbids <Router> in <Router>.)
        path: "/proto/insurance/:coverageType",
        lazy: lazyNamed(
          () => import("./pages/proto/ProtoParam"),
          "ProtoInsurance",
        ),
      },
      {
        path: "/proto/detail/:area",
        lazy: lazyNamed(() => import("./pages/proto/ProtoParam"), "ProtoArea"),
      },
      {
        // Seeds sample data, then renders the REAL page component for the slug
        // (paramless screens only).
        path: "/proto/:slug",
        lazy: lazyNamed(
          () => import("./pages/proto/ProtoScreen"),
          "ProtoScreen",
        ),
      },

      {
        // 404 — keep inside AppLayout so the look stays consistent.
        path: "*",
        element: (
          <AuthGate>
            <NotFound />
          </AuthGate>
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
