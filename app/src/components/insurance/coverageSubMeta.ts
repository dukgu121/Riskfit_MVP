/**
 * Shared meta for the 보험 hub and the 보험 세부 sub-screen chain, covering the
 * 6 user-facing 보장 types the input flow collects. It holds what the UI needs
 * but `lib/insuranceForm.ts` + `calc/coverageFit.ts` don't already give us:
 *
 *   - the hyphen/underscore slug map (`actual-medical` <-> `actual_medical`),
 *   - the chain order (so a sub-screen knows "보험 3/6" + the next slug),
 *   - the recommended 권장값 for the active user-type (read from
 *     `standardCoverages.json`, never hardcoded),
 *   - a live 적합도 verdict line, derived from the SAME ratio math the canonical
 *     engine uses (presence types compare on 가입 여부; ratio types compare the
 *     summed amount vs 권장) so the live line never disagrees with the cache.
 *
 * Pure data/logic — no React — so both the page and the hub import it cheaply.
 */

import {
  COVERAGE_TYPES,
  coverageInputMode,
  defaultAmountUnit,
  fromStoredAmount,
  getCoverageType,
  toStoredAmount,
  unitSuffixForType,
} from "../../lib/insuranceForm";
import { coverageBand } from "../../lib/calc/interpret";
import { selectUserType } from "../../lib/calc/coverageFit";
import standardCoveragesData from "../../data/standardCoverages.json";
import type {
  CoverageBandId,
  CoverageTypeId,
  StandardCoverage,
  UserProfileInput,
  UserTypeId,
} from "../../types";

/* ------------------------------------------------------------------ */
/*  The 6 user-facing types, in chain order                            */
/* ------------------------------------------------------------------ */

/** Chain order for the 보험 세부 walk (matches the hub row order). */
export const INSURANCE_CHAIN: readonly CoverageTypeId[] = [
  "actual_medical",
  "cancer_diagnosis",
  "disease_hospitalization",
  "accident_hospitalization",
  "surgery",
  "income_interruption",
] as const;

/* ------------------------------------------------------------------ */
/*  slug <-> CoverageTypeId                                            */
/* ------------------------------------------------------------------ */

/** Route slug (hyphen) for each chain type. */
const SLUG_BY_ID: Record<string, string> = {
  actual_medical: "actual-medical",
  cancer_diagnosis: "cancer",
  disease_hospitalization: "disease-hospitalization",
  accident_hospitalization: "accident-hospitalization",
  surgery: "surgery",
  income_interruption: "income-interruption",
};

const ID_BY_SLUG: Record<string, CoverageTypeId> = Object.fromEntries(
  Object.entries(SLUG_BY_ID).map(([id, slug]) => [slug, id as CoverageTypeId]),
);

export function slugForCoverageId(id: CoverageTypeId): string {
  return SLUG_BY_ID[id] ?? id.replaceAll("_", "-");
}

/** Resolve a route slug to a chain `CoverageTypeId`, or `null` if unknown. */
export function coverageIdForSlug(slug: string | undefined): CoverageTypeId | null {
  if (!slug) return null;
  // Accept both the canonical hyphen slug and a defensive underscore form.
  const direct = ID_BY_SLUG[slug];
  if (direct) return direct;
  const underscored = slug.replaceAll("-", "_") as CoverageTypeId;
  return INSURANCE_CHAIN.includes(underscored) ? underscored : null;
}

/** Position in the chain (1-based), or 0 if not a chain type. */
export function chainIndex(id: CoverageTypeId): number {
  return INSURANCE_CHAIN.indexOf(id) + 1;
}

/** The next chain slug after `id`, or `null` at the end (back to the hub). */
export function nextSlug(id: CoverageTypeId): string | null {
  const idx = INSURANCE_CHAIN.indexOf(id);
  if (idx === -1 || idx === INSURANCE_CHAIN.length - 1) return null;
  return slugForCoverageId(INSURANCE_CHAIN[idx + 1]);
}

/* ------------------------------------------------------------------ */
/*  Per-type presentation + scoring meta                              */
/* ------------------------------------------------------------------ */

const standardCoverages = standardCoveragesData as StandardCoverage[];

/** Whether this type is scored on 가입 여부 (presence) vs amount ratio. */
export function isPresenceType(id: CoverageTypeId): boolean {
  // 수술 is a money input in the UI but scored on presence
  // (standardCoverages.fitMode === "presence"). Drive the verdict off the
  // canonical fitMode so the live line never disagrees with the cached result.
  return standardOf(id).fitMode === "presence";
}

