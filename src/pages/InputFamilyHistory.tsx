/**
 * Wizard step 4/7 — family medical history multi-select.
 *
 * Seven conditions plus two mutually-exclusive markers ("none" /
 * "unknown"). Selecting "none" or "unknown" auto-clears every other
 * tile and disables them until the user toggles the marker off again.
 *
 * Selection visuals match Toss patterns:
 *   - Selected   → brand-50 background, brand-500 2px border, brand-700 text
 *   - Unselected → white background, neutral-200 1px border, neutral-700 text
 *   - Disabled   → neutral-100 background, neutral-300 dashed border, neutral-400 text
 *
 * Persistence: `riskfit.profile.familyHistory` — a `FamilyHistoryCondition[]`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { StepFooter } from "../components/wizard/StepFooter";
import { StepHeader } from "../components/wizard/StepHeader";
import { cn } from "../lib/cn";
import { read, write } from "../lib/storage";
import type { FamilyHistoryCondition } from "../types";

const STORAGE_KEY = "riskfit.profile.familyHistory";

interface ConditionOption {
  id: FamilyHistoryCondition;
  title: string;
  hint: string;
  /** True for the two mutual-exclusion markers ("none" / "unknown"). */
  exclusive: boolean;
}

const DISEASE_OPTIONS: ReadonlyArray<ConditionOption> = [
  { id: "cancer", title: "암", hint: "위·대장·유방 등", exclusive: false },
  { id: "hypertension", title: "고혈압", hint: "혈압약 복용 포함", exclusive: false },
  { id: "diabetes", title: "당뇨", hint: "1·2형 모두 포함", exclusive: false },
  { id: "cardio", title: "심장 질환", hint: "협심증·심근경색", exclusive: false },
  { id: "cerebrovascular", title: "뇌혈관 질환", hint: "뇌졸중·뇌출혈", exclusive: false },
  { id: "dementia", title: "치매", hint: "알츠하이머 포함", exclusive: false },
];

const MARKER_OPTIONS: ReadonlyArray<ConditionOption> = [
  { id: "none", title: "해당 없음", hint: "가족력 없음", exclusive: true },
  { id: "unknown", title: "모름", hint: "확인 어려움", exclusive: true },
];

export function InputFamilyHistory() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState<FamilyHistoryCondition[]>(() =>
    read<FamilyHistoryCondition[]>(STORAGE_KEY, []),
  );

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      write(STORAGE_KEY, selected);
    }, 120);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [selected]);

  const exclusiveActive = selected.some((s) => s === "none" || s === "unknown");

  const toggle = useCallback((id: FamilyHistoryCondition, isExclusive: boolean) => {
    setSelected((prev) => {
      const isOn = prev.includes(id);

      // Exclusive markers reset the entire selection — they own the screen.
      if (isExclusive) {
        return isOn ? [] : [id];
      }

      // Selecting a disease while an exclusive marker is active clears the marker.
      const next = prev.filter((p) => p !== "none" && p !== "unknown");
      if (isOn) {
        return next.filter((p) => p !== id);
      }
      return [...next, id];
    });
  }, []);

  const canContinue = selected.length > 0;

  function handleNext() {
    if (!canContinue) return;
    write(STORAGE_KEY, selected);
    navigate("/input/insurance");
  }

  return (
    <section className="flex-1 flex flex-col">
      <main
        aria-labelledby="step-family-heading"
        className="mx-auto w-full max-w-[480px] px-5 pb-40"
      >
        <StepHeader step={4} onBack={() => navigate("/input/health")} />

        <div className="mt-6">
          <h2
            id="step-family-heading"
            className="text-2xl font-bold leading-tight tracking-tight text-neutral-900"
          >
            가족력
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            부모·형제자매 기준. 해당하는 항목을 모두 선택해요.
          </p>
        </div>

        {/* ----------------------------------------------- 질환 카드 ---- */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          {DISEASE_OPTIONS.map((option) => (
            <ConditionTile
              key={option.id}
              option={option}
              selected={selected.includes(option.id)}
              disabled={exclusiveActive}
              onToggle={() => toggle(option.id, option.exclusive)}
            />
          ))}
        </div>

        {/* ----------------------------------------------- 마커 카드 ---- */}
        <p className="mt-8 text-[13px] font-medium text-neutral-700">
          또는
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MARKER_OPTIONS.map((option) => (
            <ConditionTile
              key={option.id}
              option={option}
              selected={selected.includes(option.id)}
              disabled={false}
              onToggle={() => toggle(option.id, option.exclusive)}
            />
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-neutral-500">
          가족력은 의료비 예측의 참고 지표이며, 진단을 대체하지 않습니다.
          로그인한 경우 입력 정보는 Firebase에 저장되어 다시 불러올 수 있습니다.
        </p>
      </main>

      <StepFooter
        canContinue={canContinue}
        helperText={!canContinue ? "한 가지 이상 선택해요." : undefined}
        onBack={() => navigate("/input/health")}
        onNext={handleNext}
      />
    </section>
  );
}

interface ConditionTileProps {
  option: ConditionOption;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ConditionTile({
  option,
  selected,
  disabled,
  onToggle,
}: ConditionTileProps) {
  const isInactive = disabled && !selected;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      disabled={isInactive}
      className={cn(
        "flex h-[104px] flex-col items-start justify-end p-5 text-left",
        "rounded-lg",
        "transition-[background-color,border-color,color,transform] duration-150",
        "focus-visible:outline-none",
        selected
          ? "border-2 border-brand-500 bg-brand-50 text-brand-700"
          : isInactive
            ? "cursor-not-allowed border border-dashed border-neutral-300 bg-neutral-100 text-neutral-400"
            : "border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 active:scale-[0.98]",
      )}
    >
      <span className="text-[15px] font-semibold leading-tight">
        {option.title}
      </span>
      <span
        className={cn(
          "mt-1 text-xs leading-tight",
          selected
            ? "text-brand-700/80"
            : isInactive
              ? "text-neutral-400"
              : "text-neutral-500",
        )}
      >
        {option.hint}
      </span>
    </button>
  );
}

export default InputFamilyHistory;
