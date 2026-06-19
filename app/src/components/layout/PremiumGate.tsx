/**
 * Route guard that requires the (demo) Premium subscription flag.
 *
 * The Premium loop is a sanctioned demo paywall: tapping 구독하기 on `/premium`
 * flips `riskfit.premium` via `setPremium(true)`, unlocking the lifecycle /
 * premium-report screens. A user who deep-links into a Premium route without
 * subscribing bounces to `/premium`, so this gate mirrors `AuthGate` /
 * `ConsentGate` in shape.
 *
 * @example
 *   <PremiumGate>
 *     <PremiumLifecycle />
 *   </PremiumGate>
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { isPremium } from "../../lib/draft";

export interface PremiumGateProps {
  children: ReactNode;
  /** Where to send non-subscribers. Defaults to the paywall. */
  redirectTo?: string;
}

export function PremiumGate({
  children,
  redirectTo = "/premium",
}: PremiumGateProps) {
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;

  if (!isPremium()) {
    return <Navigate to={redirectTo} replace state={{ from }} />;
  }

  return <>{children}</>;
}

export default PremiumGate;
