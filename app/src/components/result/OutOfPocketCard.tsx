/**
 * `OutOfPocketCard` — single-fact card showing the scenario-based expected
 * out-of-pocket amount ("질병으로 7일 입원 시 약 N만 원").
 *
 * One card, one fact. The big number is the headline; the scenario
 * sentence below is the explanation. No fan-out of treatment cost vs
 * income gap (those live in the detail tab if at all).
 */

import { motion } from "motion/react";

import type { OutOfPocketResult } from "../../types";
import { Card } from "../ui/card";

export interface OutOfPocketCardProps {
  outOfPocket: OutOfPocketResult;
}

export function OutOfPocketCard({ outOfPocket }: OutOfPocketCardProps) {
  // `displayText` is shaped like "약 270만 원" — we split into the amount
  // and the unit so the number can grow to display size without dragging
  // the "만 원" suffix along.
  const match = outOfPocket.displayText.match(/약\s*([\d,]+)만\s*원/);
  const amount = match ? match[1] : `${Math.round(outOfPocket.displayAmount / 10_000)}`;

  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-neutral-600">
        예상 자기부담액
      </p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 flex items-baseline gap-2"
      >
        <span className="text-sm font-medium text-neutral-500 leading-none">
          약
        </span>
        <span
          className="text-4xl font-extrabold text-neutral-900 leading-none tabular-nums"
          style={{ letterSpacing: "-0.02em" }}
        >
          {amount}
        </span>
        <span className="text-xl font-semibold text-neutral-700 leading-none">
          만 원
        </span>
      </motion.div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-700">
        질병 {outOfPocket.days}일 입원 시, 현재 보장으로 메우고 남는 금액.
      </p>
    </Card>
  );
}

export default OutOfPocketCard;
