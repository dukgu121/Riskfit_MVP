/**
 * Route guard that requires a signed-in Firebase user.
 *
 * RiskFit의 시작 화면은 `/login`이다. 로그인하지 않은 사용자가 `/`(랜딩)나
 * 입력 마법사 같은 보호된 라우트에 직접 진입하면 `<Navigate replace />`로
 * `/login`으로 돌려보낸다. 우회된 경로는 `state.from`에 실어 보내, 로그인
 * 성공 후 원래 가려던 곳으로 이어줄 수 있게 한다.
 *
 * Firebase가 아직 설정되지 않은 개발 초기 환경(`configured === false`)에서는
 * 로그인 자체가 불가능하므로 사용자를 가두지 않고 그대로 통과시킨다 — 앱의
 * "설정 전에는 localStorage로 동작" 계약과 동일한 태도다.
 *
 * @example
 *   <AuthGate>
 *     <Landing />
 *   </AuthGate>
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../lib/firebase/authContext";

export interface AuthGateProps {
  children: ReactNode;
  /** Where to send logged-out users. Defaults to the login screen. */
  redirectTo?: string;
}

export function AuthGate({ children, redirectTo = "/login" }: AuthGateProps) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;

  // Firebase 미설정 환경에서는 로그인 게이트를 끈다(앱은 localStorage로 동작).
  if (!configured) return <>{children}</>;

  // 첫 auth-state 콜백을 기다리는 동안의 깜빡임 방지. 보통은 RiskfitCloudSync가
  // 전체 화면 로더로 먼저 가려주지만, 단독으로도 안전하도록 둔다.
  if (loading) return null;

  if (!user) {
    return (
      <Navigate to={redirectTo} replace state={{ from }} />
    );
  }

  return <>{children}</>;
}