function standardOf(
  id: CoverageTypeId,
  userType: UserTypeId = "twenties_new_worker",
): StandardCoverage {
  const exact = standardCoverages.find(
    (s) => s.userType === userType && s.coverageType === id,
  );
  if (exact) return exact;
  // Fallback to twenties baseline (every chain type is required there).
  const base = standardCoverages.find(
    (s) => s.userType === "twenties_new_worker" && s.coverageType === id,
  );
  if (base) return base;
  throw new Error(`No standard coverage for ${id}`);
}

/** Recommended amount (권장값) for this type + user-type, in stored 원. */
export function recommendedAmount(
  id: CoverageTypeId,
  userType: UserTypeId,
): number | null {
  return standardOf(id, userType).standardAmount;
}

export interface CoverageSubMeta {
  id: CoverageTypeId;
  slug: string;
  /** Display label (실손의료비, 암 진단비, …). */
  label: string;
  /** One-line "what this covers" helper. */
  description: string;
  /** Step position 1..6. */
  index: number;
  /** Scored on 가입 여부 vs amount ratio. */
  presence: boolean;
  /** Suffix for the AmountInput (만원 / 원/일 / 원/월); "" for presence. */
  unitSuffix: string;
  /** Hint text shown under the amount field, e.g. "권장 4,000만원". */
  recommendLabel: string | null;
  /** Transparent example for the empty amount field, e.g. "예: 5,000" (권장값 기준). */
  examplePlaceholder: string | null;
}

const krw = new Intl.NumberFormat("ko-KR");

/** Format a stored-원 standard amount into the field's display unit + label. */
function recommendLabelFor(
  id: CoverageTypeId,
  userType: UserTypeId,
): string | null {
  if (isPresenceType(id)) return null;
  const std = recommendedAmount(id, userType);
  if (std === null) return null;
  const display = fromStoredAmount(id, std);
  if (display === null) return null;
  return `권장 ${krw.format(display)}${unitSuffixForType(id)}`;
}

/** A transparent example for the empty amount field, derived from 권장값. */
function examplePlaceholderFor(
  id: CoverageTypeId,
  userType: UserTypeId,
): string | null {
  if (isPresenceType(id)) return null;
  const std = recommendedAmount(id, userType);
  if (std === null) return null;
  const display = fromStoredAmount(id, std);
  if (display === null) return null;
  return `예: ${krw.format(display)}`;
}

/** Build the full per-type meta for the active profile. */
export function coverageSubMeta(
  id: CoverageTypeId,
  profile: UserProfileInput,
): CoverageSubMeta {
  const userType = selectUserType(profile);
  const t = getCoverageType(id);
  const presence = isPresenceType(id);
  return {
    id,
    slug: slugForCoverageId(id),
    label: t.label,
    description: t.description,
    index: chainIndex(id),
    presence,
    unitSuffix: presence ? "" : unitSuffixForType(id),
    recommendLabel: recommendLabelFor(id, userType),
    examplePlaceholder: examplePlaceholderFor(id, userType),
  };
}

/* ------------------------------------------------------------------ */
/*  Live 적합도 verdict (one line under the inputs)                    */
/* ------------------------------------------------------------------ */

export interface CoverageVerdict {
  band: CoverageBandId;
  /** "충분" / "주의" / "부족" / "과도". */
  bandLabel: string;
  /** Friendly one-liner (했어요/해요체). */
  message: string;
  /** Ratio 0..(>100) for ratio types; null for presence. */
  ratio: number | null;
}

const BAND_LABEL: Record<CoverageBandId, string> = {
  sufficient: "충분",
  caution: "주의",
  insufficient: "부족",
  excessive: "과도",
};

/**
 * Live verdict for the sub-screen.
 *
 * @param id       coverage type
 * @param joined   가입함(true)/미가입(false) from the SegmentedControl
 * @param formValue the AmountInput value in *display* units (만원 / 원/일·월), or
 *                  null. Presence types ignore this.
 * @param profile  active profile (selects the user-type, hence 권장값)
 */
