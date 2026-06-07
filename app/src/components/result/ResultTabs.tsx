/**
 * `ResultTabs` — thin wrapper around the UI primitive Tabs that locks the
 * Result page to exactly four tabs (대시보드 · 상세 · 리포트 · 체크).
 *
 * The wrapper exists so the page itself can stay declarative: the parent
 * only needs to pass the active tab id and the four rendered panels, and
 * never has to repeat the tab labels or trigger styling rules.
 */

import type { ReactNode } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";

export type ResultTabId = "dashboard" | "detail" | "report" | "checklist";

export interface ResultTabsProps {
  value: ResultTabId;
  onValueChange: (next: ResultTabId) => void;
  dashboard: ReactNode;
  detail: ReactNode;
  report: ReactNode;
  checklist: ReactNode;
}

const TAB_LABELS: Record<ResultTabId, string> = {
  dashboard: "대시보드",
  detail: "상세",
  report: "리포트",
  checklist: "체크",
};

const TAB_ORDER: ResultTabId[] = ["dashboard", "detail", "report", "checklist"];

export function ResultTabs({
  value,
  onValueChange,
  dashboard,
  detail,
  report,
  checklist,
}: ResultTabsProps) {
  const panels: Record<ResultTabId, ReactNode> = {
    dashboard,
    detail,
    report,
    checklist,
  };

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as ResultTabId)}
      className="flex flex-col gap-0"
    >
      <TabsList
        aria-label="결과 화면 탭"
        className="sticky top-[60px] z-20 bg-neutral-50/95 backdrop-blur-sm"
      >
        {TAB_ORDER.map((id) => (
          <TabsTrigger key={id} value={id} className="flex-1">
            {TAB_LABELS[id]}
          </TabsTrigger>
        ))}
      </TabsList>
      {TAB_ORDER.map((id) => (
        <TabsContent key={id} value={id} className="space-y-4">
          {panels[id]}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default ResultTabs;
