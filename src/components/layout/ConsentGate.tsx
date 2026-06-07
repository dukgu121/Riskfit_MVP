/**
 * Route guard that ensures the user has accepted the landing-page consent
 * disclaimer before reaching any data-collection or result screen.
 *
 * If consent is missing, we redirect to "/" using `<Navigate replace />` so
 * the bypassed route does not pollute the browser history stack.
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
  /** Where to redirect when consent is missing. Defaults to the landing page. */
  redirectTo?: string;
}

export function ConsentGate({
  children,
  redirectTo = "/",
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
