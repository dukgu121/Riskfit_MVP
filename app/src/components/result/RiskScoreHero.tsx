/**
 * `RiskScoreHero` — the centrepiece score card on the dashboard tab.
 *
 * Layout (Toss-style "numbers are the hero"):
 *   - Big number "36" in `--gray-900`, 48px / Extrabold / tabular-nums
 *   - Unit "점" beside it in `--gray-700`, 20px / Semibold
 *   - Risk band shown in a small badge below the number (band colour goes
 *     here, NEVER on the number itself)
 *   - Decorative doughnut behind/beside the number visualises the score
 *
 * One card, one fact: this card answers "내 전체 위험 점수는 몇 점인가?" —
 * nothing else. BMI / lifestyle splits live on the detail tab.
 */

import { motion } from "motion/react";

import type { RiskBandId, RiskScore } from "../../types";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { cn } from "../../lib/cn";
import { ScoreDoughnut } from "../charts/ScoreDoughnut";

export interface RiskScoreHeroProps {
  riskScore: RiskScore;
  /** Optional name used in the body line. */
  userName?: string;
}

type BadgeVariant = "success" | "warn" | "danger";

const bandStyle: Record<
  RiskBandId,
  {
    variant: BadgeVariant;
    tone: string;
    sentence: (band: string) => string;
  }
> = {
  low: {
    variant: "success",
    tone: "var(--color-semantic-success)",
    sentence: () => "지금은 낮은 위험이에요.",
  },
  medium: {
    variant: "warn",
    tone: "var(--color-semantic-warn)",
    sentence: () => "보통 위험이에요. 보장 몇 가지를 확인해 두세요.",
  },
  high: {
    variant: "danger",
    tone: "var(--color-semantic-danger)",
    sentence: () => "높은 위험이에요. 비어 있는 보장부터 확인하세요.",
  },
};

export function RiskScoreHero({ riskScore, userName }: RiskScoreHeroProps) {
  const band = bandStyle[riskScore.band];
  const greeting = userName ? `${userName}님 위험 점수` : "위험 점수";

  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-neutral-600">{greeting}</p>

      <div className="mt-5 flex items-center gap-6">
        <ScoreDoughnut
          value={riskScore.total}
          size={144}
          color={band.tone}
          ariaLabel={`전체 위험 점수 ${riskScore.total}점, ${riskScore.bandLabel}`}
        />

        <div className="flex flex-1 flex-col items-start gap-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-baseline gap-2"
          >
            <span
              className={cn(
                "font-extrabold text-neutral-900 leading-none tabular-nums",
                "text-[48px]",
              )}
              style={{ letterSpacing: "-0.03em" }}
            >
              {riskScore.total}
            </span>
            <span className="text-xl font-semibold text-neutral-700 leading-none">
              점
            </span>
          </motion.div>

          <Badge
            size="default"
            variant={band.variant}
            aria-label={`위험 단계 ${riskScore.bandLabel}`}
          >
            {riskScore.bandLabel}
          </Badge>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-neutral-700">
        {band.sentence(riskScore.bandLabel)}
      </p>
    </Card>
  );
}

export default RiskScoreHero;
