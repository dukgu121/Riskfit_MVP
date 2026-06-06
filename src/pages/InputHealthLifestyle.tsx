/**
 * Wizard step 3/7 — health & lifestyle profile.
 *
 * Inputs:
 *   · 키 (cm), 몸무게 (kg) — BMI is computed live from these and shown
 *     as a small read-out under the weight field.
 *   · 건강검진 이상 여부, 현재 치료 중인 질병 — segmented yes/no.
 *   · 최근 1년 병원 방문 빈도 — segmented 3-way.
 *   · 흡연, 음주, 운동, 수면, 스트레스, 야근 — segmented chips, each
 *     mapped to the strongly-typed enum in `src/types`.
 *
 * Persistence: `riskfit.profile.health` with a 120ms debounce, same
 * pattern as InputBasic.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FieldGroup } from "../components/wizard/FieldGroup";
import { SegmentedControl } from "../components/wizard/SegmentedControl";
import { StepFooter } from "../components/wizard/StepFooter";
import { StepHeader } from "../components/wizard/StepHeader";
import { Input } from "../components/ui/input";
import { cn } from "../lib/cn";
import { read, write } from "../lib/storage";
import type {
  DrinkingFrequency,
  ExerciseFrequency,
  HospitalVisits,
  OvertimeFrequency,
  SleepDuration,
  SmokingStatus,
  StressLevel,
} from "../types";

const STORAGE_KEY = "riskfit.profile.health";

interface HealthState {
  heightCm: string;
  weightKg: string;
  checkupIssue: boolean | null;
  currentDisease: boolean | null;
  hospitalVisits: HospitalVisits | null;
  smoking: SmokingStatus | null;
  drinking: DrinkingFrequency | null;
  exercise: ExerciseFrequency | null;
  sleep: SleepDuration | null;
  stress: StressLevel | null;
  overtime: OvertimeFrequency | null;
}

function emptyState(): HealthState {
  return {
    heightCm: "",
    weightKg: "",
    checkupIssue: null,
    currentDisease: null,
    hospitalVisits: null,
    smoking: null,
    drinking: null,
    exercise: null,
    sleep: null,
    stress: null,
    overtime: null,
  };
}

function parseDigits(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function computeBmi(heightCm: string, weightKg: string): number | null {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
  const heightM = h / 100;
  if (heightM < 1.2 || heightM > 2.4) return null;
  return Number((w / (heightM * heightM)).toFixed(1));
}

function bmiBand(value: number): { label: string; tone: "ok" | "warn" } {
  if (value < 18.5) return { label: "저체중", tone: "warn" };
  if (value < 23) return { label: "정상", tone: "ok" };
  if (value < 25) return { label: "과체중", tone: "warn" };
  return { label: "비만", tone: "warn" };
}

export function InputHealthLifestyle() {
  const navigate = useNavigate();

  const [state, setState] = useState<HealthState>(() =>
    read<HealthState>(STORAGE_KEY, emptyState()),
  );

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      write(STORAGE_KEY, state);
    }, 120);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [state]);

  const patch = useCallback((partial: Partial<HealthState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const bmi = useMemo(
    () => computeBmi(state.heightCm, state.weightKg),
    [state.heightCm, state.weightKg],
  );

  const heightValid = (() => {
    const h = Number(state.heightCm);
    return state.heightCm !== "" && Number.isFinite(h) && h >= 120 && h <= 230;
  })();
  const weightValid = (() => {
    const w = Number(state.weightKg);
    return state.weightKg !== "" && Number.isFinite(w) && w >= 25 && w <= 250;
  })();

  const canContinue =
    heightValid &&
    weightValid &&
    state.checkupIssue !== null &&
    state.currentDisease !== null &&
    state.hospitalVisits !== null &&
    state.smoking !== null &&
    state.drinking !== null &&
    state.exercise !== null &&
    state.sleep !== null &&
    state.stress !== null &&
    state.overtime !== null;

  const missingLabel = useMemo(() => {
    if (!heightValid) return "키는 120에서 230 사이로 입력해요.";
    if (!weightValid) return "몸무게는 25에서 250 사이로 입력해요.";
    if (state.checkupIssue === null) return "건강검진 이상 여부를 선택해요.";
    if (state.currentDisease === null) return "치료 중인 질병 여부를 선택해요.";
    if (state.hospitalVisits === null) return "병원 방문 빈도를 선택해요.";
    if (state.smoking === null) return "흡연 여부를 선택해요.";
    if (state.drinking === null) return "음주 빈도를 선택해요.";
    if (state.exercise === null) return "운동 빈도를 선택해요.";
    if (state.sleep === null) return "평균 수면을 선택해요.";
    if (state.stress === null) return "스트레스를 선택해요.";
    if (state.overtime === null) return "야근 빈도를 선택해요.";
    return "";
  }, [heightValid, weightValid, state]);

  function handleNext() {
    if (!canContinue) return;
    write(STORAGE_KEY, state);
    navigate("/input/family");
  }

  return (
    <section className="flex-1 flex flex-col">
      <main
        aria-labelledby="step-health-heading"
        className="mx-auto w-full max-w-[480px] px-5 pb-40"
      >
        <StepHeader step={3} onBack={() => navigate("/input/basic")} />

        <div className="mt-6">
          <h2
            id="step-health-heading"
            className="text-2xl font-bold leading-tight tracking-tight text-neutral-900"
          >
            건강 · 생활
          </h2>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {/* -------------------------------------------------- 신체 정보 ---- */}
          <section className="rounded-lg bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-neutral-900">신체 정보</h3>
            <div className="mt-5 flex flex-col gap-5">
              <FieldGroup label="키" htmlFor="health-height">
                <SuffixInput
                  id="health-height"
                  value={state.heightCm}
                  onChange={(v) => patch({ heightCm: parseDigits(v).slice(0, 3) })}
                  suffix="cm"
                />
              </FieldGroup>

              <FieldGroup label="몸무게" htmlFor="health-weight">
                <SuffixInput
                  id="health-weight"
                  value={state.weightKg}
                  onChange={(v) => patch({ weightKg: parseDigits(v).slice(0, 3) })}
                  suffix="kg"
                />
              </FieldGroup>

              {bmi !== null ? <BmiReadout value={bmi} /> : null}
            </div>
          </section>

          {/* -------------------------------------------------- 의료 ---- */}
          <section className="rounded-lg bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-neutral-900">의료 이력</h3>
            <div className="mt-5 flex flex-col gap-5">
              <FieldGroup
                label="최근 1년 건강검진 이상 소견"
                helperText="재검사·정밀검진 안내 포함"
              >
                <SegmentedControl<"yes" | "no">
                  ariaLabel="건강검진 이상 여부"
                  value={
                    state.checkupIssue === null
                      ? undefined
                      : state.checkupIssue
                        ? "yes"
                        : "no"
                  }
                  options={[
                    { value: "yes", label: "있음" },
                    { value: "no", label: "없음" },
                  ]}
                  onChange={(v) => patch({ checkupIssue: v === "yes" })}
                />
              </FieldGroup>

              <FieldGroup label="치료 중인 질병">
                <SegmentedControl<"yes" | "no">
                  ariaLabel="현재 치료 중인 질병 여부"
                  value={
                    state.currentDisease === null
                      ? undefined
                      : state.currentDisease
                        ? "yes"
                        : "no"
                  }
                  options={[
                    { value: "yes", label: "있음" },
                    { value: "no", label: "없음" },
                  ]}
                  onChange={(v) => patch({ currentDisease: v === "yes" })}
                />
              </FieldGroup>

              <FieldGroup label="최근 1년 병원 방문">
                <SegmentedControl<HospitalVisits>
                  ariaLabel="병원 방문 빈도"
                  layout="grid"
                  value={state.hospitalVisits ?? undefined}
                  options={[
                    { value: "visits_1_2", label: "1~2회" },
                    { value: "visits_3_5", label: "3~5회" },
                    { value: "visits_6_plus", label: "6회 이상" },
                  ]}
                  onChange={(v) => patch({ hospitalVisits: v })}
                />
              </FieldGroup>
            </div>
          </section>

          {/* -------------------------------------------------- 생활 ---- */}
          <section className="rounded-lg bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-neutral-900">생활 습관</h3>
            <div className="mt-5 flex flex-col gap-5">
              <FieldGroup label="흡연">
                <SegmentedControl<SmokingStatus>
                  ariaLabel="흡연 여부"
                  value={state.smoking ?? undefined}
                  options={[
                    { value: "no", label: "비흡연" },
                    { value: "yes", label: "흡연" },
                  ]}
                  onChange={(v) => patch({ smoking: v })}
                />
              </FieldGroup>

              <FieldGroup label="음주">
                <SegmentedControl<DrinkingFrequency>
                  ariaLabel="음주 빈도"
                  layout="grid"
                  value={state.drinking ?? undefined}
                  options={[
                    { value: "rare", label: "거의 없음" },
                    { value: "weekly_1_2", label: "주 1~2회" },
                    { value: "weekly_3_plus", label: "주 3회 이상" },
                  ]}
                  onChange={(v) => patch({ drinking: v })}
                />
              </FieldGroup>

              <FieldGroup label="운동">
                <SegmentedControl<ExerciseFrequency>
                  ariaLabel="운동 빈도"
                  layout="grid"
                  value={state.exercise ?? undefined}
                  options={[
                    { value: "weekly_3_plus", label: "주 3회 이상" },
                    { value: "weekly_2", label: "주 2회" },
                    { value: "weekly_1_or_less", label: "주 1회 이하" },
                    { value: "rare", label: "거의 없음" },
                  ]}
                  onChange={(v) => patch({ exercise: v })}
                />
              </FieldGroup>

              <FieldGroup label="평균 수면">
                <SegmentedControl<SleepDuration>
                  ariaLabel="평균 수면 시간"
                  layout="grid"
                  value={state.sleep ?? undefined}
                  options={[
                    { value: "hours_7_plus", label: "7시간 이상" },
                    { value: "hours_6_7", label: "6~7시간" },
                    { value: "under_6", label: "6시간 미만" },
                  ]}
                  onChange={(v) => patch({ sleep: v })}
                />
              </FieldGroup>

              <FieldGroup label="스트레스">
                <SegmentedControl<StressLevel>
                  ariaLabel="스트레스 수준"
                  value={state.stress ?? undefined}
                  options={[
                    { value: "normal", label: "보통" },
                    { value: "high", label: "심함" },
                  ]}
                  onChange={(v) => patch({ stress: v })}
                />
              </FieldGroup>

              <FieldGroup label="야근">
                <SegmentedControl<OvertimeFrequency>
                  ariaLabel="야근 빈도"
                  layout="grid"
                  value={state.overtime ?? undefined}
                  options={[
                    { value: "rare", label: "거의 없음" },
                    { value: "weekly_1_2", label: "주 1~2회" },
                    { value: "weekly_3_plus", label: "주 3회 이상" },
                  ]}
                  onChange={(v) => patch({ overtime: v })}
                />
              </FieldGroup>
            </div>
          </section>
        </div>
      </main>

      <StepFooter
        canContinue={canContinue}
        helperText={!canContinue ? missingLabel : undefined}
        onBack={() => navigate("/input/basic")}
        onNext={handleNext}
      />
    </section>
  );
}

/* ------------------------------------------------------------------
   Local helpers
   ------------------------------------------------------------------ */

interface SuffixInputProps {
  id: string;
  value: string;
  suffix: string;
  onChange: (next: string) => void;
}

function SuffixInput({ id, value, suffix, onChange }: SuffixInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className={cn("pr-12 text-right")}
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

function BmiReadout({ value }: { value: number }) {
  const { label, tone } = bmiBand(value);
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3">
      <div>
        <p className="text-xs font-medium text-neutral-500">BMI</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-neutral-900">
          {value.toFixed(1)}
        </p>
      </div>
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold",
          tone === "ok"
            ? "bg-white text-semantic-success"
            : "bg-white text-semantic-warn",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default InputHealthLifestyle;
