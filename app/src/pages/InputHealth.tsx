/**
 * p5 「건강정보 입력 (2/5)」 (/input/health)
 *
 * 위저드 2단계. 만성질환 다중선택(배타적 "해당없음") → chronicConditions[],
 * 키/체중 → BMI 리드아웃, 혈압/혈당/콜레스테롤 → VitalBand SegmentedControl.
 * 기존 InputHealthLifestyle의 건강검진/치료중질병/병원방문빈도도 유지한다.
 *
 * 데스크톱 WEB 톤: WizardShell(단일 컬럼 ≈600).
 *
 * 영속화: `riskfit.profile.health` 슬라이스. 생활습관(p6)도 같은 슬라이스를 쓰므로
 * **머지**해서 저장한다(이 화면이 소유한 필드만 패치 — 상대 화면 필드를 덮지 않음).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { WizardShell } from "../components/wizard/WizardShell";
import { WizardCard } from "../components/wizard/WizardCard";
import { SuffixInput, onlyDigits } from "../components/wizard/SuffixInput";
import { FieldGroup } from "../components/wizard/FieldGroup";
// Wizard chip-grid variant — the SAME selector InputLifestyle uses — so the
// vitals / 의료 이력 segments render in the shared wizard chip style instead of
// the ui-kit sliding-pill. Keeps all four input screens visually one wizard.
import { SegmentedControl } from "../components/wizard/SegmentedControl";
import { cn } from "../lib/cn";
import { read, write } from "../lib/storage";
import { returnSuffix } from "../lib/draft";
import type { ChronicCondition, HospitalVisits, VitalBand } from "../types";

const STORAGE_KEY = "riskfit.profile.health";

/** Fields this screen owns within the shared health slice. */
interface HealthOwned {
  heightCm: string;
  weightKg: string;
  chronicConditions: ChronicCondition[];
  bloodPressure: VitalBand | null;
  bloodSugar: VitalBand | null;
  cholesterol: VitalBand | null;
  checkupIssue: boolean | null;
  currentDisease: boolean | null;
  hospitalVisits: HospitalVisits | null;
}

function loadOwned(): HealthOwned {
  const raw = read<Record<string, unknown>>(STORAGE_KEY, {});
  const conds = Array.isArray(raw.chronicConditions)
    ? (raw.chronicConditions as ChronicCondition[])
    : [];
  return {
    heightCm: raw.heightCm != null ? String(raw.heightCm) : "",
    weightKg: raw.weightKg != null ? String(raw.weightKg) : "",
    chronicConditions: conds,
    // Vitals + medical history carry honest, editable defaults (정상 / 없음 /
    // 1~2회): the sliding-pill selector always shows one option, so a benign
    // default the user can change beats a misleading "pre-selected but treated
    // as unanswered" state. Height/weight/만성질환 remain genuinely required.
    bloodPressure: (raw.bloodPressure as VitalBand | null) ?? "normal",
    bloodSugar: (raw.bloodSugar as VitalBand | null) ?? "normal",
    cholesterol: (raw.cholesterol as VitalBand | null) ?? "normal",
    checkupIssue: typeof raw.checkupIssue === "boolean" ? raw.checkupIssue : false,
    currentDisease: typeof raw.currentDisease === "boolean" ? raw.currentDisease : false,
    hospitalVisits: (raw.hospitalVisits as HospitalVisits | null) ?? "visits_1_2",
  };
}

/** Merge owned fields into the existing slice, keeping lifestyle (p6) intact. */
function persist(owned: HealthOwned): void {
  const existing = read<Record<string, unknown>>(STORAGE_KEY, {});
  write(STORAGE_KEY, {
    ...existing,
    heightCm: onlyDigits(owned.heightCm),
    weightKg: onlyDigits(owned.weightKg),
    chronicConditions: owned.chronicConditions,
    bloodPressure: owned.bloodPressure,
    bloodSugar: owned.bloodSugar,
    cholesterol: owned.cholesterol,
    checkupIssue: owned.checkupIssue,
    currentDisease: owned.currentDisease,
    hospitalVisits: owned.hospitalVisits,
  });
}

const CHRONIC_OPTIONS: ReadonlyArray<{ id: ChronicCondition; label: string }> = [
  { id: "hypertension", label: "고혈압" },
  { id: "diabetes", label: "당뇨" },
  { id: "hyperlipidemia", label: "고지혈증" },
  { id: "heart", label: "심장질환" },
  { id: "thyroid", label: "갑상선질환" },
  { id: "other", label: "기타" },
];

