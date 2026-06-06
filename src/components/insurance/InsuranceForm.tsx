/**
 * `InsuranceForm` — controlled form for one insurance entry.
 *
 * Mounted inside a `<Dialog>` for both "add" and "edit" flows. The form
 * adapts to the chosen coverage type:
 *
 *   actual_medical             → boolean toggle "있어요 / 없어요"
 *   cancer_diagnosis           → 만원 single-shot payout
 *   disease_hospitalization    → 원/일
 *   accident_hospitalization   → 원/일
 *   surgery                    → 만원 / 1회
 *   income_interruption        → 원/월
 *   death                      → 만원
 *   liability                  → 만원
 *   other                      → 만원
 *
 * The form keeps its working state in 만원 (or raw 원 for /일·/월) — the
 * page converts to canonical 원 on submit via `toStoredAmount`.
 */

import { useState } from "react";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FieldGroup } from "../wizard/FieldGroup";
import { SegmentedControl } from "../wizard/SegmentedControl";
import { cn } from "../../lib/cn";
import {
  COVERAGE_TYPES,
  coverageInputMode,
  defaultAmountUnit,
  emptyInsuranceForm,
  fromStoredAmount,
  insuranceFormSchema,
  toStoredAmount,
  unitSuffixForType,
} from "../../lib/insuranceForm";
import type { CoverageTypeId, Insurance } from "../../types";

export interface InsuranceFormProps {
  initial?: Insurance | null;
  onSubmit: (insurance: Insurance) => void;
  onCancel: () => void;
}

interface FormState {
  id: string;
  company: string;
  productName: string;
  coverageType: CoverageTypeId;
  coverageBool: boolean;
  /** Held in *display* unit (만원 or 원/일/월) — see `coverageInputMode`. */
  coverageAmount: string;
  monthlyPremium: string;
}

function fromInsurance(insurance: Insurance): FormState {
  return {
    id: insurance.id,
    company: insurance.company ?? "",
    productName: insurance.productName ?? "",
    coverageType: insurance.coverageType,
    coverageBool: insurance.coverageAmount !== null,
    coverageAmount:
      insurance.coverageAmount !== null && insurance.coverageAmount !== undefined
        ? String(
            fromStoredAmount(insurance.coverageType, insurance.coverageAmount) ??
              "",
          )
        : "",
    monthlyPremium:
      insurance.monthlyPremium && insurance.monthlyPremium > 0
        ? String(Math.round(insurance.monthlyPremium))
        : "",
  };
}

function blankFormState(): FormState {
  const seed = emptyInsuranceForm();
  return {
    id: seed.id,
    company: "",
    productName: "",
    coverageType: seed.coverageType,
    coverageBool: true,
    coverageAmount: "",
    monthlyPremium: "",
  };
}

