/**
 * p9–p14 「보험 세부 입력」 — ONE param module for the 6-coverage chain
 * (`/input/insurance/:coverageType`), restyled Toss-web inside `AppShell`.
 *
 * Flow per screen:
 *   1. 가입함 / 미가입  (SegmentedControl)
 *   2. 가입함 → AmountInput(s) appropriate to the type
 *   3. one LIVE 적합도 verdict line (from `liveVerdict`, the same ratio math the
 *      cached analysis uses)
 *   4. footer: 임시저장(ghost, save + back to hub) / 저장하고 다음으로(primary,
 *      save + advance to the next chain type, or back to the hub at the end)
 *
 * Per-type shape (MIGRATION_PLAN §3 p9–p14):
 *   p9  실손 (actual_medical)          presence; ALSO show 보장/통원/약제비 한도 3
 *                                       fields — captured for UX but NOT persisted
 *                                       (insurance schema is strict; presence-scored)
 *   p10 암 (cancer_diagnosis)          만원, live 적합도
 *   p11 질병 입원 (disease_hospital…)   원/일
 *   p12 상해 입원 (accident_hospital…)  원/일
 *   p13 수술 (surgery)                  만원 입력이나 presence 스코어
 *   p14 소득중단 (income_interruption)  원/월 (+ 보장기간 demo-only, 미저장)
 *
 * 미가입 저장 = an explicit declined row (coverageAmount null) is written, so
 * `coverageFit.hasCoverage`/`sumCoverageAmount` treat it as a 공백 while the hub
 * still shows "미가입" (vs an untouched type's "미입력"). Persistence:
 * `riskfit.insurances` via `upsertInsurance`, one canonical row per coverage type.
 */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../../components/layout/AppShell";
import { AmountInput } from "../../components/ui/AmountInput";
import { Badge } from "../../components/ui/badge";
import { InfoBanner } from "../../components/ui/InfoBanner";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import {
  WizardFooter,
  WizardStepHeader,
} from "../../components/insurance/InsuranceWizardChrome";
import {
  INSURANCE_CHAIN,
  chainIndex,
  coverageIdForSlug,
  coverageSubMeta,
  defaultAmountUnitFor,
  fromStoredAmount,
  liveVerdict,
  nextSlug,
  toStoredAmount,
  unitSuffixForType,
} from "../../components/insurance/coverageSubMeta";
import { read, readProfile, write, STORAGE_KEYS } from "../../lib/storage";
import { returnSuffix, upsertInsurance, writeInsuranceDraftStep } from "../../lib/draft";
import type {
  CoverageBandId,
  CoverageTypeId,
  Insurance,
  UserProfileInput,
} from "../../types";

/* ------------------------------------------------------------------ */
/*  Band → presentation                                                */
/* ------------------------------------------------------------------ */

const BADGE_VARIANT: Record<CoverageBandId, "success" | "warn" | "danger" | "info"> = {
  sufficient: "success",
  caution: "warn",
  insufficient: "danger",
  excessive: "info",
};

const VERDICT_TINT: Record<CoverageBandId, string> = {
  sufficient: "bg-success-50",
  caution: "bg-warn-50",
  insufficient: "bg-neutral-100",
  excessive: "bg-info-50",
};

const VERDICT_DOT: Record<CoverageBandId, string> = {
  sufficient: "bg-success-500",
  caution: "bg-warn-500",
  insufficient: "bg-neutral-400",
  excessive: "bg-info-500",
};

