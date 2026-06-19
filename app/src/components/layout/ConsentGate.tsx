/**
 * Route guard that ensures the user has accepted the consent disclaimer before
 * reaching any data-collection or result screen.
 *
 * If consent is missing, we redirect to "/onboarding" with `<Navigate replace />`
 * so the bypassed route does not pollute the browser history stack. Consent is
 * captured during onboarding, so unconsented users land back at its start.
 *
 * @example
 *   <ConsentGate>
 *     <InputBasicPage />
 *   </ConsentGate>
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useConsent } from "../../lib/useConsent";

export interface ConsentGateProps {
  children: ReactNode;
  /** Where to redirect when consent is missing. Defaults to onboarding. */
  redirectTo?: string;
}

export function ConsentGate({
  children,
  redirectTo = "/onboarding",
}: ConsentGateProps) {
  const { consent } = useConsent();
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;

  if (!consent) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from }}
      />
    );
  }

  return <>{children}</>;
}
