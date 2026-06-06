/**
 * RiskFit router configuration.
 *
 * Architecture
 *   - A single top-level `<AppLayout/>` route hosts the desktop-only gate,
 *     page-transition animations and the always-visible footer.
 *   - Page components are loaded via React Router 7's `lazy` field so the
 *     initial bundle stays lean (the landing page is the only thing the
 *     user always hits — the rest is gated by consent anyway).
 *   - Every non-landing route is wrapped at element level by `<ConsentGate>`
 *     so a deep-linked user without `riskfit.consent` is bounced back to "/".
 *   - Unknown paths fall through a `*` route to the same `<NotFound/>` UI.
 *
 * Note on lazy + named exports
 *   Our page modules export `Landing`, `InputBasic`, … (named exports), so we
 *   adapt each dynamic import to the `{ Component }` shape that React Router
 *   expects from a `lazy` factory.
 */

import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import { AppLayout } from "./components/layout/AppLayout";
import { ConsentGate } from "./components/layout/ConsentGate";
import { NotFound } from "./pages/NotFound";

/**
 * Module shape: a dynamic import whose named export `K` is a React component.
 * We deliberately keep the prop type opaque (`AnyPage = ComponentType<any>`)
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

/** Wrap a `lazy` factory in `<ConsentGate>` while preserving code-splitting. */
function gatedLazy<K extends string>(
  loader: () => Promise<LazyPageModule<K>>,
  exportName: K,
) {
  return async () => {
    const mod = await loader();
    // Indexing `LazyPageModule<K>[K]` confuses TS' JSX prop inference; the
    // explicit assignment to `AnyPage` keeps the prop-type contract simple.
    const Page: AnyPage = mod[exportName];
    const Wrapped: AnyPage = function GatedPage() {
      return (
        <ConsentGate>
          <Page />
        </ConsentGate>
      );
    };
    Wrapped.displayName = `Gated(${exportName})`;
    return { Component: Wrapped };
  };
}

const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        lazy: lazyNamed(() => import("./pages/Landing"), "Landing"),
      },
      {
        path: "/input/basic",
        lazy: gatedLazy(() => import("./pages/InputBasic"), "InputBasic"),
      },
      {
        path: "/input/health",
        lazy: gatedLazy(
          () => import("./pages/InputHealthLifestyle"),
          "InputHealthLifestyle",
        ),
      },
      {
        path: "/input/family",
        lazy: gatedLazy(
          () => import("./pages/InputFamilyHistory"),
          "InputFamilyHistory",
        ),
      },
      {
        path: "/input/insurance",
        lazy: gatedLazy(
          () => import("./pages/InputInsurance"),
          "InputInsurance",
        ),
      },
      {
        path: "/analyzing",
        lazy: gatedLazy(() => import("./pages/Analyzing"), "Analyzing"),
      },
      {
        path: "/result",
        lazy: gatedLazy(() => import("./pages/Result"), "Result"),
      },
      {
        // 404 — keep inside AppLayout so the look stays consistent.
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
