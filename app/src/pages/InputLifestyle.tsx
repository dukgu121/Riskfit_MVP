/**
 * p6 「생활습관 입력 (3/5)」 (/input/lifestyle)
 *
 * 위저드 3단계. 운동/식습관/흡연/음주/수면/스트레스를 단일선택으로 받는다.
 * 식습관은 새 필드 dietHabit(Agent A가 타입+스키마로 검증)으로 매핑한다.
 * 기존 InputHealthLifestyle의 생활 항목을 이 화면으로 분리해 가져왔다.
 *
 * 데스크톱 WEB 톤: WizardShell(단일 컬럼 ≈600). 4지선다(운동/식습관)는 grid,
 * 2~3지선다(흡연/스트레스/음주/수면)는 row 칩으로 — 화면 내 톤을 통일.
 *
 * 영속화: 생활습관은 health 슬라이스 안에 산다(readProfile이 health를 머지).
 * 별도 키 없이 `riskfit.profile.health`에 **머지**해서 저장(건강 화면 필드 보존).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { WizardShell } from "../components/wizard/WizardShell";
import { WizardCard } from "../components/wizard/WizardCard";
import { FieldGroup } from "../components/wizard/FieldGroup";
import { SegmentedControl } from "../components/wizard/SegmentedControl";
import { read, write } from "../lib/storage";
import { returnSuffix } from "../lib/draft";
import type {
  DietHabit,
  DrinkingFrequency,
  ExerciseFrequency,
  SleepDuration,
  SmokingStatus,
  StressLevel,
} from "../types";

const STORAGE_KEY = "riskfit.profile.health";

interface LifestyleOwned {
  exercise: ExerciseFrequency | null;
  dietHabit: DietHabit | null;
  smoking: SmokingStatus | null;
  drinking: DrinkingFrequency | null;
  sleep: SleepDuration | null;
  stress: StressLevel | null;
}

function loadOwned(): LifestyleOwned {
  const raw = read<Record<string, unknown>>(STORAGE_KEY, {});
  return {
    exercise: (raw.exercise as ExerciseFrequency | null) ?? null,
    dietHabit: (raw.dietHabit as DietHabit | null) ?? null,
    smoking: (raw.smoking as SmokingStatus | null) ?? null,
    drinking: (raw.drinking as DrinkingFrequency | null) ?? null,
    sleep: (raw.sleep as SleepDuration | null) ?? null,
    stress: (raw.stress as StressLevel | null) ?? null,
  };
}

/** Merge lifestyle fields into the shared health slice (keep 건강 fields). */
function persist(owned: LifestyleOwned): void {
  const existing = read<Record<string, unknown>>(STORAGE_KEY, {});
  write(STORAGE_KEY, { ...existing, ...owned });
}

export function InputLifestyle() {
  const navigate = useNavigate();
  const [state, setState] = useState<LifestyleOwned>(loadOwned);

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => persist(state), 120);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [state]);

  const patch = useCallback((partial: Partial<LifestyleOwned>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const canContinue =
    state.exercise !== null &&
    state.dietHabit !== null &&
    state.smoking !== null &&
    state.drinking !== null &&
    state.sleep !== null &&
    state.stress !== null;

  const helperText = !canContinue ? "여섯 항목을 모두 선택해요." : "";

  function handleNext() {
    if (!canContinue) return;
    persist(state);
    navigate(`/input/family${returnSuffix()}`);
  }

  return (
    <WizardShell
      step={3}
      eyebrow="생활습관"
      title="생활습관을 알려주세요"
      subtitle="평소 습관은 장기적인 건강 위험을 가늠하는 데 도움이 돼요."
      backTo="/input/health"
      canContinue={canContinue}
      onNext={handleNext}
      helperText={helperText}
    >
      <WizardCard title="활동 · 식사">
        <FieldGroup label="운동 빈도">
          <SegmentedControl<ExerciseFrequency>
            ariaLabel="운동 빈도"
            layout="grid"
            value={state.exercise ?? undefined}
            options={[
              { value: "weekly_3_plus", label: "주 3회 이상" },
              { value: "weekly_2", label: "주 2회" },
              { value: "weekly_1_or_less", label: "주 1회 이하" },
              { value: "rare", label: "거의 안 함" },
            ]}
            onChange={(v) => patch({ exercise: v })}
          />
        </FieldGroup>

        <FieldGroup label="식습관">
          <SegmentedControl<DietHabit>
            ariaLabel="식습관"
            layout="grid"
            value={state.dietHabit ?? undefined}
            options={[
              { value: "balanced", label: "균형 잡힘" },
              { value: "irregular", label: "불규칙" },
              { value: "high_sodium", label: "짠 음식 위주" },
              { value: "high_fat", label: "기름진 음식 위주" },
            ]}
            onChange={(v) => patch({ dietHabit: v })}
          />
        </FieldGroup>
      </WizardCard>

      <WizardCard title="음주 · 흡연">
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
            value={state.drinking ?? undefined}
            options={[
              { value: "rare", label: "거의 없음" },
              { value: "weekly_1_2", label: "주 1~2회" },
              { value: "weekly_3_plus", label: "주 3회+" },
            ]}
            onChange={(v) => patch({ drinking: v })}
          />
        </FieldGroup>
      </WizardCard>

      <WizardCard title="수면 · 스트레스">
        <FieldGroup label="평균 수면">
          <SegmentedControl<SleepDuration>
            ariaLabel="평균 수면 시간"
            value={state.sleep ?? undefined}
            options={[
              { value: "hours_7_plus", label: "7시간+" },
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
      </WizardCard>
    </WizardShell>
  );
}

export default InputLifestyle;
