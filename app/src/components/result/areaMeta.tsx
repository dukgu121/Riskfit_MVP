/* eslint-disable react-refresh/only-export-components --
   Metadata/icon-data module (labels, walk order, flat inline-SVG icons, helpers),
   not a hot-reloaded screen component — fast-refresh export purity doesn't apply. */
/**
 * `areaMeta.tsx` — shared presentation metadata for the 5 risk drill-down areas
 * (생활습관 / 건강 / 가족력 / 직업 / 재무). Keeps labels, route slugs, the frozen
 * prev/next walk order, flat token-tinted inline icons, and the band→colour
 * mapping in one place so p17 (overview tiles) and p18–p22 (area detail) stay
 * consistent.
 *
 * Lane D owns `components/result/*`. Flat inline SVG only (no external assets),
 * single-accent discipline — colour comes from the risk band, not the icon.
 *
 * Frozen drill-down order (MIGRATION_PLAN OD-1):
 *   17 overview → 18 lifestyle → 19 health → 20 family → 21 job → 22 financial
 *   → 26 report   (linear 이전/다음; 다음 from financial → /report)
 */

import type { ReactNode } from "react";

import type { AreaId } from "../../lib/calc/riskContributions";
import type { RiskBandId } from "../../types";

export interface AreaMeta {
  id: AreaId;
  label: string;
  /** Route path for this area's detail screen. */
  path: string;
  /** One-line "what this measures" caption. */
  caption: string;
  /** Flat inline icon (token-neutral; band colour lives elsewhere). */
  icon: ReactNode;
}

/* Frozen walk order. */
export const AREA_ORDER: AreaId[] = [
  "lifestyle",
  "health",
  "family",
  "job",
  "financial",
];

/* ------------------------------------------------------------------ */
/*  Flat inline icons (1.75 stroke, currentColor)                      */
/* ------------------------------------------------------------------ */

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONS: Record<AreaId, ReactNode> = {
  // 생활습관 — activity pulse
  lifestyle: (
    <Svg>
      <path d="M3 12h3l2 5 4-12 2 9 1.5-2H21" />
    </Svg>
  ),
  // 건강 — heart
  health: (
    <Svg>
      <path d="M19.5 12.6 12 20l-7.5-7.4a4.6 4.6 0 0 1 6.5-6.5l1 1 1-1a4.6 4.6 0 0 1 6.5 6.5Z" />
    </Svg>
  ),
  // 가족력 — people
  family: (
    <Svg>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 7.2a3 3 0 0 1 0 5.6" />
      <path d="M16.5 14.2A5.5 5.5 0 0 1 20.5 19" />
    </Svg>
  ),
  // 직업 — briefcase
  job: (
    <Svg>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </Svg>
  ),
  // 재무 — wallet
  financial: (
    <Svg>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a2 2 0 0 1 2 2v1" />
      <rect x="3" y="8" width="18" height="11" rx="2.5" />
      <path d="M16.5 13.5h.01M3 11.5h18" />
    </Svg>
  ),
};

const CAPTIONS: Record<AreaId, string> = {
  lifestyle: "흡연·음주·운동·수면 등",
  health: "BMI·검진·진료·가족력",
  family: "가족 병력 기반 위험",
  job: "직업 특성에 따른 위험",
  financial: "비상금·지출·보장 비중",
};

const LABELS: Record<AreaId, string> = {
  lifestyle: "생활습관",
  health: "건강",
  family: "가족력",
  job: "직업",
  financial: "재무",
};

export const AREA_META: Record<AreaId, AreaMeta> = {
  lifestyle: {
    id: "lifestyle",
    label: LABELS.lifestyle,
    path: "/result/detail/lifestyle",
    caption: CAPTIONS.lifestyle,
    icon: ICONS.lifestyle,
  },
  health: {
    id: "health",
    label: LABELS.health,
    path: "/result/detail/health",
    caption: CAPTIONS.health,
    icon: ICONS.health,
  },
  family: {
    id: "family",
    label: LABELS.family,
    path: "/result/detail/family",
    caption: CAPTIONS.family,
    icon: ICONS.family,
  },
  job: {
    id: "job",
    label: LABELS.job,
    path: "/result/detail/job",
    caption: CAPTIONS.job,
    icon: ICONS.job,
  },
  financial: {
    id: "financial",
    label: LABELS.financial,
    path: "/result/detail/financial",
    caption: CAPTIONS.financial,
    icon: ICONS.financial,
  },
};

/** Type-guard a route param into a known `AreaId`. */
export function isAreaId(value: string | undefined): value is AreaId {
  return (
    value === "lifestyle" ||
    value === "health" ||
    value === "family" ||
    value === "job" ||
    value === "financial"
  );
}

/** Previous area in the frozen walk, or `null` at the start. */
export function prevAreaPath(area: AreaId): string {
  const i = AREA_ORDER.indexOf(area);
  if (i <= 0) return "/result/detail";
  return AREA_META[AREA_ORDER[i - 1]].path;
}

/** Next area in the frozen walk; the final area advances to `/report`. */
export function nextAreaPath(area: AreaId): string {
  const i = AREA_ORDER.indexOf(area);
  if (i === AREA_ORDER.length - 1) return "/report";
  return AREA_META[AREA_ORDER[i + 1]].path;
}

/* ------------------------------------------------------------------ */
/*  Band → colour / label                                              */
/* ------------------------------------------------------------------ */

/** Risk band from a 0–100 area score (mirrors scoringRules.bands.risk). */
export function bandOf(score: number): RiskBandId {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}

export const BAND_LABEL: Record<RiskBandId, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

/** Token colour var for a risk band (used for gauges / accents). */
export const BAND_COLOR: Record<RiskBandId, string> = {
  low: "var(--color-semantic-success)",
  medium: "var(--color-semantic-warn)",
  high: "var(--color-semantic-danger)",
};

/** Badge variant for a risk band. */
export const BAND_BADGE: Record<RiskBandId, "success" | "warn" | "danger"> = {
  low: "success",
  medium: "warn",
  high: "danger",
};

/** Contribution-bar band ("low"/"medium"/"high") from a delta share of max. */
export function contributionBand(
  delta: number,
  max: number,
): "low" | "medium" | "high" {
  const ratio = max > 0 ? delta / max : 0;
  if (ratio < 0.34) return "low";
  if (ratio < 0.67) return "medium";
  return "high";
}
