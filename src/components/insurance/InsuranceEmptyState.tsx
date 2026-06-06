/**
 * Empty state shown on the InputInsurance screen when no insurance
 * has been registered yet.
 *
 * Toss-style: one quiet illustration, one short headline, one short
 * subtitle, and one ghost CTA. No clutter, no marketing, no badges.
 */

import { Plus } from "lucide-react";

import { Button } from "../ui/button";

export interface InsuranceEmptyStateProps {
  onAdd: () => void;
}

export function InsuranceEmptyState({ onAdd }: InsuranceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <h3 className="text-lg font-bold text-neutral-900">
        등록된 보험이 없어요
      </h3>
      <Button
        type="button"
        variant="ghost"
        onClick={onAdd}
        className="mt-6 h-12 px-5 text-[15px] text-neutral-700"
      >
        <Plus className="h-4 w-4" aria-hidden />
        보험 추가
      </Button>
    </div>
  );
}

export default InsuranceEmptyState;
