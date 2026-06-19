/**
 * p7 「가족력 입력 (4/5)」 (/input/family)
 *
 * 위저드 4단계. 질환별 3-state(없음/있음/모름)로 가족력을 받는다(부모·형제자매
 * 기준). 각 질환 행은 `TriStateRow` 키트 프리미티브를 쓴다.
 *
 * 저장 매핑 → `FamilyHistoryCondition[]` (영속 키 `riskfit.profile.familyHistory`):
 *   · '있음'인 질환의 id를 모은다(암→cancer, 심혈관→cardio, 당뇨→diabetes,
 *     고혈압→hypertension, 기타 유전→cerebrovascular).
 *   · 모든 행이 '모름'이면 ['unknown'].
 *   · '있음'이 하나도 없으면 ['none'] (가족력 없음으로 보고).
 *   · '있음'이 있으면 그 id들만 저장.
 *
 * 데스크톱 WEB 톤: WizardShell(단일 컬럼 ≈600), 흰 카드 위 TriStateRow 스택.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { WizardShell } from "../components/wizard/WizardShell";
import { WizardCard } from "../components/wizard/WizardCard";
import { InfoBanner } from "../components/ui/InfoBanner";
import { TriStateRow, type TriState } from "../components/ui/TriStateRow";
import { read, write } from "../lib/storage";
import { returnSuffix } from "../lib/draft";
import type { FamilyHistoryCondition } from "../types";

const STORAGE_KEY = "riskfit.profile.familyHistory";

/** The 5 family-history questions, each mapped to a canonical enum id. */
const DISEASES: ReadonlyArray<{
  id: Extract<
    FamilyHistoryCondition,
    "cancer" | "cardio" | "diabetes" | "hypertension" | "cerebrovascular"
  >;
  label: string;
  hint: string;
}> = [
  { id: "cancer", label: "암", hint: "위·대장·유방·폐 등" },
  { id: "cardio", label: "심혈관 질환", hint: "협심증·심근경색" },
  { id: "diabetes", label: "당뇨", hint: "1·2형 모두" },
  { id: "hypertension", label: "고혈압", hint: "혈압약 복용 포함" },
  { id: "cerebrovascular", label: "기타 유전질환", hint: "뇌졸중·치매 등" },
];

type DiseaseId = (typeof DISEASES)[number]["id"];
type Answers = Record<DiseaseId, TriState>;

/**
 * Rebuild the per-disease answers from the stored `FamilyHistoryCondition[]`.
 * Every row always carries a value (default 없음) — most people have no family
 * history for most diseases, so this is a sensible, friction-free default and
 * keeps the 3-state selector from ever rendering an empty/ambiguous state.
 */
function loadAnswers(): Answers {
  const stored = read<FamilyHistoryCondition[]>(STORAGE_KEY, []);
  const base = Object.fromEntries(DISEASES.map((d) => [d.id, "none"])) as Answers;

  if (stored.includes("unknown")) {
    for (const d of DISEASES) base[d.id] = "unknown";
    return base;
  }
  // A list of positive disease ids → those are 있음, the rest stay 없음.
  for (const d of DISEASES) {
    if (stored.includes(d.id)) base[d.id] = "yes";
  }
  return base;
}

/** Map the per-disease answers to the stored `FamilyHistoryCondition[]`. */
function toStored(answers: Answers): FamilyHistoryCondition[] {
  const allUnknown = DISEASES.every((d) => answers[d.id] === "unknown");
  if (allUnknown) return ["unknown"];

  const yes = DISEASES.filter((d) => answers[d.id] === "yes").map((d) => d.id);
  if (yes.length > 0) return yes;
  return ["none"];
}

export function InputFamily() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>(loadAnswers);

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      write(STORAGE_KEY, toStored(answers));
    }, 120);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [answers]);

  const setOne = useCallback((id: DiseaseId, value: TriState) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setAll = useCallback((value: TriState) => {
    setAnswers(Object.fromEntries(DISEASES.map((d) => [d.id, value])) as Answers);
  }, []);

  function handleNext() {
    write(STORAGE_KEY, toStored(answers));
    navigate(`/input/insurance${returnSuffix()}`);
  }

  return (
    <WizardShell
      step={4}
      eyebrow="가족력"
      title="가족력을 알려주세요"
      subtitle="부모·형제자매 기준이에요. 해당하는 질환만 ‘있음’으로 바꿔 주세요."
      backTo="/input/lifestyle"
      canContinue
      onNext={handleNext}
    >
      <WizardCard>
        <div className="-my-1 flex flex-col divide-y divide-neutral-100">
          {DISEASES.map((d) => (
            <TriStateRow
              key={d.id}
              label={d.label}
              hint={d.hint}
              value={answers[d.id]}
              onChange={(v) => setOne(d.id, v)}
            />
          ))}
        </div>
      </WizardCard>

      {/* Quick fill */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setAll("none")}
          className="flex-1 rounded-2xl bg-white py-3.5 text-[14px] font-semibold text-neutral-600 shadow-card transition-colors hover:bg-neutral-50 active:bg-neutral-100"
        >
          모두 없음
        </button>
        <button
          type="button"
          onClick={() => setAll("unknown")}
          className="flex-1 rounded-2xl bg-white py-3.5 text-[14px] font-semibold text-neutral-600 shadow-card transition-colors hover:bg-neutral-50 active:bg-neutral-100"
        >
          모두 모름
        </button>
      </div>

      <InfoBanner tone="neutral">
        가족력은 의료비 예측의 참고 지표예요. 진단을 대체하지 않아요.
      </InfoBanner>
    </WizardShell>
  );
}

export default InputFamily;
