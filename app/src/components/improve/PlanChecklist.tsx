/**
 * `PlanChecklist` — an actionable 개선 체크리스트 for p24. One row per fillable
 * improvement item (the user's real gaps), checkable, with progress persisted to
 * the SAME `riskfit.checklist` storage the result `ChecklistTab` uses — so a
 * box ticked here stays ticked there and vice-versa.
 *
 * Microcopy is calm "확인하기/알아보기" wording — RiskFit never says "지금 가입".
 * Toss tone: a white card, a N/total counter, a 150ms strikethrough on check.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import type { ImprovementItem } from "../../lib/calc/improvement";
import type { CoverageTypeId } from "../../types";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/cn";
import { STORAGE_KEYS, read, write } from "../../lib/storage";
import { formatKrw, unitSuffix } from "./format";

/** Calm action phrasing keyed by coverage type (mirrors result/ChecklistTab). */
const ACTION_COPY: Partial<Record<CoverageTypeId, string>> = {
  actual_medical: "실손 가입 여부 확인하기",
  cancer_diagnosis: "암 진단비 한도 확인하기",
  disease_hospitalization: "질병 입원비 한도 확인하기",
  accident_hospitalization: "상해 입원비 한도 확인하기",
  surgery: "수술비 보장 확인하기",
  income_interruption: "소득중단 보장 알아보기",
};

export interface PlanChecklistProps {
  items: ImprovementItem[];
  className?: string;
}

export function PlanChecklist({ items, className }: PlanChecklistProps) {
  // Reuse the SAME storage key + id scheme (`weak.<type>` / `caution.<type>`)
  // as result/ChecklistTab so progress is shared across screens.
  const rows = useMemo(
    () =>
      items.map((item) => ({
        id: `${item.band === "insufficient" ? "weak" : "caution"}.${item.type}`,
        label: ACTION_COPY[item.type] ?? `${item.label} 확인하기`,
        meta: item.presence
          ? "가입 권장"
          : `권장 ${formatKrw(item.standard ?? 0)}${unitSuffix(item.unit)}`,
      })),
    [items],
  );

  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    read<Record<string, boolean>>(STORAGE_KEYS.checklist, {}),
  );

  useEffect(() => {
    write(STORAGE_KEYS.checklist, checked);
  }, [checked]);

  const done = rows.reduce((sum, row) => sum + (checked[row.id] ? 1 : 0), 0);

  if (rows.length === 0) {
    return (
      <div className={cn("rounded-3xl bg-white px-7 py-8 text-center shadow-card", className)}>
        <p className="text-[16px] font-bold text-neutral-900">채울 보장이 없어요</p>
        <p className="mt-1 text-[14px] text-neutral-500">지금은 비어 있는 보장이 없어요.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-3xl bg-white px-7 py-6 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-neutral-900">개선 체크리스트</h2>
        <span className="text-[13px] font-semibold text-neutral-500 tabular-nums">
          {done} / {rows.length}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-neutral-100">
        {rows.map((row) => (
          <Row
            key={row.id}
            id={row.id}
            label={row.label}
            meta={row.meta}
            checked={!!checked[row.id]}
            onToggle={(next) => setChecked((prev) => ({ ...prev, [row.id]: next }))}
          />
        ))}
      </ul>

      <p className="mt-5 text-[12px] leading-relaxed text-neutral-400">
        가입 권유가 아니라 한 번 살펴볼 항목이에요.
      </p>
    </div>
  );
}

interface RowProps {
  id: string;
  label: string;
  meta: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
}

function Row({ id, label, meta, checked, onToggle }: RowProps) {
  const inputId = `plan-${id}`;
  return (
    <li className="flex items-center gap-3 py-3.5">
      <Checkbox
        id={inputId}
        checked={checked}
        onCheckedChange={(next) => onToggle(next === true)}
        aria-label={label}
      />
      <label
        htmlFor={inputId}
        className="flex flex-1 cursor-pointer items-center justify-between gap-3"
      >
        <motion.span
          animate={{
            color: checked ? "var(--color-neutral-400)" : "var(--color-neutral-900)",
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative text-[15px] font-medium leading-snug"
        >
          <span className="relative inline-block">
            {label}
            <motion.span
              aria-hidden
              initial={false}
              animate={{ scaleX: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-0 top-1/2 h-px w-full origin-left bg-neutral-400"
            />
          </span>
        </motion.span>
        <span className="shrink-0 text-[12px] font-medium tabular-nums text-neutral-400">
          {meta}
        </span>
      </label>
    </li>
  );
}

export default PlanChecklist;
