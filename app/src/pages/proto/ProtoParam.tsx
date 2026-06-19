/**
 * `ProtoParam` — ungated preview renderers for the two PARAM screen families.
 *
 * These mount under REAL param routes so the screens read their params from the
 * browser location via `useParams` — no nested `<Router>` (which the app's data
 * router forbids):
 *   - `/proto/insurance/:coverageType` → ProtoInsurance → InsuranceSubScreen
 *   - `/proto/detail/:area`            → ProtoArea      → AreaDetail
 *
 * Each seeds the sample preview data once, then renders the real lazy component.
 */

import { lazy, Suspense, useState, type ReactNode } from "react";

import { clearPreviewInputs, seedPreview } from "../../lib/preview/sampleData";

const InsuranceSubScreen = lazy(async () => {
  const m = await import("../insurance/InsuranceSubScreen");
  return { default: m.InsuranceSubScreen };
});

const AreaDetail = lazy(async () => {
  const m = await import("../result/AreaDetail");
  return { default: m.AreaDetail };
});

/** `mode="input"` clears slices (empty production state); `"result"` seeds. */
function Setup({ mode, children }: { mode: "input" | "result"; children: ReactNode }) {
  useState(() => {
    if (mode === "input") clearPreviewInputs();
    else seedPreview();
    return true;
  });
  return <Suspense fallback={null}>{children}</Suspense>;
}

export function ProtoInsurance() {
  // 보험 세부 입력 — an INPUT screen: show it empty with placeholders.
  return (
    <Setup mode="input">
      <InsuranceSubScreen />
    </Setup>
  );
}

export function ProtoArea() {
  // 영역별 상세 — a RESULT screen: needs the seeded analysis.
  return (
    <Setup mode="result">
      <AreaDetail />
    </Setup>
  );
}

export default ProtoInsurance;