/** Demo-only 보장기간 options for 소득중단 (p14) — captured, not persisted. */
const INCOME_PERIOD_OPTIONS = [
  { value: "m6", label: "6개월" },
  { value: "y1", label: "1년" },
  { value: "y2", label: "2년 이상" },
] as const;
type IncomePeriod = (typeof INCOME_PERIOD_OPTIONS)[number]["value"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** The single canonical saved row for this type (sum if multiple legacy rows). */
function loadExisting(
  rows: Insurance[],
  id: CoverageTypeId,
): { joined: boolean; formValue: number | null; row: Insurance | null } {
  const mine = rows.filter((r) => r.coverageType === id);
  if (mine.length === 0) return { joined: false, formValue: null, row: null };
  const positive = mine.filter(
    (r) => typeof r.coverageAmount === "number" && (r.coverageAmount ?? 0) > 0,
  );
  if (positive.length === 0) {
    // A declined row exists (explicit 미가입).
    return { joined: false, formValue: null, row: mine[0] };
  }
  const totalStored = positive.reduce((s, r) => s + (r.coverageAmount ?? 0), 0);
  return {
    joined: true,
    formValue: fromStoredAmount(id, totalStored),
    row: positive[0],
  };
}

function stableId(existing: Insurance | null, id: CoverageTypeId): string {
  if (existing) return existing.id;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${id}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

export function InsuranceSubScreen() {
  const { coverageType } = useParams<{ coverageType: string }>();
  const id = coverageIdForSlug(coverageType);

  // Unknown / non-chain slug → bounce to the hub (preserve the ?return= loop).
  if (!id) {
    return <Navigate to={`/input/insurance${returnSuffix()}`} replace />;
  }
  return <SubScreenBody key={id} id={id} />;
}

function SubScreenBody({ id }: { id: CoverageTypeId }) {
  const navigate = useNavigate();
  const profile = useMemo<UserProfileInput>(() => readProfile<UserProfileInput>(), []);
  const meta = useMemo(() => coverageSubMeta(id, profile), [id, profile]);

  const initial = useMemo(
    () => loadExisting(read<Insurance[]>(STORAGE_KEYS.insurances, []), id),
    [id],
  );

  const [joined, setJoined] = useState<boolean>(initial.joined);
  const [amount, setAmount] = useState<number | null>(initial.formValue);

  // p9 실손 — 3 capture-but-unused 한도 fields (decorative for the schema, but
  // NOT decorative for the user: they make the 실손 screen feel real).
  const [medMain, setMedMain] = useState<number | null>(null);
  const [medOutpatient, setMedOutpatient] = useState<number | null>(null);
  const [medPharmacy, setMedPharmacy] = useState<number | null>(null);

  // p14 소득중단 — demo-only 보장기간, not persisted.
  const [incomePeriod, setIncomePeriod] = useState<IncomePeriod>("y1");

  // Remember where the user is in the chain (resume support).
  useEffect(() => {
    writeInsuranceDraftStep(meta.slug);
  }, [meta.slug]);

  const isActualMedical = id === "actual_medical";
  const isSurgery = id === "surgery";
  const isIncome = id === "income_interruption";
  // Presence types (실손/수술) and the ratio types render differently.
  const showAmountField = joined && !meta.presence;
  // 수술: presence-scored but we still let users note the 만원 payout.
  const showSurgeryAmount = joined && isSurgery;

  const verdict = useMemo(
    () => liveVerdict(id, joined, amount, profile),
    [id, joined, amount, profile],
  );

  const stepTotal = INSURANCE_CHAIN.length;
  const next = nextSlug(id);

  /* ----- persistence ----- */

  function buildRow(): Insurance {
    if (!joined) {
      // 미가입 → persist an explicit declined row (coverageAmount null). It
      // reads as a 공백 for scoring (hasCoverage/sumCoverageAmount ignore
      // null/0 amounts) but lets the hub show "미가입" instead of forgetting
      // the choice as "미입력".
      return {
        id: stableId(initial.row, id),
        coverageType: id,
        coverageAmount: null,
        amountUnit: defaultAmountUnitFor(id),
      };
    }

    if (meta.presence) {
      // 실손/수술 — presence flag (store 1). 수술의 만원 입력은 표시용이라
      // 점수에 쓰지 않지만, 사용자가 적은 값이 있으면 그대로 보존한다.
      const presenceAmount =
        isSurgery && amount !== null ? toStoredAmount(id, amount) ?? 1 : 1;
      return {
        id: stableId(initial.row, id),
        coverageType: id,
        coverageAmount: presenceAmount,
        amountUnit: defaultAmountUnitFor(id),
      };
    }

    // Ratio types — store the entered amount in canonical 원.
    const stored = toStoredAmount(id, amount);
    if (stored === null || stored <= 0) {
      // 가입함이지만 금액 미입력 → presence-only positive so it doesn't read as
      // a gap; the verdict already nudges the user to enter an amount.
      return {
        id: stableId(initial.row, id),
        coverageType: id,
        coverageAmount: 1,
        amountUnit: defaultAmountUnitFor(id),
      };
    }
    return {
      id: stableId(initial.row, id),
      coverageType: id,
      coverageAmount: stored,
      amountUnit: defaultAmountUnitFor(id),
    };
  }

  function persist(): void {
    const current = read<Insurance[]>(STORAGE_KEYS.insurances, []);
    // Drop every existing row of this type, then add the single rebuilt one
    // (가입함 = amount/presence row, 미가입 = explicit null-amount row). The
    // pre-filter + single re-add guarantees exactly ONE canonical row per type.
    const withoutType = current.filter((r) => r.coverageType !== id);
    const nextList = upsertInsurance(withoutType, buildRow());
    write(STORAGE_KEYS.insurances, nextList);
  }

  function handleSaveDraft(): void {
    persist();
    // Preserve ?return= so the Premium re-input loop lands back on premium.
    navigate(`/input/insurance${returnSuffix()}`);
  }

  function handleSaveNext(): void {
    persist();
    // Thread ?return= through the whole 보험 chain (RESET#2/#3 loop).
    if (next) navigate(`/input/insurance/${next}${returnSuffix()}`);
    else navigate(`/input/insurance${returnSuffix()}`);
  }

  /* ----- render ----- */

  return (
    <AppShell title="보험 세부 입력" backTo={`/input/insurance${returnSuffix()}`} brandTo="/onboarding" maxWidth={600}>
      <WizardStepHeader
        eyebrow={`보험 ${chainIndex(id)} / ${stepTotal}`}
        percent={(chainIndex(id) / stepTotal) * 100}
        trailing={meta.label}
      />

      {/* Title */}
      <div className="mt-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="text-[26px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[30px]"
        >
          {meta.label} 보장이 있나요?
        </motion.h1>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
          {meta.description}
        </p>
      </div>

      {/* Card */}
      <div className="mt-7 flex flex-col gap-6 rounded-3xl bg-white px-6 py-7 shadow-card sm:px-7">
        {/* 가입 여부 */}
        <Field label="가입 여부">
          <SegmentedControl
            ariaLabel="가입 여부"
            value={joined ? "yes" : "no"}
            options={[
              { value: "yes", label: "가입함" },
              { value: "no", label: "미가입" },
            ]}
            onChange={(v) => setJoined(v === "yes")}
          />
        </Field>

        {/* Amount inputs (only when 가입함) */}
        {joined && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5">
              {/* 실손 — presence + 3 capture-but-unused 한도 fields */}
              {isActualMedical && (
                <>
                  <InfoBanner tone="info">
                    실손의료비는 가입 여부만으로 충분해요. 한도는 참고용으로만 적어
                    두세요 — 분석 점수에는 쓰이지 않아요.
                  </InfoBanner>
                  <Field label="입원 의료비 한도" optional>
                    <AmountInput
                      value={medMain}
                      onValueChange={setMedMain}
                      suffix="만원"
                      placeholder="예: 5,000"
                    />
                  </Field>
                  <Field label="통원 의료비 한도" optional>
                    <AmountInput
                      value={medOutpatient}
                      onValueChange={setMedOutpatient}
                      suffix="만원"
                      placeholder="예: 20"
                    />
                  </Field>
                  <Field label="처방·약제비 한도" optional>
                    <AmountInput
                      value={medPharmacy}
                      onValueChange={setMedPharmacy}
                      suffix="만원"
                      placeholder="예: 5"
                    />
                  </Field>
                </>
              )}

              {/* 수술 — presence-scored, 만원 입력은 표시용 */}
              {showSurgeryAmount && (
                <>
                  <InfoBanner tone="info">
                    수술비는 가입 여부만으로 충분해요. 1회 지급액은 참고용이에요.
                  </InfoBanner>
                  <Field label="수술 1회 지급액" optional>
                    <AmountInput
                      value={amount}
                      onValueChange={setAmount}
                      suffix="만원"
                      placeholder="예: 300"
                    />
                  </Field>
                </>
              )}

              {/* Ratio types — the real scored amount */}
              {showAmountField && (
                <Field
                  label={isIncome ? "월 지급액" : "가입 금액"}
                  helper={meta.recommendLabel ?? undefined}
                >
                  <AmountInput
                    value={amount}
                    onValueChange={setAmount}
                    suffix={unitSuffixForType(id)}
                    // Per MIGRATION_PLAN p9–p14: de-emphasise red for 부족 here.
                    // Only a positive "충분" cue on the field; band colour
                    // otherwise stays confined to the verdict line below.
                    state={
                      verdict.band === "sufficient" && amount !== null
                        ? "success"
                        : "default"
                    }
                    placeholder={meta.examplePlaceholder ?? "0"}
                  />
                </Field>
              )}

              {/* 소득중단 — demo-only 보장기간 */}
              {isIncome && (
                <Field label="보장 기간">
                  <SegmentedControl
                    ariaLabel="보장 기간"
                    value={incomePeriod}
                    options={INCOME_PERIOD_OPTIONS}
                    onChange={setIncomePeriod}
                  />
                  <p className="mt-2 text-[12px] text-neutral-400">
                    보장 기간은 참고용이에요. 적합도 점수에는 월 지급액만 반영돼요.
                  </p>
                </Field>
              )}
            </div>
          </motion.div>
        )}

        {/* Live 적합도 verdict */}
        <VerdictLine
          band={verdict.band}
          bandLabel={verdict.bandLabel}
          message={verdict.message}
        />
      </div>

      {/* Footer */}
      <div className="mt-8">
        <WizardFooter
          primaryLabel={next ? "저장하고 다음으로" : "저장하고 완료"}
          onPrimary={handleSaveNext}
          secondaryLabel="임시저장"
          onSecondary={handleSaveDraft}
        />
      </div>

      <p className="mt-5 text-center text-[12px] leading-relaxed text-neutral-400">
        입력한 보장 정보는 적합도 분석에만 쓰여요. 보험 상품 추천이 아니에요.
      </p>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function Field({
  label,
  helper,
  optional,
  children,
}: {
  label: string;
  helper?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-[14px] font-semibold text-neutral-800">
          {label}
          {optional && (
            <span className="ml-1.5 text-[12px] font-medium text-neutral-400">
              선택
            </span>
          )}
        </label>
        {helper && (
          <span className="text-[13px] font-medium tabular-nums text-neutral-400">
            {helper}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function VerdictLine({
  band,
  bandLabel,
  message,
}: {
  band: CoverageBandId;
  bandLabel: string;
  message: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ${VERDICT_TINT[band]}`}
      role="status"
      aria-live="polite"
    >
      <span className={`mt-1 size-2 shrink-0 rounded-full ${VERDICT_DOT[band]}`} aria-hidden />
      <div className="flex-1">
        <span className="flex items-center gap-2">
          <Badge variant={BADGE_VARIANT[band]} size="sm">
            {bandLabel}
          </Badge>
        </span>
        <p className="mt-1.5 text-[14px] leading-snug text-neutral-700">{message}</p>
      </div>
    </div>
  );
}

export default InsuranceSubScreen;
