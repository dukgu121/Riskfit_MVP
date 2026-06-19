/**
 * `WizardShell` — the WEB-native layout for the 5-step 입력 위저드 (p4–p7 + 보험).
 *
 * Direction (PO, 2026-06-14): RiskFit is a desktop WEB app, not a phone mockup.
 * The old `StepHeader` / `StepFooter` pair assumed a fixed 480px phone column
 * (sticky `-mx-5` header, `fixed inset-x-0 bottom-0` footer). That fights the
 * shared `AppShell` (sticky web header + centred container), so the wizard gets
 * a web-native shell here:
 *
 *   ┌ AppShell (sticky RiskFit header, maxWidth≈600) ─────────────┐
 *   │  ‹step N/5› + thin Progress (same visual as StepHeader)      │
 *   │  H1 title  ·  optional subtitle                              │
 *   │  …sections (calm white cards, lots of whitespace)…           │
 *   │  ─ in-flow footer: helper text + one primary CTA (fullWidth) │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Single primary CTA (`Button variant="default" fullWidth`), one brand accent,
 * tabular numbers — matching the gold reference (`ProtoResultSummary`). The CTA
 * sits in the normal flow (not a fixed bar) so it reads as a web page, not an
 * app screen. Back is handled by the AppShell header chevron (`backTo`).
 */

import type { ReactNode } from "react";
import { motion } from "motion/react";

import { AppShell } from "../layout/AppShell";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

export interface WizardShellProps {
  /** 1-based step number within the 5-step input flow. */
  step: number;
  /** Total steps — the input wizard is 5 (기본/건강/생활/가족력/보험). */
  total?: number;
  /** Small caption above the title (e.g. "기본 정보"). Optional. */
  eyebrow?: ReactNode;
  /** Screen heading (H1). */
  title: ReactNode;
  /** Optional supporting line under the title. */
  subtitle?: ReactNode;
  /** Back target for the AppShell header chevron. */
  backTo: string;
  /** Section content. */
  children: ReactNode;

  /* ---- footer CTA ---- */
  /** Enable / disable the primary CTA. */
  canContinue: boolean;
  /** Called when the CTA is pressed. */
  onNext: () => void;
  /** CTA label (default "다음"). */
  nextLabel?: ReactNode;
  /** Helper text shown above the CTA when `canContinue=false`. */
  helperText?: ReactNode;
  /** Content max width (default 600 for single-column wizard screens). */
  maxWidth?: number;
}

export function WizardShell({
  step,
  total = 5,
  eyebrow,
  title,
  subtitle,
  backTo,
  children,
  canContinue,
  onNext,
  nextLabel = "다음",
  helperText,
  maxWidth = 600,
}: WizardShellProps) {
  const percent = Math.round((step / total) * 100);

  return (
    <AppShell backTo={backTo} brandTo="/onboarding" maxWidth={maxWidth}>
      {/* Step progress */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold tabular-nums text-brand-500">
            STEP {step}
            <span className="text-neutral-300"> / {total}</span>
          </span>
          <span className="text-[13px] font-medium tabular-nums text-neutral-400">
            {percent}%
          </span>
        </div>
        <Progress
          value={percent}
          className="mt-2.5 h-1.5"
          aria-label={`진행률 ${percent}%`}
        />
      </div>

      {/* Heading */}
      <div className="mt-7">
        {eyebrow != null && (
          <span className="text-[14px] font-semibold text-brand-500">
            {eyebrow}
          </span>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[30px]"
        >
          {title}
        </motion.h1>
        {subtitle != null && (
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="mt-8 flex flex-col gap-5">{children}</div>

      {/* In-flow footer CTA */}
      <div className="mt-10">
        {!canContinue && helperText != null ? (
          <p className="mb-3 text-center text-[13px] font-medium text-neutral-400">
            {helperText}
          </p>
        ) : null}
        <Button
          type="button"
          variant="default"
          fullWidth
          disabled={!canContinue}
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      </div>
    </AppShell>
  );
}

export default WizardShell;
