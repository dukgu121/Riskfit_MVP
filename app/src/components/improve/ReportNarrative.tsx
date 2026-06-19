/**
 * `ReportNarrative` — the long-form report body for the final 리포트 (p26).
 *
 * Reuses the production report pipeline: `generateReport(summary)` attempts the
 * LLM sidecar with a template fallback (`lib/report/template.ts`), and the
 * canonical disclaimer is forced to be the last line. The resolved text is cached
 * to `riskfit.report` so re-entering the report doesn't regenerate it.
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
import { REPORT_DISCLAIMER } from "../../lib/report/template";
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

export function ReportNarrative({ summary }: ReportNarrativeProps) {
  const signature = useMemo(() => JSON.stringify(summary), [summary]);
  const stableSummary = useMemo(
    () => JSON.parse(signature) as ReportSummary,
    [signature],
  );

  const [state, setState] = useState<CachedReport | null>(() => {
    // Hydrate from the cached report if it matches this summary signature.
    const cached = read<CachedReport | null>(STORAGE_KEYS.report, null);
    if (cached && cached.signature === signature && cached.report?.text) {
      return cached;
    }
    return null;
  });

  useEffect(() => {
    if (state?.signature === signature) return; // already resolved/cached
    let cancelled = false;
    generateReport(stableSummary).then((report) => {
      if (cancelled) return;
      const next = { signature, report };
      setState(next);
      write(STORAGE_KEYS.report, next);
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
          {report.source === "codex" ? "자동 생성" : "요약"}
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
