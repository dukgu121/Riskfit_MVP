/**
 * `ChecklistTab` — actionable follow-ups derived from the coverage-fit
 * weak / caution buckets.
 *
 * Logic:
 *   - `coverageFit.weakCoverages` (fit < 50%) → "이번 주" actions. These
 *     are the holes the user should look at first.
 *   - `coverageFit.cautionCoverages` (50–79%) → "이번 달" actions.
 *   - Everything else is implicitly fine and gets no row.
 *
 * Microcopy is *permanent recommendations* ("한 번 알아보기", "확인하기"),
 * never "지금 가입하기" — RiskFit doesn't recommend specific products.
 *
 * Check state persists to `localStorage` under `riskfit.checklist` so a
 * refresh doesn't wipe progress. Toggling animates a 150ms strikethrough
 * on the label per the spec.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import type { CoverageFit, CoverageTypeId } from "../../types";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/cn";
import { STORAGE_KEYS, read, write } from "../../lib/storage";

export interface ChecklistTabProps {
  coverageFit: CoverageFit;
}

interface ChecklistItem {
  id: string;
  label: string;
  caption: "이번 주" | "다음 분기";
}

/**
 * Static permanent-recommendation copy keyed by coverage type. The phrasing
 * stays in present-tense "한 번 알아보기" form so the line reads as a calm
 * to-do rather than a sales pitch.
 */
const WEAK_COPY: Record<CoverageTypeId, string> = {
  actual_medical: "실손 가입 여부 확인",
  cancer_diagnosis: "암 진단비 보장 확인",
  cerebrovascular_diagnosis: "뇌혈관 진단비 보장 확인",
  cardiac_diagnosis: "심장질환 진단비 보장 확인",
  disease_hospitalization: "질병 입원비 한도 확인",
  accident_hospitalization: "상해 입원비 한도 확인",
  surgery: "수술비 보장 확인",
  income_interruption: "소득중단 보장 확인",
  death: "사망 보장 확인",
  liability: "배상책임 한도 확인",
  other: "기타 보장 확인",
};

const CAUTION_COPY: Record<CoverageTypeId, string> = {
  actual_medical: "실손 보장 다시 보기",
  cancer_diagnosis: "암 진단비 다시 보기",
  cerebrovascular_diagnosis: "뇌혈관 진단비 다시 보기",
  cardiac_diagnosis: "심장질환 진단비 다시 보기",
  disease_hospitalization: "질병 입원비 한도 다시 보기",
  accident_hospitalization: "상해 입원비 한도 다시 보기",
  surgery: "수술비 보장 다시 보기",
  income_interruption: "소득중단 보장 다시 보기",
  death: "사망 보장 다시 보기",
  liability: "배상책임 다시 보기",
  other: "기타 보장 다시 보기",
};

function buildChecklistItems(coverageFit: CoverageFit): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  for (const item of coverageFit.items) {
    if (item.band === "insufficient") {
      items.push({
        id: `weak.${item.type}`,
        label: WEAK_COPY[item.type] ?? `${item.label} 확인`,
        caption: "이번 주",
      });
    } else if (item.band === "caution") {
      items.push({
        id: `caution.${item.type}`,
        label:
          CAUTION_COPY[item.type] ??
          `${item.label} 다시 보기`,
        caption: "다음 분기",
      });
    }
  }
  return items;
}

export function ChecklistTab({ coverageFit }: ChecklistTabProps) {
  const items = useMemo(() => buildChecklistItems(coverageFit), [coverageFit]);
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    read<Record<string, boolean>>(STORAGE_KEYS.checklist, {}),
  );

  // Persist on every change. Cheap: the object only has at most ~5 keys.
  useEffect(() => {
    write(STORAGE_KEYS.checklist, checked);
  }, [checked]);

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-base font-semibold text-neutral-900">
          체크할 항목이 없어요
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          지금은 비어 있는 보장이 없어요.
        </p>
      </Card>
    );
  }

  const totalDone = items.reduce(
    (sum, item) => sum + (checked[item.id] ? 1 : 0),
    0,
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-600">
          체크리스트
        </p>
        <p className="text-xs font-medium text-neutral-500 tabular-nums">
          {totalDone} / {items.length}
        </p>
      </div>

      <ul className="mt-4 divide-y divide-neutral-100">
        {items.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            checked={!!checked[item.id]}
            onCheckedChange={(next) =>
              setChecked((prev) => ({ ...prev, [item.id]: next }))
            }
          />
        ))}
      </ul>

      <p className="mt-5 text-xs leading-relaxed text-neutral-500">
        가입 권유가 아니라 살펴볼 항목이에요.
      </p>
    </Card>
  );
}

interface ChecklistRowProps {
  item: ChecklistItem;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}

function ChecklistRow({ item, checked, onCheckedChange }: ChecklistRowProps) {
  const id = `checklist-${item.id}`;
  return (
    <li className="flex items-center gap-3 py-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
        aria-label={item.label}
      />
      <label
        htmlFor={id}
        className="flex flex-1 cursor-pointer items-center justify-between gap-3"
      >
        <motion.span
          animate={{
            color: checked
              ? "var(--color-neutral-500)"
              : "var(--color-neutral-900)",
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "relative flex-1 text-base leading-snug",
            "transition-[color] duration-150",
          )}
        >
          <span className={cn("relative inline-block")}>
            {item.label}
            <motion.span
              aria-hidden
              initial={false}
              animate={{
                scaleX: checked ? 1 : 0,
                opacity: checked ? 1 : 0,
              }}
              transition={{
                duration: 0.15,
                ease: "easeOut",
              }}
              className="absolute left-0 top-1/2 h-px w-full origin-left bg-neutral-500"
            />
          </span>
        </motion.span>
        <span className="text-xs font-medium tabular-nums text-neutral-500">
          {item.caption}
        </span>
      </label>
    </li>
  );
}

export default ChecklistTab;
