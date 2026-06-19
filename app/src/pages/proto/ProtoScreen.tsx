/**
 * `ProtoScreen` — the ungated `/proto/:slug` preview renderer for PARAMLESS
 * screens.
 *
 * Input-side screens (온보딩 + 입력 위저드) render their TRUE production state:
 * empty fields with transparent example placeholders — so we CLEAR the sample
 * slices before rendering them. Result-side screens (분석/결과/개선/리포트/Premium)
 * need computed data, so we SEED the sample (profile + insurances + analysis
 * cache) for those.
 *
 * The seed/clear runs in a `useState` lazy initializer inside `SeededScreen`,
 * which is keyed by slug so it REMOUNTS (and re-runs) on every navigation —
 * synchronously, before the real screen reads localStorage.
 *
 * Param screens (보험 세부 `:coverageType`, 영역별 상세 `:area`) are served by their
 * own real routes (ProtoParam.tsx) — never here — so we never nest a <Router>.
 */

import { Suspense, useState } from "react";
import { useParams } from "react-router-dom";

import { ComingSoon } from "./ComingSoon";
import { PROTO_COMPONENTS } from "./protoMap";
import { clearPreviewInputs, seedPreview } from "../../lib/preview/sampleData";

/** Onboarding + input wizard slugs render empty (production state). */
function isInputSide(slug: string): boolean {
  return slug.startsWith("onboarding") || slug.startsWith("input");
}

export function ProtoScreen() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !(slug in PROTO_COMPONENTS)) {
    return <ComingSoon />;
  }

  return <SeededScreen key={slug} slug={slug} />;
}

function SeededScreen({ slug }: { slug: string }) {
  // Runs once per mount; the `key={slug}` on this component remounts it per
  // navigation, so the right setup runs synchronously before the screen reads
  // storage.
  useState(() => {
    if (isInputSide(slug)) {
      clearPreviewInputs();
    } else {
      seedPreview();
    }
    return true;
  });

  const Real = PROTO_COMPONENTS[slug];

  return (
    <Suspense fallback={null}>
      <Real />
    </Suspense>
  );
}

export default ProtoScreen;
