/**
 * `ReportTab` — the "리포트" tab body.
 *
 * Behaviour:
 *   1. On first mount, kicks off `generateReport(summary)` which itself
 *      attempts the LLM sidecar with a 5s timeout and falls back to the
 *      deterministic template (`lib/report/template.ts`).
 *   2. While we're waiting, a calm loading state shows so the page never
 *      flashes "empty report → text". The loader respects the same
 *      disclaimer-banner spacing as the rest of the tab.
 *   3. After the report resolves, the body text is rendered as a series
 *      of paragraphs. Whichever path returned the text, we *force* the
 *      canonical disclaimer to be the last line by appending it if it's
 *      missing — `template.ts` already does this, but the LLM path might
 *      not, and the spec says the disclaimer is non-negotiable.
 *   4. The "source" (codex / template) is exposed as a tiny chip so a
 *      reviewer can verify which engine produced the text without
 *      cluttering the user-facing layout.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

import type { GeneratedReport, ReportSummary } from "../../types";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { generateReport } from "../../lib/report/llm";
import { REPORT_DISCLAIMER } from "../../lib/report/template";

export interface ReportTabProps {
  summary: ReportSummary;
}

interface ReportState {
  signature: string;
  report: GeneratedReport;
}

/**
 * Force the canonical disclaimer to be the final sentence of the report.
 * The template already does this, but we never trust the LLM path to.
 */
function withDisclaimer(text: string): string {
  const trimmed = text.trim();
  if (trimmed.endsWith(REPORT_DISCLAIMER)) return trimmed;
  return `${trimmed}${trimmed.endsWith(".") || trimmed.endsWith("다.") ? " " : "\n\n"}${REPORT_DISCLAIMER}`;
}

/**
 * Split the report into:
 *   - `body`: the user-facing paragraphs (every block except the canonical
 *     disclaimer)
 *   - `disclaimer`: the trailing disclaimer sentence, isolated so it can
 *     render in a quieter typography
 *
 * The template path returns one space-joined paragraph that ends with the
 * disclaimer; LLM responses may already split into paragraphs but still
 * end with the disclaimer (we appended it above if missing). In either
 * case, we strip the trailing disclaimer sentence from the body.
 */
function splitReport(text: string): { body: string[]; disclaimer: string } {
  const blocks = text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return { body: [], disclaimer: REPORT_DISCLAIMER };
  }

  const last = blocks[blocks.length - 1];
  if (last === REPORT_DISCLAIMER) {
    return { body: blocks.slice(0, -1), disclaimer: REPORT_DISCLAIMER };
  }
  if (last.endsWith(REPORT_DISCLAIMER)) {
    // Single paragraph that ends with the disclaimer — strip it off the body.
    const trimmed = last.slice(0, -REPORT_DISCLAIMER.length).trim();
    const body = blocks.slice(0, -1);
    if (trimmed.length > 0) body.push(trimmed);
    return { body, disclaimer: REPORT_DISCLAIMER };
  }
  return { body: blocks, disclaimer: REPORT_DISCLAIMER };
}

export function ReportTab({ summary }: ReportTabProps) {
  const summarySignature = JSON.stringify(summary);
  const stableSummary = useMemo(
    () => JSON.parse(summarySignature) as ReportSummary,
    [summarySignature],
  );
  const [reportState, setReportState] = useState<ReportState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const signature = summarySignature;
    generateReport(stableSummary).then((next) => {
      if (cancelled) return;
      setReportState({ signature, report: next });
    });
    return () => {
      cancelled = true;
    };
  }, [stableSummary, summarySignature]);

  const report =
    reportState?.signature === summarySignature ? reportState.report : null;

  if (!report) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="size-6 text-brand-500" strokeWidth={2} />
        </motion.div>
        <p className="text-base font-semibold text-neutral-900">
          리포트를 만들고 있어요
        </p>
        <p className="text-sm text-neutral-600">
          최대 5초 정도 걸려요.
        </p>
      </Card>
    );
  }

  const finalText = withDisclaimer(report.text);
  const { body, disclaimer } = splitReport(finalText);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-600">
          리포트
        </p>
        <Badge
          variant={report.source === "codex" ? "info" : "neutral"}
          size="sm"
        >
          {report.source === "codex" ? "자동 생성" : "요약"}
        </Badge>
      </div>

      <div className="mt-4 space-y-4 text-base leading-relaxed text-neutral-800">
        {body.length === 0 ? (
          <p>{disclaimer}</p>
        ) : (
          body.map((block, index) => <p key={index}>{block}</p>)
        )}
      </div>

      <p className="mt-6 border-t border-neutral-100 pt-4 text-xs leading-relaxed text-neutral-500">
        {disclaimer}
      </p>
    </Card>
  );
}

export default ReportTab;