function parseNonNegativeInt(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw.replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function InsuranceForm({
  initial,
  onSubmit,
  onCancel,
}: InsuranceFormProps) {
  const [state, setState] = useState<FormState>(() =>
    initial ? fromInsurance(initial) : blankFormState(),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mode = coverageInputMode(state.coverageType);
  const unitSuffix = unitSuffixForType(state.coverageType);

  function patch(partial: Partial<FormState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  function handleCoverageTypeChange(next: CoverageTypeId) {
    setState((prev) => ({
      ...prev,
      coverageType: next,
      // Reset payout entries when the kind of value changes so we don't
      // accidentally persist 5,000 만원 of "있어요" boolean.
      coverageAmount: "",
      coverageBool: true,
    }));
  }

  function handleSubmit() {
    const amountInputValue =
      mode === "boolean" ? null : parseNonNegativeInt(state.coverageAmount);
    const monthlyPremiumValue = parseNonNegativeInt(state.monthlyPremium);

    if (mode !== "boolean" && amountInputValue === null) {
      setSubmitError("보장 금액을 숫자로 입력해요.");
      return;
    }

    const parsed = insuranceFormSchema.safeParse({
      id: state.id,
      company: state.company.trim() || undefined,
      productName: state.productName.trim() || undefined,
      coverageType: state.coverageType,
      coverageBool: mode === "boolean" ? state.coverageBool : null,
      coverageAmount: amountInputValue,
      monthlyPremium: monthlyPremiumValue,
    });

    if (!parsed.success) {
      setSubmitError("입력값을 다시 확인해요.");
      return;
    }

    const insurance: Insurance = {
      id: parsed.data.id,
      company: parsed.data.company,
      productName: parsed.data.productName,
      coverageType: parsed.data.coverageType,
      amountUnit: defaultAmountUnit(parsed.data.coverageType),
      coverageAmount:
        mode === "boolean"
          ? state.coverageBool
            ? 1
            : null
          : toStoredAmount(parsed.data.coverageType, amountInputValue),
      monthlyPremium: monthlyPremiumValue ?? undefined,
    };

    onSubmit(insurance);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-5"
    >
      <FieldGroup label="보장 유형" htmlFor="coverage-type">
        <Select
          value={state.coverageType}
          onValueChange={(v) => handleCoverageTypeChange(v as CoverageTypeId)}
        >
          <SelectTrigger id="coverage-type" className="h-14 text-[17px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COVERAGE_TYPES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {mode === "boolean" ? (
        <FieldGroup label="가입 여부">
          <SegmentedControl
            ariaLabel="가입 여부"
            value={state.coverageBool ? "yes" : "no"}
            options={[
              { value: "yes", label: "있음" },
              { value: "no", label: "없음" },
            ]}
            onChange={(v) => patch({ coverageBool: v === "yes" })}
          />
        </FieldGroup>
      ) : (
        <FieldGroup
          label="보장 금액"
          htmlFor="coverage-amount"
          helperText={
            mode === "money_man_won"
              ? "만원 단위. 예: 5,000"
              : undefined
          }
        >
          <AmountInput
            id="coverage-amount"
            value={state.coverageAmount}
            unitSuffix={unitSuffix}
            placeholder="0"
            onChange={(v) => patch({ coverageAmount: v })}
          />
        </FieldGroup>
      )}

      <FieldGroup label="보험사" optional htmlFor="company">
        <Input
          id="company"
          value={state.company}
          onChange={(e) => patch({ company: e.target.value })}
          placeholder="예: 삼성생명"
          maxLength={60}
        />
      </FieldGroup>

      <FieldGroup label="상품명" optional htmlFor="product-name">
        <Input
          id="product-name"
          value={state.productName}
          onChange={(e) => patch({ productName: e.target.value })}
          placeholder="예: 더블플러스 실손"
          maxLength={80}
        />
      </FieldGroup>

      <FieldGroup label="월 보험료" optional htmlFor="monthly-premium">
        <AmountInput
          id="monthly-premium"
          value={state.monthlyPremium}
          unitSuffix="원"
          placeholder="0"
          onChange={(v) => patch({ monthlyPremium: v })}
        />
      </FieldGroup>

      {submitError ? (
        <p className="text-sm font-medium text-semantic-danger">{submitError}</p>
      ) : null}

      <div className="mt-2 flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="h-14 w-[96px] shrink-0 text-base text-neutral-700"
        >
          취소
        </Button>
        <Button type="submit" fullWidth className="h-14 text-[17px]">
          저장
        </Button>
      </div>
    </form>
  );
}

interface AmountInputProps {
  id: string;
  value: string;
  unitSuffix: string;
  placeholder?: string;
  onChange: (next: string) => void;
}

function AmountInput({
  id,
  value,
  unitSuffix,
  placeholder,
  onChange,
}: AmountInputProps) {
  // Strip non-digits before applying — Toss-style "마찰 줄이기".
  function handleChange(raw: string) {
    onChange(raw.replace(/[^\d]/g, ""));
  }

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value === "" ? "" : formatThousands(value)}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        className={cn(unitSuffix ? "pr-16 text-right" : "text-right")}
      />
      {unitSuffix ? (
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 right-4 flex items-center",
            "text-[15px] font-medium text-neutral-500",
          )}
        >
          {unitSuffix}
        </span>
      ) : null}
    </div>
  );
}

function formatThousands(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("ko-KR").format(n);
}

export default InsuranceForm;
