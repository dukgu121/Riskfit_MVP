/**
 * Route guard that requires the (demo) Premium subscription flag.
 *
 * The Premium loop (p27–p29) is a sanctioned demo paywall: tapping 구독하기 on
 * `/premium` flips `riskfit.premium` via `setPremium(true)`. The lifecycle /
 * premium-report screens then unlock. A user who deep-links straight to a
 * Premium route without subscribing bounces to `/premium` (the paywall), so
 * the gate mirrors `AuthGate` / `ConsentGate` in shape.
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
