/**
 * Local display formatters for the 개선/리포트/Premium lane. Display-only — the
 * scoring layer owns the canonical numbers; these just render them in the Toss
 * 만원/억원 idiom (mirrors the gold reference `formatKrw`).
 */

/** "36,000,000" → "3,600만원" / "150,000,000" → "1.5억원" / small → "9,000원". */
export function formatKrw(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) {
    const eok = n / 100_000_000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억원`;
  }
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`;
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

/** Native-unit suffix for an amount coverage. */
const UNIT_SUFFIX: Record<string, string> = {
  presence: "",
  krw: "",
  krw_per_event: "",
  krw_per_day: " / 일",
  krw_per_month: " / 월",
};

export function unitSuffix(unit: string): string {
  return UNIT_SUFFIX[unit] ?? "";
}
