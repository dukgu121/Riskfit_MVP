/**
 * 404 fallback. The router wildcard-matches "*" to this page while keeping it
 * inside the authenticated app shell.
 */

import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <main
      aria-labelledby="notfound-heading"
      className="mx-auto flex w-full max-w-[480px] flex-1 items-center justify-center px-6 pb-32 pt-20"
    >
      <div className="text-center space-y-5 max-w-md">
        <p className="text-sm font-semibold text-brand-600 tracking-wider">
          404
        </p>
        <h1
          id="notfound-heading"
          className="text-3xl font-bold text-neutral-900 tracking-tight"
        >
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed">
          주소가 잘못 입력되었거나 더 이상 존재하지 않는 페이지예요. 처음
          화면으로 돌아가 다시 진단을 시작해 주세요.
        </p>
        <Link
          to="/"
          aria-label="처음 화면으로 돌아가기"
          className="inline-flex items-center justify-center h-14 px-6 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600"
        >
          처음으로
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
