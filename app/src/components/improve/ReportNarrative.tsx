/**
 * `ReportNarrative` — the long-form report body for the final 리포트.
 *
 * AI copy is generated ONCE in `/analyzing` and cached as part of the
 * `AiContentPackage`. This component therefore PREFERS the cached `report` field
 * (`readAiContent(signature)?.report`) and renders it immediately — no per-screen
 * network call, which would 429 the busy-mutexed sidecar. When the cache is
 * absent / signed for a different analysis, it falls back to the legacy pipeline:
 * `generateReport(summary)` attempts the LLM sidecar with a template fallback
 * (`lib/report/template.ts`), cached to `riskfit.report`.
 *
 * Either way the canonical disclaimer is forced to be the last line, and the
 * source chip reads "자동 생성" for AI-authored prose, "요약" for the deterministic
 * template (detected by comparing against `buildTemplateReport`).
 *
 * Mirrors `result/ReportTab`'s split/disclaimer handling, restyled for the web
 * report layout (white card, paragraph stack, source chip, quiet disclaimer).
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

import type { GeneratedReport, ReportSummary } from "../../types";
import { Badge } from "../ui/badge";
import { generateReport } from "../../lib/report/llm";
import { readAiContent, aiContentSignature } from "../../lib/report/aiContent";
import { REPORT_DISCLAIMER, buildTemplateReport } from "../../lib/report/template";
import { STORAGE_KEYS, read, write } from "../../lib/storage";

export interface ReportNarrativeProps {
  summary: ReportSummary;
}

interface CachedReport {
  signature: string;
  report: GeneratedReport;
}

function withDisclaimer(text: string): string {
  const trimmed = text.trim();
  if (trimmed.endsWith(REPORT_DISCLAIMER)) return trimmed;
  return `${trimmed}${trimmed.endsWith(".") || trimmed.endsWith("다.") ? " " : "\n\n"}${REPORT_DISCLAIMER}`;
}

function splitReport(text: string): { body: string[]; disclaimer: string } {
  const blocks = text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
  if (blocks.length === 0) return { body: [], disclaimer: REPORT_DISCLAIMER };

  const last = blocks[blocks.length - 1];
  if (last === REPORT_DISCLAIMER) {
    return { body: blocks.slice(0, -1), disclaimer: REPORT_DISCLAIMER };
  }
  if (last.endsWith(REPORT_DISCLAIMER)) {
    const trimmed = last.slice(0, -REPORT_DISCLAIMER.length).trim();
    const body = blocks.slice(0, -1);
    if (trimmed.length > 0) body.push(trimmed);
    return { body, disclaimer: REPORT_DISCLAIMER };
  }
  return { body: blocks, disclaimer: REPORT_DISCLAIMER };
}

/**
 * Resolve the report body from the ONE AI-content package generated in
 * `/analyzing`. Returns `null` when the cache is missing / stale (different
 * signature) so the caller falls back to the legacy `generateReport` pipeline.
 *
 * The package's `report` is already the final string (grounded AI or template).
 * We label it by comparing against the deterministic template: an exact match is
 * the template ("요약"), anything else is AI-authored prose ("자동 생성").
 */
function readReportFromAiContent(summary: ReportSummary): GeneratedReport | null {
  const text = readAiContent(aiContentSignature(summary))?.report;
  if (!text || !text.trim()) return null;
  const source: GeneratedReport["source"] =
    text.trim() === buildTemplateReport(summary).trim() ? "template" : "codex";
  return { source, text };
}

export function ReportNarrative({ summary }: ReportNarrativeProps) {
  const signature = useMemo(() => JSON.stringify(summary), [summary]);
  const stableSummary = useMemo(
    () => JSON.parse(signature) as ReportSummary,
    [signature],
  );

  const [state, setState] = useState<CachedReport | null>(() => {
    // Prefer the report authored once in /analyzing (no network here).
    const fromAi = readReportFromAiContent(stableSummary);
    if (fromAi) return { signature, report: fromAi };
    // Otherwise hydrate from the legacy report cache if it matches this signature.
    const cached = read<CachedReport | null>(STORAGE_KEYS.report, null);
    if (cached && cached.signature === signature && cached.report?.text) {
      return cached;
    }
    return null;
  });

  useEffect(() => {
    if (state?.signature === signature) return; // already resolved/cached
    let cancelled = false;
    // Prefer the AI package again on a signature change (the initializer only
    // runs on first mount); only hit the network when there's no cached copy.
    // A resolved Promise keeps a single `setState` site (no sync set-in-effect).
    const fromAi = readReportFromAiContent(stableSummary);
    const resolved = fromAi
      ? Promise.resolve(fromAi)
      : generateReport(stableSummary);
    resolved.then((report) => {
      if (cancelled) return;
      const next = { signature, report };
      setState(next);
      // Only the legacy pipeline persists to the report cache; the AI package is
      // already its own cache and must not be shadowed here.
      if (!fromAi) write(STORAGE_KEYS.report, next);
    });
    return () => {
      cancelled = true;
    };
  }, [signature, stableSummary, state?.signature]);

  const report = state?.signature === signature ? state.report : null;

  if (!report) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-7 py-10 text-center shadow-card">
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="size-6 text-brand-500" strokeWidth={2} />
        </motion.div>
        <p className="text-[16px] font-bold text-neutral-900">리포트를 정리하고 있어요</p>
        <p className="text-[14px] text-neutral-500">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  const { body, disclaimer } = splitReport(withDisclaimer(report.text));

  return (
    <div className="rounded-3xl bg-white px-7 py-6 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold text-neutral-900">분석 리포트</h2>
        <Badge variant={report.source === "codex" ? "info" : "neutral"} size="sm">
          {report.source === "codex" ? "AI 작성" : "기본 요약"}
        </Badge>
      </div>

      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-neutral-800">
        {body.length === 0 ? (
          <p>{disclaimer}</p>
        ) : (
          body.map((block, i) => <p key={i}>{block}</p>)
        )}
      </div>

      <p className="mt-6 border-t border-neutral-100 pt-4 text-[12px] leading-relaxed text-neutral-400">
        {disclaimer}
      </p>
    </div>
  );
}

export default ReportNarrative;
