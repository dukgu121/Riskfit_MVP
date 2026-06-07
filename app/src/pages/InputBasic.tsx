/**
 * Wizard step 2/7 — collect the basic profile.
 *
 * Inputs (in vertical order):
 *   1. 이름 (선택)
 *   2. 나이
 *   3. 성별 (segmented)
 *   4. 직업군 (select)
 *   5. 월 소득 / 월 지출 / 비상금 (만원)
 *   6. 부양가족 여부 (segmented)
 *   7. 거주 형태 (선택, select)
 *
 * Persistence:
 *   The page mirrors its in-memory state to localStorage under
 *   `riskfit.profile.basic` with a 120ms debounce so navigation away
 *   never loses input — even an accidental refresh comes back to the
 *   same screen.
 *
 * Continue rule:
 *   The CTA enables once every *required* field has a value
 *   (`name` and `housingType` are optional).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FieldGroup } from "../components/wizard/FieldGroup";
import { SegmentedControl } from "../components/wizard/SegmentedControl";
import { StepFooter } from "../components/wizard/StepFooter";
import { StepHeader } from "../components/wizard/StepHeader";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn } from "../lib/cn";
import { read, write } from "../lib/storage";
import type { Gender, JobGroupId } from "../types";

const STORAGE_KEY = "riskfit.profile.basic";

interface BasicState {
  name: string;
  age: string;
  gender: Gender | null;
  jobGroup: JobGroupId | null;
  monthlyIncomeMan: string;
  monthlyExpenseMan: string;
  emergencyFundMan: string;
  hasDependents: boolean | null;
  housingType: string;
}

function emptyState(): BasicState {
  return {
    name: "",
    age: "",
    gender: null,
    jobGroup: null,
    monthlyIncomeMan: "",
    monthlyExpenseMan: "",
    emergencyFundMan: "",
    hasDependents: null,
    housingType: "",
  };
}

const JOB_GROUPS: ReadonlyArray<{ id: JobGroupId; label: string; hint: string }> =
  [
    { id: "student", label: "학생", hint: "재학·휴학 포함" },
    { id: "office", label: "사무직", hint: "실내 근무" },
    { id: "service", label: "서비스직", hint: "고객 응대" },
    { id: "driving", label: "운전직", hint: "장시간 운전" },
    { id: "field", label: "현장직", hint: "야외·생산" },
  ];

const HOUSING_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "owned", label: "자가" },
  { id: "monthly_rent", label: "월세" },
  { id: "jeonse", label: "전세" },
  { id: "family", label: "가족과 함께" },
  { id: "dorm", label: "기숙사·하숙" },
];

function parseDigits(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function formatThousands(raw: string): string {
  if (raw === "") return "";
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("ko-KR").format(n);
}

export function InputBasic() {
  const navigate = useNavigate();

  const [state, setState] = useState<BasicState>(() =>
    read<BasicState>(STORAGE_KEY, emptyState()),
  );

  // Debounced persistence — 120ms is short enough that an instant tab
  // switch still flushes, but long enough that we don't spam JSON.stringify
  // on every keystroke.
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      write(STORAGE_KEY, state);
    }, 120);
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [state]);

  const patch = useCallback((partial: Partial<BasicState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const ageNumber = useMemo(() => Number(state.age), [state.age]);
  const ageValid =
    state.age !== "" && Number.isFinite(ageNumber) && ageNumber >= 14 && ageNumber <= 99;

  const incomeValid = state.monthlyIncomeMan !== "" && Number(state.monthlyIncomeMan) > 0;
  const expenseValid = state.monthlyExpenseMan !== "" && Number(state.monthlyExpenseMan) >= 0;
  const fundValid = state.emergencyFundMan !== "" && Number(state.emergencyFundMan) >= 0;

  const canContinue =
    ageValid &&
    state.gender !== null &&
    state.jobGroup !== null &&
    incomeValid &&
    expenseValid &&
    fundValid &&
    state.hasDependents !== null;

  const missingLabel = useMemo(() => {
    if (!ageValid) return "나이는 14에서 99 사이로 입력해요.";
    if (state.gender === null) return "성별을 선택해요.";
    if (state.jobGroup === null) return "직업군을 선택해요.";
    if (!incomeValid) return "월 소득을 입력해요.";
    if (!expenseValid) return "월 고정 지출을 입력해요.";
    if (!fundValid) return "비상금을 입력해요.";
    if (state.hasDependents === null) return "부양가족 여부를 선택해요.";
    return "";
  }, [ageValid, state.gender, state.jobGroup, incomeValid, expenseValid, fundValid, state.hasDependents]);

  function handleNext() {
    if (!canContinue) return;
    write(STORAGE_KEY, state); // ensure final flush
    navigate("/input/health");
  }

  return (
    <section className="flex-1 flex flex-col">
      <main
        aria-labelledby="step-basic-heading"
        className="mx-auto w-full max-w-[480px] px-5 pb-40"
      >
        <StepHeader step={2} onBack={() => navigate("/")} />

        <div className="mt-6">
          <h2
            id="step-basic-heading"
            className="text-2xl font-bold leading-tight tracking-tight text-neutral-900"
          >
            기본 정보
          </h2>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {/* ---------------------------------------------------- 신상 ---- */}
          <section className="rounded-lg bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-neutral-900">신상</h3>
            <div className="mt-5 flex flex-col gap-5">
              <FieldGroup label="이름" optional htmlFor="basic-name">
                <Input
                  id="basic-name"
                  value={state.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="예: 김민지"
                  autoComplete="off"
                  maxLength={20}
                />
              </FieldGroup>

              <FieldGroup label="나이" htmlFor="basic-age" helperText="만 나이">
                <SuffixInput
                  id="basic-age"
                  value={state.age}
                  onChange={(v) => patch({ age: parseDigits(v).slice(0, 3) })}
                  suffix="세"
                  inputMode="numeric"
                  placeholder="0"
                />
              </FieldGroup>

              <FieldGroup label="성별">
                <SegmentedControl<Gender>
                  ariaLabel="성별"
                  value={state.gender ?? undefined}
                  options={[
                    { value: "female", label: "여성" },
                    { value: "male", label: "남성" },
                    { value: "other", label: "기타" },
                  ]}
                  onChange={(v) => patch({ gender: v })}
                />
              </FieldGroup>

              <FieldGroup label="직업군" htmlFor="basic-job">
                <Select
                  value={state.jobGroup ?? undefined}
                  onValueChange={(v) => patch({ jobGroup: v as JobGroupId })}
                >
                  <SelectTrigger id="basic-job" className="h-14 text-[17px]">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_GROUPS.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        <span className="font-medium text-neutral-900">
                          {j.label}
                        </span>
                        <span className="ml-2 text-xs text-neutral-500">
                          {j.hint}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>
          </section>

          {/* ---------------------------------------------------- 재무 ---- */}
          <section className="rounded-lg bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-neutral-900">재무</h3>
            <div className="mt-5 flex flex-col gap-5">
              <FieldGroup label="월 소득" htmlFor="basic-income" helperText="세후 실수령액">
                <ManWonInput
                  id="basic-income"
                  value={state.monthlyIncomeMan}
                  onChange={(v) => patch({ monthlyIncomeMan: parseDigits(v).slice(0, 9) })}
                />
              </FieldGroup>

              <FieldGroup label="월 고정 지출" htmlFor="basic-expense" helperText="월세·통신·구독 등">
                <ManWonInput
                  id="basic-expense"
                  value={state.monthlyExpenseMan}
                  onChange={(v) => patch({ monthlyExpenseMan: parseDigits(v).slice(0, 9) })}
                />
              </FieldGroup>

              <FieldGroup label="비상금" htmlFor="basic-fund" helperText="당장 꺼내 쓸 수 있는 잔액">
                <ManWonInput
                  id="basic-fund"
                  value={state.emergencyFundMan}
                  onChange={(v) => patch({ emergencyFundMan: parseDigits(v).slice(0, 9) })}
                />
              </FieldGroup>

              <FieldGroup label="부양가족">
                <SegmentedControl<"yes" | "no">
                  ariaLabel="부양가족 여부"
                  value={
                    state.hasDependents === null
                      ? undefined
                      : state.hasDependents
                        ? "yes"
                        : "no"
                  }
                  options={[
                    { value: "yes", label: "있음" },
                    { value: "no", label: "없음" },
                  ]}
                  onChange={(v) => patch({ hasDependents: v === "yes" })}
                />
              </FieldGroup>
            </div>
          </section>

          {/* ---------------------------------------------------- 주거 ---- */}
          <section className="rounded-lg bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-neutral-900">
              주거
              <span className="ml-2 text-[13px] font-normal text-neutral-500">
                (선택)
              </span>
            </h3>
            <div className="mt-5">
              <FieldGroup label="거주 형태" optional htmlFor="basic-housing">
                <Select
                  value={state.housingType || undefined}
                  onValueChange={(v) => patch({ housingType: v })}
                >
                  <SelectTrigger id="basic-housing" className="h-14 text-[17px]">
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
          </section>
        </div>
      </main>

      <StepFooter
        canContinue={canContinue}
        helperText={!canContinue ? missingLabel : undefined}
        onBack={() => navigate("/")}
        onNext={handleNext}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Local input helpers — kept inside this file so they share state    */
/* with the InputBasic page semantics (right-aligned numerics with    */
/* persistent unit suffix per Toss rule 5).                            */
/* ------------------------------------------------------------------ */

interface SuffixInputProps {
  id: string;
  value: string;
  suffix: string;
  inputMode?: "numeric" | "decimal";
  placeholder?: string;
  onChange: (next: string) => void;
}

function SuffixInput({
  id,
  value,
  suffix,
  inputMode = "numeric",
  placeholder = "0",
  onChange,
}: SuffixInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn("pr-14 text-right")}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 right-4 flex items-center",
          "text-[15px] font-medium text-neutral-500",
        )}
      >
        {suffix}
      </span>
    </div>
  );
}

interface ManWonInputProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
}

function ManWonInput({ id, value, onChange }: ManWonInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatThousands(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className={cn("pr-16 text-right")}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 right-4 flex items-center",
          "text-[15px] font-medium text-neutral-500",
        )}
      >
        만원
      </span>
    </div>
  );
}

export default InputBasic;
