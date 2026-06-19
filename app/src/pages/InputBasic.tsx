/**
 * p4 「기본정보 입력 (1/5)」 (/input/basic)
 *
 * 위저드 1단계. 나이 · 성별 · 직업 · 월소득 · 부양가족을 받는다. 라이브 요약
 * 카드로 입력이 즉시 반영되는 걸 보여 주고, financialRisk가 쓰는 월지출/비상금/
 * 거주형태는 선택 사항이라 "추가 정보" 모달로 demote(필수 흐름을 가볍게 유지).
 *
 * 데스크톱 WEB 톤: WizardShell(좁은 단일 컬럼 ≈600, 상단 진행바 + 단일 CTA).
 * 금액은 AmountInput(만원), 성별은 sliding-pill SegmentedControl, 직업은 Select +
 * jobRisk 힌트, 부양가족은 Stepper.
 *
 * 영속화: `riskfit.profile.basic` 슬라이스에 120ms 디바운스로 기록. readProfile이
 * `*Man` 만원 키 → 원으로, age 문자열 → 숫자로 정규화하므로 슬라이스 형태를 유지한다.
 * hasDependents(boolean)는 calc가 직접 읽으므로 dependentsCount에서 파생해 함께 저장.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { WizardShell } from "../components/wizard/WizardShell";
import { WizardCard } from "../components/wizard/WizardCard";
import { SuffixInput, onlyDigits } from "../components/wizard/SuffixInput";
import { FieldGroup } from "../components/wizard/FieldGroup";
import { AmountInput } from "../components/ui/AmountInput";
// Wizard chip variant (supports an honest "nothing selected" state via
// value={undefined}); the ui-kit sliding-pill always highlights one option, so
// it would falsely pre-select a gender on a fresh form.
import { SegmentedControl as ChipSegmented } from "../components/wizard/SegmentedControl";
import { Stepper } from "../components/ui/Stepper";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { read, write } from "../lib/storage";
import { returnSuffix } from "../lib/draft";
import type { Gender, JobGroupId } from "../types";

const STORAGE_KEY = "riskfit.profile.basic";

interface BasicState {
  age: string;
  gender: Gender | null;
  jobGroup: JobGroupId | null;
  monthlyIncomeMan: number | null;
  dependentsCount: number;
  // demoted to the 추가 정보 modal
  monthlyExpenseMan: number | null;
  emergencyFundMan: number | null;
  housingType: string;
}

/** Persisted shape adds the derived `hasDependents` boolean the calc reads. */
type PersistedBasic = BasicState & { hasDependents: boolean | null };

function loadState(): BasicState {
  const raw = read<Partial<PersistedBasic> & Record<string, unknown>>(
    STORAGE_KEY,
    {},
  );
  const num = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v.replace(/,/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  // dependentsCount may not exist on a legacy slice — fall back to hasDependents.
  const count =
    typeof raw.dependentsCount === "number"
      ? raw.dependentsCount
      : raw.hasDependents === true
        ? 1
        : 0;
  return {
    age: raw.age != null ? String(raw.age) : "",
    gender: (raw.gender as Gender | null) ?? null,
    jobGroup: (raw.jobGroup as JobGroupId | null) ?? null,
    monthlyIncomeMan: num(raw.monthlyIncomeMan),
    dependentsCount: count,
    monthlyExpenseMan: num(raw.monthlyExpenseMan),
    emergencyFundMan: num(raw.emergencyFundMan),
    housingType: typeof raw.housingType === "string" ? raw.housingType : "",
  };
}

const JOB_GROUPS: ReadonlyArray<{
  id: JobGroupId;
  label: string;
  hint: string;
  risk: "낮음" | "보통" | "높음";
}> = [
  { id: "student", label: "학생", hint: "재학·휴학 포함", risk: "낮음" },
  { id: "office", label: "사무직", hint: "실내 근무", risk: "낮음" },
  { id: "service", label: "서비스직", hint: "고객 응대", risk: "보통" },
  { id: "driving", label: "운전직", hint: "장시간 운전", risk: "높음" },
  { id: "field", label: "현장직", hint: "야외·생산 현장", risk: "높음" },
];

const HOUSING_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "owned", label: "자가" },
  { id: "monthly_rent", label: "월세" },
  { id: "jeonse", label: "전세" },
  { id: "family", label: "가족과 함께" },
  { id: "dorm", label: "기숙사·하숙" },
];

