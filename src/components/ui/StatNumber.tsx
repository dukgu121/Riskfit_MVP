import * as React from "react";

import { cn } from "../../lib/cn";

export interface StatNumberProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number | string;
  unit?: string;
  label?: string;
  hint?: string;
  trend?: "up" | "down" | "flat";
  align?: "left" | "center";
  size?: "default" | "lg";
}

const trendStyles: Record<NonNullable<StatNumberProps["trend"]>, string> = {
  up: "text-success-600",
  down: "text-danger-600",
  flat: "text-neutral-500",
};

const valueSize = {
  default: "text-5xl",
  lg: "text-6xl",
} as const;

const unitSize = {
  default: "text-2xl",
  lg: "text-3xl",
} as const;

const StatNumber = React.forwardRef<HTMLDivElement, StatNumberProps>(
  (
    {
      value,
      unit,
      label,
      hint,
      trend,
      align = "left",
      size = "default",
      className,
      ...props
    },
    ref,
  ) => {
    const alignment =
      align === "center" ? "items-center text-center" : "items-start text-left";

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2", alignment, className)}
        {...props}
      >
        {label ? (
          <span className="text-sm font-medium text-neutral-600 leading-none">
            {label}
          </span>
        ) : null}
        <div className="flex items-baseline gap-2 tabular-nums">
          <span
            className={cn(
              "font-extrabold text-neutral-900 tabular-nums tracking-tight leading-none",
              valueSize[size],
            )}
          >
            {value}
          </span>
          {unit ? (
            // `relative top-px` nudges the unit down by 1 device pixel so
            // its visual baseline aligns with the heavier value glyph —
            // tabular numerals sit slightly above the unit's optical
            // baseline at this scale. Intentional 1px correction.
            <span
              className={cn(
                "relative top-px font-semibold text-neutral-700 leading-none",
                unitSize[size],
              )}
            >
              {unit}
            </span>
          ) : null}
        </div>
        {hint ? (
          <span
            className={cn(
              "text-sm leading-snug",
              trend ? trendStyles[trend] : "text-neutral-500",
            )}
          >
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
StatNumber.displayName = "StatNumber";

export { StatNumber };