const VITAL_OPTIONS: ReadonlyArray<{ value: VitalBand; label: string }> = [
  { value: "normal", label: "정상" },
  { value: "caution", label: "주의" },
  { value: "high", label: "높음" },
];

function computeBmi(heightCm: string, weightKg: string): number | null {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
  const m = h / 100;
  if (m < 1.2 || m > 2.4) return null;
  return Number((w / (m * m)).toFixed(1));
}

function bmiBand(value: number): { label: string; tone: "ok" | "warn" } {
  if (value < 18.5) return { label: "저체중", tone: "warn" };
  if (value < 23) return { label: "정상", tone: "ok" };
  if (value < 25) return { label: "과체중", tone: "warn" };
  return { label: "비만", tone: "warn" };
}

export function InputHealth() {
  const navigate = useNavigate();
  const [state, setState] = useState<HealthOwned>(loadOwned);

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => persist(state), 120);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [state]);

  const patch = useCallback((partial: Partial<HealthOwned>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleChronic = useCallback((id: ChronicCondition) => {
    setState((prev) => {
      // "none" is exclusive — picking it clears all, picking any disease clears it.
      if (id === "none") {
        const has = prev.chronicConditions.includes("none");
        return { ...prev, chronicConditions: has ? [] : ["none"] };
      }
      const without = prev.chronicConditions.filter((c) => c !== "none");
      const next = without.includes(id)
        ? without.filter((c) => c !== id)
        : [...without, id];
      return { ...prev, chronicConditions: next };
    });
  }, []);

  const bmi = useMemo(
    () => computeBmi(state.heightCm, state.weightKg),
    [state.heightCm, state.weightKg],
  );

  const h = Number(state.heightCm);
  const w = Number(state.weightKg);
  const heightValid = state.heightCm !== "" && h >= 120 && h <= 230;
  const weightValid = state.weightKg !== "" && w >= 25 && w <= 250;
  const noneChecked = state.chronicConditions.includes("none");
  const chronicAnswered = state.chronicConditions.length > 0;

  // 건강검진/치료중질병/방문빈도/혈압·혈당·콜레스테롤은 honest 기본값을 가지므로
  // 필수 게이트는 키·몸무게·만성질환 선택뿐이다.
  const canContinue = heightValid && weightValid && chronicAnswered;

  const helperText = useMemo(() => {
    if (!heightValid) return "키를 120~230cm 사이로 입력해요.";
    if (!weightValid) return "몸무게를 25~250kg 사이로 입력해요.";
    if (!chronicAnswered) return "만성질환을 선택해요. (없으면 ‘해당 없음’)";
    return "";
  }, [heightValid, weightValid, chronicAnswered]);

  function handleNext() {
    if (!canContinue) return;
    persist(state);
    navigate(`/input/lifestyle${returnSuffix()}`);
  }

  return (
    <WizardShell
      step={2}
      eyebrow="건강 정보"
      title="건강 상태를 알려주세요"
      subtitle="질병 위험을 가늠하는 핵심 정보예요. 정확할수록 진단이 정밀해져요."
      backTo="/input/basic"
      canContinue={canContinue}
      onNext={handleNext}
      helperText={helperText}
    >
      {/* 만성질환 */}
      <WizardCard title="만성질환" helper="진단받았거나 치료 중인 질환을 모두 선택해요.">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {CHRONIC_OPTIONS.map((opt) => (
            <ChronicChip
              key={opt.id}
              label={opt.label}
              selected={state.chronicConditions.includes(opt.id)}
              disabled={noneChecked}
              onClick={() => toggleChronic(opt.id)}
            />
          ))}
        </div>
        <ChronicChip
          label="해당 없음"
          selected={noneChecked}
          disabled={false}
          onClick={() => toggleChronic("none")}
          full
        />
      </WizardCard>

      {/* 체격 */}
      <WizardCard title="체격">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="키" htmlFor="health-height">
            <SuffixInput
              id="health-height"
              value={state.heightCm}
              onChange={(v) => patch({ heightCm: v })}
              suffix="cm"
              placeholder="예: 170"
            />
          </FieldGroup>
          <FieldGroup label="몸무게" htmlFor="health-weight">
            <SuffixInput
              id="health-weight"
              value={state.weightKg}
              onChange={(v) => patch({ weightKg: v })}
              suffix="kg"
              placeholder="예: 65"
            />
          </FieldGroup>
        </div>
        {bmi !== null && <BmiReadout value={bmi} />}
      </WizardCard>

      {/* 검진 수치 */}
      <WizardCard title="검진 수치" helper="최근 건강검진 결과를 기준으로 선택해요. 모르면 비워둬도 돼요.">
        <FieldGroup label="혈압">
          <SegmentedControl<VitalBand>
            ariaLabel="혈압"
            value={state.bloodPressure ?? "normal"}
            options={VITAL_OPTIONS}
            onChange={(v) => patch({ bloodPressure: v })}
          />
        </FieldGroup>
        <FieldGroup label="혈당">
          <SegmentedControl<VitalBand>
            ariaLabel="혈당"
            value={state.bloodSugar ?? "normal"}
            options={VITAL_OPTIONS}
            onChange={(v) => patch({ bloodSugar: v })}
          />
        </FieldGroup>
        <FieldGroup label="콜레스테롤">
          <SegmentedControl<VitalBand>
            ariaLabel="콜레스테롤"
            value={state.cholesterol ?? "normal"}
            options={VITAL_OPTIONS}
            onChange={(v) => patch({ cholesterol: v })}
          />
        </FieldGroup>
      </WizardCard>

      {/* 의료 이력 */}
      <WizardCard title="의료 이력">
        <FieldGroup label="최근 1년 건강검진 이상 소견" helperText="재검사·정밀검진 안내 포함">
          <SegmentedControl<"yes" | "no">
            ariaLabel="건강검진 이상 여부"
            value={state.checkupIssue === null ? "no" : state.checkupIssue ? "yes" : "no"}
            options={[
              { value: "no", label: "없음" },
              { value: "yes", label: "있음" },
            ]}
            onChange={(v) => patch({ checkupIssue: v === "yes" })}
          />
        </FieldGroup>
        <FieldGroup label="현재 치료 중인 질병">
          <SegmentedControl<"yes" | "no">
            ariaLabel="치료 중인 질병 여부"
            value={state.currentDisease === null ? "no" : state.currentDisease ? "yes" : "no"}
            options={[
              { value: "no", label: "없음" },
              { value: "yes", label: "있음" },
            ]}
            onChange={(v) => patch({ currentDisease: v === "yes" })}
          />
        </FieldGroup>
        <FieldGroup label="최근 1년 병원 방문" helperText="선택 사항이에요.">
          <SegmentedControl<HospitalVisits>
            ariaLabel="병원 방문 빈도"
            value={state.hospitalVisits ?? "visits_1_2"}
            options={[
              { value: "visits_1_2", label: "1~2회" },
              { value: "visits_3_5", label: "3~5회" },
              { value: "visits_6_plus", label: "6회+" },
            ]}
            onChange={(v) => patch({ hospitalVisits: v })}
          />
        </FieldGroup>
      </WizardCard>
    </WizardShell>
  );
}

/* ------------------------------------------------------------------ */

function ChronicChip({
  label,
  selected,
  disabled,
  onClick,
  full = false,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  full?: boolean;
}) {
  const inactive = disabled && !selected;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={inactive}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center rounded-xl px-3 text-[14px] font-semibold",
        "transition-[background-color,border-color,color,transform] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "focus:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        full && "mt-2.5 w-full",
        selected
          ? "border-[1.5px] border-brand-500 bg-brand-50 text-brand-700"
          : inactive
            ? "cursor-not-allowed border border-dashed border-neutral-200 bg-neutral-50 text-neutral-300"
            : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 active:scale-[0.98]",
      )}
    >
      {label}
    </button>
  );
}

function BmiReadout({ value }: { value: number }) {
  const { label, tone } = bmiBand(value);
  return (
    <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-5 py-4">
      <div>
        <p className="text-[12px] font-medium text-neutral-400">BMI</p>
        <p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-neutral-900">
          {value.toFixed(1)}
        </p>
      </div>
      <span
        className={cn(
          "rounded-full px-3 py-1 text-[13px] font-semibold",
          tone === "ok" ? "bg-success-50 text-success-700" : "bg-warn-50 text-warn-700",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default InputHealth;
