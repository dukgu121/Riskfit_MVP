/**
 * `ListRow` — a tappable row: optional leading slot, title (+ subtitle / right
 * meta), and a trailing chevron. The workhorse for onboarding info lists, the
 * 보험 hub, result drill-down entries, etc.
 *
 * Renders as a react-router `<Link>` when `to` is set, a `<button>` when
 * `onClick` is set, or a plain `<div>` otherwise (static row). Visual + hover
 * affordance mirror the gold reference (`ProtoResultSummary` priority rows):
 * rounded-2xl, neutral-50 hover, neutral-300 chevron.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../lib/cn";

export interface ListRowProps {
  /** Primary label. */
  title: ReactNode;
  /** Secondary line under the title. */
  subtitle?: ReactNode;
  /** Leading visual (icon chip, number badge, etc.). */
  leading?: ReactNode;
  /** Right-aligned meta shown before the chevron (badge, amount, status). */
  meta?: ReactNode;
  /** Navigate here (renders a Link). */
  to?: string;
  /** Click handler (renders a button) — ignored when `to` is set. */
  onClick?: () => void;
  /** Hide the trailing chevron (e.g. static info rows). */
  hideChevron?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function ListRow({
  title,
  subtitle,
  leading,
  meta,
  to,
  onClick,
  hideChevron = false,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: ListRowProps) {
  const interactive = !disabled && (Boolean(to) || Boolean(onClick));

  const inner = (
    <>
      {leading != null && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold text-neutral-900">
          {title}
        </span>
        {subtitle != null && (
          <span className="mt-0.5 block truncate text-[13px] text-neutral-400">
            {subtitle}
          </span>
        )}
      </span>
      {meta != null && (
        <span className="flex shrink-0 items-center gap-1.5 text-right">
          {meta}
        </span>
      )}
      {!hideChevron && interactive && <Chevron />}
    </>
  );

  const base = cn(
    "flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left",
    interactive &&
      "transition-colors hover:bg-neutral-50 active:bg-neutral-100 focus:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    disabled && "opacity-60",
    className,
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={base} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={base}
        aria-label={ariaLabel}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={base} aria-label={ariaLabel}>
      {inner}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 text-neutral-300"
    >
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ListRow;
