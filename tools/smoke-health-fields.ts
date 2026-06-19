/**
 * smoke-health-fields.ts — verifies the NEW health/lifestyle fields
 * (만성질환 · 혈압 · 혈당 · 콜레스테롤 · 식습관) actually feed the weighted risk
 * score, and that the per-factor breakdown stays in parity with the engine.
 *
 * Run: npx tsx tools/smoke-health-fields.ts
 */

import { totalRiskScore } from "../app/src/lib/calc/totalRiskScore";
import { healthRisk } from "../app/src/lib/calc/healthRisk";
import { lifestyleRisk } from "../app/src/lib/calc/lifestyleRisk";
import {
  contributionsForArea,
  realContributionTotal,
} from "../app/src/lib/calc/riskContributions";
import type { UserProfileInput } from "../app/src/types";

const BASELINE: UserProfileInput = {
  age: 30, gender: "male", jobGroup: "office",
  monthlyIncome: 3_000_000, monthlyExpense: 1_500_000, emergencyFund: 6_000_000,
  hasDependents: false,
  heightCm: 175, weightKg: 70, checkupIssue: false, currentDisease: false,
  hospitalVisits: "visits_1_2", familyHistory: ["none"],
  smoking: "no", drinking: "rare", exercise: "weekly_3_plus",
  sleep: "hours_7_plus", stress: "normal", overtime: "rare",
  // NEW fields — all healthy
  chronicConditions: ["none"], bloodPressure: "normal", bloodSugar: "normal",
  cholesterol: "normal", dietHabit: "balanced",
};

const ELEVATED: UserProfileInput = {
  ...BASELINE,
  // ONLY the new fields change — everything else identical
  chronicConditions: ["diabetes", "hypertension"],
  bloodPressure: "caution",
  bloodSugar: "high",
  cholesterol: "caution",
  dietHabit: "high_sodium",
};

function line(label: string, v: unknown) {
  console.log(`  ${label.padEnd(22)} ${String(v)}`);
}

function report(name: string, p: UserProfileInput) {
  const score = totalRiskScore(p, []);
  console.log(`\n[${name}]`);
  line("위험점수 total", score.total + ` (${score.bandLabel})`);
  line("· 건강(health)", score.health);
  line("· 생활습관(lifestyle)", score.lifestyle);
  line("· 직업(job)", score.job);
  line("· 재무(finance)", score.finance);
  return score;
}

console.log("=".repeat(60));
console.log("새 건강필드 → 위험점수 반영 검증 (다른 입력은 전부 동일)");
console.log("=".repeat(60));

const base = report("BASELINE (건강)", BASELINE);
const elev = report("ELEVATED (만성질환+혈당높음+짠음식)", ELEVATED);

console.log("\n--- 변화량 (새 필드 때문에 움직인 점수) ---");
line("건강 Δ", `${base.health} → ${elev.health}  (+${elev.health - base.health})`);
line("생활습관 Δ", `${base.lifestyle} → ${elev.lifestyle}  (+${elev.lifestyle - base.lifestyle})`);
line("위험점수 total Δ", `${base.total} → ${elev.total}  (+${elev.total - base.total})`);

// --- Parity: sum of REAL contributions === engine pre-cap total (clamped) ---
console.log("\n--- 패리티 검증 (상세 기여도 합 == 엔진 점수) ---");
let parityOk = true;
for (const p of [BASELINE, ELEVATED]) {
  const tag = p === BASELINE ? "baseline" : "elevated";
  for (const area of ["health", "lifestyle"] as const) {
    const realSum = realContributionTotal(contributionsForArea(area, p, []));
    const engine = area === "health" ? healthRisk(p) : lifestyleRisk(p);
    const ok = engine === Math.min(realSum, 100);
    parityOk &&= ok;
    line(`${tag}/${area}`, `breakdown합=${realSum}  엔진=${engine}  ${ok ? "✓" : "✗ MISMATCH"}`);
  }
}

const moved = elev.total > base.total && elev.health > base.health && elev.lifestyle > base.lifestyle;
console.log("\n" + "=".repeat(60));
console.log(`결과: 새 필드 점수 반영 = ${moved ? "✅ 동작함" : "❌ 점수 안 움직임"}`);
console.log(`      패리티(상세=엔진) = ${parityOk ? "✅ 일치" : "❌ 불일치"}`);
console.log("=".repeat(60));

if (!moved || !parityOk) process.exit(1);