export function liveVerdict(
  id: CoverageTypeId,
  joined: boolean,
  formValue: number | null,
  profile: UserProfileInput,
): CoverageVerdict {
  const userType = selectUserType(profile);

  if (!joined) {
    return {
      band: "insufficient",
      bandLabel: BAND_LABEL.insufficient,
      message: "아직 가입하지 않았어요. 분석에서 비어 있는 보장으로 표시돼요.",
      ratio: null,
    };
  }

  // Presence-scored types (실손, 수술): 가입함 = 충분.
  if (isPresenceType(id)) {
    return {
      band: "sufficient",
      bandLabel: BAND_LABEL.sufficient,
      message: "가입하고 있어 이 보장은 충분해요.",
      ratio: null,
    };
  }

  // Ratio types: compare the entered amount (in 원) to 권장값.
  const stored = toStoredAmount(id, formValue);
  const std = recommendedAmount(id, userType);

  if (stored === null || stored <= 0) {
    return {
      band: "caution",
      bandLabel: BAND_LABEL.caution,
      message: "가입 금액을 입력하면 적합도를 바로 확인할 수 있어요.",
      ratio: null,
    };
  }
  if (std === null || std <= 0) {
    return {
      band: "sufficient",
      bandLabel: BAND_LABEL.sufficient,
      message: "가입하고 있어 이 보장은 충분해요.",
      ratio: null,
    };
  }

  const ratioScore = Math.round((stored / std) * 100);
  const band = coverageBand(ratioScore).id;
  const message = verdictMessage(band, ratioScore, id, userType);
  return { band, bandLabel: BAND_LABEL[band], message, ratio: ratioScore };
}

function verdictMessage(
  band: CoverageBandId,
  ratioScore: number,
  id: CoverageTypeId,
  userType: UserTypeId,
): string {
  const recommend = recommendLabelFor(id, userType)?.replace("권장 ", "") ?? "";
  switch (band) {
    case "sufficient":
      return `권장 수준을 충족했어요 (적합도 ${ratioScore}%).`;
    case "caution":
      return recommend
        ? `조금 부족해요. ${recommend}까지 채우면 더 든든해요 (적합도 ${ratioScore}%).`
        : `조금 부족해요 (적합도 ${ratioScore}%).`;
    case "excessive":
      return `권장보다 넉넉해요 (적합도 ${ratioScore}%). 보험료 대비 과한지 점검해 보세요.`;
    case "insufficient":
    default:
      return recommend
        ? `많이 부족해요. ${recommend} 정도를 권장해요 (적합도 ${ratioScore}%).`
        : `많이 부족해요 (적합도 ${ratioScore}%).`;
  }
}

/* ------------------------------------------------------------------ */
/*  Hub-row status (입력완료 / 미입력 + summary)                        */
/* ------------------------------------------------------------------ */

export type HubRowStatus = "joined" | "declined" | "untouched";

export interface HubRowState {
  id: CoverageTypeId;
  slug: string;
  label: string;
  description: string;
  index: number;
  status: HubRowStatus;
  /** A compact value summary for the row meta ("가입 · 3,600만원" / "미가입"). */
  summary: string;
  band: CoverageBandId | null;
  bandLabel: string | null;
}

/**
 * Compute the hub row for a type from the saved insurances.
 *
 *   joined     — a row exists with a positive amount (or presence flag).
 *   declined   — a row exists but is explicitly 미가입 (coverageAmount null/0).
 *   untouched  — no row at all (the user hasn't opened this sub-screen yet).
 */
export function hubRowState(
  id: CoverageTypeId,
  rows: { coverageType: CoverageTypeId; coverageAmount?: number | null }[],
  profile: UserProfileInput,
): HubRowState {
  const meta = coverageSubMeta(id, profile);
  const mine = rows.filter((r) => r.coverageType === id);
  const base = {
    id,
    slug: meta.slug,
    label: meta.label,
    description: meta.description,
    index: meta.index,
  };

  if (mine.length === 0) {
    return { ...base, status: "untouched", summary: "미입력", band: null, bandLabel: null };
  }

  const positive = mine.filter(
    (r) => typeof r.coverageAmount === "number" && (r.coverageAmount ?? 0) > 0,
  );
  if (positive.length === 0) {
    return { ...base, status: "declined", summary: "미가입", band: null, bandLabel: null };
  }

  // Joined: build the verdict from the summed amount.
  if (meta.presence) {
    return {
      ...base,
      status: "joined",
      summary: "가입",
      band: "sufficient",
      bandLabel: BAND_LABEL.sufficient,
    };
  }

  const totalStored = positive.reduce((s, r) => s + (r.coverageAmount ?? 0), 0);
  const display = fromStoredAmount(id, totalStored);
  const summary =
    display !== null
      ? `가입 · ${krw.format(display)}${unitSuffixForType(id)}`
      : "가입";
  const v = liveVerdict(id, true, display, profile);
  return { ...base, status: "joined", summary, band: v.band, bandLabel: v.bandLabel };
}

/* ------------------------------------------------------------------ */
/*  Re-exports the components lean on                                  */
/* ------------------------------------------------------------------ */

export {
  COVERAGE_TYPES,
  coverageInputMode,
  fromStoredAmount,
  getCoverageType,
  toStoredAmount,
  unitSuffixForType,
};

/** Alias of `defaultAmountUnit` so sub-screens import a single module. */
export const defaultAmountUnitFor = defaultAmountUnit;