const RISK_TONE: Record<"낮음" | "보통" | "높음", string> = {
  낮음: "bg-success-50 text-success-700",
  보통: "bg-warn-50 text-warn-700",
  높음: "bg-danger-50 text-danger-700",
};

export function InputBasic() {
  const navigate = useNavigate();
  const [state, setState] = useState<BasicState>(loadState);
  const [moreOpen, setMoreOpen] = useState(false);

  // Debounced persistence — same 120ms pattern as the original wizard.
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      persist(state);
    }, 120);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [state]);

  const patch = useCallback((partial: Partial<BasicState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const ageNumber = Number(state.age);
  const ageValid =
    state.age !== "" &&
    Number.isFinite(ageNumber) &&
    ageNumber >= 14 &&
    ageNumber <= 99;
  const incomeValid = state.monthlyIncomeMan !== null && state.monthlyIncomeMan > 0;

  const canContinue = ageValid && state.gender !== null && state.jobGroup !== null && incomeValid;

  const helperText = useMemo(() => {
    if (!ageValid) return "나이를 14~99 사이로 입력해요.";
    if (state.gender === null) return "성별을 선택해요.";
    if (state.jobGroup === null) return "직업을 선택해요.";
    if (!incomeValid) return "월 소득을 입력해요.";
    return "";
  }, [ageValid, state.gender, state.jobGroup, incomeValid]);

  const job = JOB_GROUPS.find((j) => j.id === state.jobGroup) ?? null;

  function handleNext() {
    if (!canContinue) return;
    persist(state); // final flush
    navigate(`/input/health${returnSuffix()}`);
  }

  return (
    <WizardShell
      step={1}
      eyebrow="기본 정보"
      title="기본 정보를 입력해요"
      subtitle="나이와 직업, 소득은 위험과 보장 기준을 정하는 데 쓰여요."
      backTo="/onboarding/result-intro"
      canContinue={canContinue}
      onNext={handleNext}
      helperText={helperText}
    >
      {/* 신상 */}
      <WizardCard title="신상">
        <FieldGroup label="나이" htmlFor="basic-age" helperText="만 나이로 입력해요.">
          <SuffixInput
            id="basic-age"
            value={state.age}
            onChange={(v) => patch({ age: v })}
            suffix="세"
            maxLength={2}
            placeholder="예: 30"
          />
        </FieldGroup>

        <FieldGroup label="성별">
          <ChipSegmented<Gender>
            ariaLabel="성별"
            value={state.gender ?? undefined}
            options={[
              { value: "female", label: "여성" },
              { value: "male", label: "남성" },
            ]}
            onChange={(v) => patch({ gender: v })}
          />
        </FieldGroup>

        <FieldGroup label="직업" htmlFor="basic-job">
          <Select
            value={state.jobGroup ?? undefined}
            onValueChange={(v) => patch({ jobGroup: v as JobGroupId })}
          >
            <SelectTrigger id="basic-job" className="h-14 text-[16px]">
              <SelectValue placeholder="직업을 선택해요" />
            </SelectTrigger>
            <SelectContent>
              {JOB_GROUPS.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  <span className="font-medium text-neutral-900">{j.label}</span>
                  <span className="ml-2 text-xs text-neutral-400">{j.hint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {job && (
            <p className="mt-2 flex items-center gap-2 text-[13px] text-neutral-500">
              <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${RISK_TONE[job.risk]}`}>
                직업 위험 {job.risk}
              </span>
              <span>{job.hint}</span>
            </p>
          )}
        </FieldGroup>
      </WizardCard>

      {/* 재무 · 가족 */}
      <WizardCard title="소득 · 가족">
        <FieldGroup label="월 소득" htmlFor="basic-income" helperText="세후 실수령액 기준이에요.">
          <AmountInput
            id="basic-income"
            value={state.monthlyIncomeMan}
            onValueChange={(v) => patch({ monthlyIncomeMan: v })}
            suffix="만원"
            placeholder="예: 300"
          />
        </FieldGroup>

        <FieldGroup label="부양가족" helperText="나에게 생계를 의지하는 가족 수예요.">
          <Stepper
            value={state.dependentsCount}
            onChange={(v) => patch({ dependentsCount: v })}
            min={0}
            max={10}
            suffix="명"
            ariaLabel="부양가족 수"
          />
        </FieldGroup>
      </WizardCard>

      {/* 추가 정보 trigger */}
      <button
        type="button"
        onClick={() => setMoreOpen(true)}
        className="flex w-full items-center justify-between rounded-3xl bg-white px-6 py-5 text-left shadow-card transition-colors hover:bg-neutral-50 active:bg-neutral-100"
      >
        <span>
          <span className="block text-[15px] font-bold text-neutral-900">
            추가 정보 입력
            <span className="ml-2 text-[13px] font-normal text-neutral-400">선택</span>
          </span>
          <span className="mt-0.5 block text-[13px] text-neutral-500">
            월 지출·비상금·거주 형태를 더하면 재무 위험을 더 정확히 봐요.
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {(state.monthlyExpenseMan !== null ||
            state.emergencyFundMan !== null ||
            state.housingType !== "") && (
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-600">
              입력됨
            </span>
          )}
          <ChevronRight />
        </span>
      </button>

      {/* Live summary */}
      <SummaryCard
        age={ageValid ? ageNumber : null}
        gender={state.gender}
        jobLabel={job?.label ?? null}
        incomeMan={state.monthlyIncomeMan}
        dependents={state.dependentsCount}
      />

      {/* 추가 정보 modal */}
      <Modal
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title="추가 정보"
        description="모두 선택 사항이에요. 입력하면 재무 위험 분석이 더 정확해져요."
        footer={
          <Button type="button" variant="default" fullWidth onClick={() => setMoreOpen(false)}>
            저장
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <FieldGroup label="월 고정 지출" htmlFor="basic-expense" helperText="월세·통신·구독 등">
            <AmountInput
              id="basic-expense"
              value={state.monthlyExpenseMan}
              onValueChange={(v) => patch({ monthlyExpenseMan: v })}
              suffix="만원"
              placeholder="예: 150"
            />
          </FieldGroup>

          <FieldGroup label="비상금" htmlFor="basic-fund" helperText="당장 꺼내 쓸 수 있는 잔액">
            <AmountInput
              id="basic-fund"
              value={state.emergencyFundMan}
              onValueChange={(v) => patch({ emergencyFundMan: v })}
              suffix="만원"
              placeholder="예: 1,000"
            />
          </FieldGroup>

          <FieldGroup label="거주 형태" htmlFor="basic-housing">
            <Select
              value={state.housingType || undefined}
              onValueChange={(v) => patch({ housingType: v })}
            >
              <SelectTrigger id="basic-housing" className="h-14 text-[16px]">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {HOUSING_OPTIONS.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </Modal>
    </WizardShell>
  );
}

/* ------------------------------------------------------------------ */

/** Persist the in-memory state to the basic slice (deriving hasDependents). */
function persist(state: BasicState): void {
  const slice: PersistedBasic = {
    ...state,
    // store age as a digit string (readProfile coerces it back to a number)
    age: onlyDigits(state.age),
    hasDependents: state.dependentsCount > 0,
  };
  write(STORAGE_KEY, slice);
}

const GENDER_LABEL: Record<Gender, string> = {
  female: "여성",
  male: "남성",
  other: "기타",
};

function SummaryCard({
  age,
  gender,
  jobLabel,
  incomeMan,
  dependents,
}: {
  age: number | null;
  gender: Gender | null;
  jobLabel: string | null;
  incomeMan: number | null;
  dependents: number;
}) {
  const parts: string[] = [];
  if (age !== null) parts.push(`${age}세`);
  if (gender) parts.push(GENDER_LABEL[gender]);
  if (jobLabel) parts.push(jobLabel);

  return (
    <div className="rounded-3xl bg-brand-50/60 px-6 py-5">
      <p className="text-[13px] font-semibold text-brand-600">입력 요약</p>
      {parts.length === 0 && incomeMan === null && dependents === 0 ? (
        <p className="mt-2 text-[15px] text-neutral-400">
          위에서 정보를 입력하면 여기 정리돼요.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-1.5">
          <p className="text-[17px] font-bold text-neutral-900">
            {parts.length > 0 ? parts.join(" · ") : "기본 정보 입력 중"}
          </p>
          <p className="text-[14px] text-neutral-600 tabular-nums">
            {incomeMan !== null ? `월 소득 ${incomeMan.toLocaleString()}만원` : "월 소득 미입력"}
            {" · "}
            부양가족 {dependents}명
          </p>
        </div>
      )}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-neutral-300">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default InputBasic;
