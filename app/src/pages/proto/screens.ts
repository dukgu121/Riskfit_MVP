/**
 * Canonical screen map — the single source of truth shared by the `/proto`
 * preview hub and the router's placeholder route generator.
 *
 * `slug` is the preview path under `/proto/<slug>`; `route` is the real
 * production route.
 *
 * Every screen has a real page module, and `/proto/<slug>` always renders it
 * seeded with sample data, so `done` no longer forks to ComingSoon — it just
 * flags which screens have shipped their final Toss layout (the hub's "완료"
 * badge). Flip a flag here as each screen lands.
 */

export interface ScreenDef {
  slug: string;
  pdf: number;
  title: string;
  /** Eventual production route. */
  route: string;
  done?: boolean;
}

export interface ScreenGroup {
  group: string;
  screens: ScreenDef[];
}

export const SCREEN_GROUPS: ScreenGroup[] = [
  {
    group: "온보딩",
    screens: [
      { slug: "onboarding", pdf: 1, title: "시작 화면", route: "/onboarding" },
      { slug: "onboarding-info", pdf: 2, title: "수집 정보 안내", route: "/onboarding/info" },
      { slug: "onboarding-result-intro", pdf: 3, title: "제공 결과 안내 · 동의", route: "/onboarding/result-intro" },
    ],
  },
  {
    group: "정보 입력",
    screens: [
      { slug: "input-basic", pdf: 4, title: "기본정보 입력", route: "/input/basic" },
      { slug: "input-health", pdf: 5, title: "건강정보 입력", route: "/input/health" },
      { slug: "input-lifestyle", pdf: 6, title: "생활습관 입력", route: "/input/lifestyle" },
      { slug: "input-family", pdf: 7, title: "가족력 입력", route: "/input/family" },
      { slug: "input-insurance", pdf: 8, title: "보험정보 입력 (허브)", route: "/input/insurance" },
    ],
  },
  {
    group: "보험 세부 입력",
    screens: [
      { slug: "insurance-actual-medical", pdf: 9, title: "실손의료비", route: "/input/insurance/actual-medical" },
      { slug: "insurance-cancer", pdf: 10, title: "암진단비", route: "/input/insurance/cancer" },
      { slug: "insurance-disease-hosp", pdf: 11, title: "질병입원비", route: "/input/insurance/disease-hospitalization" },
      { slug: "insurance-accident-hosp", pdf: 12, title: "상해입원비", route: "/input/insurance/accident-hospitalization" },
      { slug: "insurance-surgery", pdf: 13, title: "수술비", route: "/input/insurance/surgery" },
      { slug: "insurance-income", pdf: 14, title: "소득중단보장", route: "/input/insurance/income-interruption" },
    ],
  },
  {
    group: "분석 · 결과",
    screens: [
      { slug: "analyzing", pdf: 15, title: "AI 분석 진행", route: "/analyzing" },
      { slug: "result", pdf: 16, title: "분석 결과 요약", route: "/result", done: true },
      { slug: "detail", pdf: 17, title: "상세 리스크 분석", route: "/result/detail" },
      { slug: "detail-lifestyle", pdf: 18, title: "생활습관 상세", route: "/result/detail/lifestyle" },
      { slug: "detail-health", pdf: 19, title: "건강상태 상세", route: "/result/detail/health" },
      { slug: "detail-family", pdf: 20, title: "가족력 상세", route: "/result/detail/family" },
      { slug: "detail-job", pdf: 21, title: "직업 위험도 상세", route: "/result/detail/job" },
      { slug: "detail-finance", pdf: 22, title: "재무 상태 상세", route: "/result/detail/financial" },
    ],
  },
  {
    group: "개선 · 리포트",
    screens: [
      { slug: "improve", pdf: 23, title: "우선 개선 필요 항목", route: "/improve" },
      { slug: "improve-plan", pdf: 24, title: "개선 우선순위 및 계획", route: "/improve/plan" },
      { slug: "improve-preview", pdf: 25, title: "개선 효과 미리보기", route: "/improve/preview" },
      { slug: "report", pdf: 26, title: "최종 분석 리포트", route: "/report" },
    ],
  },
  {
    group: "Premium",
    screens: [
      { slug: "premium", pdf: 27, title: "Premium 구독하기", route: "/premium" },
      { slug: "premium-lifecycle", pdf: 28, title: "생애주기 위험 예측", route: "/premium/lifecycle" },
      { slug: "premium-report", pdf: 29, title: "Premium 리포트", route: "/premium/report" },
    ],
  },
];

export const ALL_SCREENS: ScreenDef[] = SCREEN_GROUPS.flatMap((g) => g.screens);
