/**
 * p8 「가입 보험」 — the insurance HUB (input step 5/5), restyled Toss-web.
 *
 * The PDF's free-form "add policies" list is replaced by a FIXED 6-row overview
 * (one per user-facing 보장 type, OD-11). Each row shows 입력완료 / 미가입 /
 * 미입력 + a band badge, and is a Link into that type's 세부 screen
 * (`/input/insurance/:coverageType`). Persistence happens inside the sub-screens
 * (one type at a time) via `riskfit.insurances`; this page only READS that list
 * and re-derives the row states.
 *
 * The primary CTA "분석 시작" is ALWAYS enabled — a user can analyse with any
 * subset filled in; 미입력 types are simply treated as 공백 (gaps) by the engine.
 *
 * Wrapped in `AppShell` (maxWidth 600, matching the p4–p7 입력 위저드 column).
 * No phone frame.
 */

import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { AppShell } from "../components/layout/AppShell";
import { InfoBanner } from "../components/ui/InfoBanner";
import {
  WizardFooter,
  WizardStepHeader,
} from "../components/insurance/InsuranceWizardChrome";
import { InsuranceHubRow } from "../components/insurance/InsuranceHubRow";
import {
  INSURANCE_CHAIN,
  hubRowState,
  slugForCoverageId,
} from "../components/insurance/coverageSubMeta";
import { read, readProfile, STORAGE_KEYS } from "../lib/storage";
import { returnSuffix } from "../lib/draft";
import type { Insurance, UserProfileInput } from "../types";

export function InputInsurance() {
  const navigate = useNavigate();
  const location = useLocation();

  // Re-read on every entry (incl. returning from a 세부 screen). `location.key`
  // changes on each navigation, so this useMemo re-runs and the rows refresh
  // without a manual refetch — and without setState-in-effect.
  const insurances = useMemo<Insurance[]>(
    () => read<Insurance[]>(STORAGE_KEYS.insurances, []),
    // location.key changes on every navigation → intentionally re-read storage
    // when the user returns from a 세부 screen (cache-bust, not an unused dep).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.key],
  );

  const profile = useMemo<UserProfileInput>(() => readProfile<UserProfileInput>(), []);

  const rows = useMemo(
    () => INSURANCE_CHAIN.map((id) => hubRowState(id, insurances, profile)),
    [insurances, profile],
  );

  const touched = rows.filter((r) => r.status !== "untouched").length;
  const total = rows.length;
  const allTouched = touched === total;

  return (
    <AppShell title="가입 보험" backTo={`/input/family${returnSuffix()}`} brandTo="/onboarding" maxWidth={600}>
      <WizardStepHeader
        eyebrow="입력 5 / 5"
        percent={100}
        trailing={`보장 ${touched} / ${total} 입력`}
      />

      {/* Title */}
      <div className="mt-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="text-[26px] font-bold leading-tight tracking-tight text-neutral-900 lg:text-[30px]"
        >
          가입한 보험을 알려 주세요
        </motion.h1>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
          보장별로 입력하면 적합도를 더 정확히 분석해요. 없는 보장은 비워둬도 괜찮아요.
        </p>
      </div>

      {/* 6-row hub list */}
      <div className="mt-7 rounded-3xl bg-white px-3 py-3 shadow-card sm:px-4 sm:py-4">
        <ul className="flex flex-col">
          {rows.map((row, i) => (
            <li key={row.id}>
              {i > 0 && <div className="mx-3 h-px bg-neutral-100" />}
              <InsuranceHubRow
                row={row}
                to={`/input/insurance/${slugForCoverageId(row.id)}${returnSuffix()}`}
              />
            </li>
          ))}
        </ul>
      </div>

      <InfoBanner tone="neutral" className="mt-4">
        비워 둔 보장은 분석에서 ‘비어 있는 보장’으로 표시돼요. 언제든 다시 입력할 수
        있어요.
      </InfoBanner>

      {/* CTA — always allowed */}
      <div className="mt-9">
        <WizardFooter
          primaryLabel="분석 시작"
          onPrimary={() => navigate(`/analyzing${returnSuffix()}`)}
          helperText={
            allTouched
              ? undefined
              : "지금 분석해도 괜찮아요. 입력한 보장만으로 결과를 만들어요."
          }
        />
      </div>

      <p className="mt-5 text-center text-[12px] leading-relaxed text-neutral-400">
        로그인한 경우 입력 정보는 안전하게 저장돼요. 보험 상품 추천이 아니에요.
      </p>
    </AppShell>
  );
}

export default InputInsurance;
