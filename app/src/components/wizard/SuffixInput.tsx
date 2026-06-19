/**
 * `SuffixInput` — a right-aligned numeric `Input` with a persistent unit suffix
 * (세 / cm / kg). The 만원 money fields use the richer `AmountInput` kit
 * primitive; this is for small whole-number physical quantities where a grouped
 * thousands display would be noise. Holds a digit string (the wizard persists
 * numerics as strings so inputs stay controlled across refresh).
 */

import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

export interface SuffixInputProps {
  id?: string;
  value: string;
  suffix: string;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  maxLength?: number;
  onChange: (next: string) => void;
  className?: string;
}

/** Strip everything but digits — the only chars these fields accept. */
// Colocated pure helper (imported by the basic/health wizard steps). Not a
// component; fast-refresh isn't relevant for it.
// eslint-disable-next-line react-refresh/only-export-components
export function onlyDigits(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function SuffixInput({
  id,
  value,
  suffix,
  placeholder = "0",
  inputMode = "numeric",
  maxLength = 3,
  onChange,
  className,
}: SuffixInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(onlyDigits(event.target.value).slice(0, maxLength))}
        placeholder={placeholder}
        className={cn("h-14 pr-12 text-right text-[17px]", className)}
      />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[15px] font-medium text-neutral-500">
        {suffix}
      </span>
    </div>
  );
}

export default SuffixInput;
