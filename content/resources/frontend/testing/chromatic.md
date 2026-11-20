---
name: Chromatic
url: https://www.chromatic.com
docs: https://www.chromatic.com/docs/
repo: https://github.com/chromaui/chromatic-cli
stars: 344
domain: frontend
category: testing
description: Storybook 스토리(또는 Playwright·Cypress 테스트)를 클라우드 브라우저에서 스냅샷으로 찍어 이전 기준과 비교하는 시각 회귀 테스트·UI 리뷰 서비스. 컴포넌트 화면 변경을 PR 단계에서 검토할 때 쓴다.
pricing: freemium
tags: [visual-test, visual-regression, storybook, ui-review, ci]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Chromatic은 [Storybook](/develop-wiki/frontend/testing/storybook/) 메인테이너 팀이 운영하는 시각 테스트 SaaS다. 빌드할 때마다 모든 스토리를 클라우드 브라우저에서 렌더링해 스냅샷을 찍고, 브랜치별로 저장된 **기준(baseline)** 스냅샷과 픽셀 단위로 비교한다. 바뀐 화면은 웹 UI에서 승인(Accept)하거나 거부(Deny)한다. CLI(`chromatic` npm 패키지, MIT)는 오픈소스지만 비교·저장·리뷰는 유료 플랜이 있는 클라우드 서비스에서 이뤄진다. CLI 최신 릴리스는 v18.15.0(2026-11-18).

- Storybook 외에 [Playwright](/develop-wiki/frontend/testing/playwright/)·[Cypress](/develop-wiki/frontend/testing/cypress/)·Vitest 테스트도 시각 테스트로 바꿀 수 있다.
- 2026-11 기준 요금: Free(월 5,000 스냅샷, Chrome만), Starter $179/월, Pro $399/월, Enterprise 별도 문의. 오픈소스 프로젝트는 문의를 통해 무료 이용 여부를 확인한다([요금](https://www.chromatic.com/pricing)).

## 시작하기
1. chromatic.com 에서 저장소를 연결해 프로젝트를 만들고 **project token** 을 받는다.
2. Storybook 6.5 이상인 프로젝트에서 실행한다.

```bash
npm install --save-dev chromatic
npx chromatic --project-token <your-project-token>   # 첫 빌드 = 기준 스냅샷 생성
```

CI에서는 토큰을 `CHROMATIC_PROJECT_TOKEN` 환경 변수로 넣고 `npx chromatic` 을 실행한다.

## 핵심 사용법
| 개념 | 설명 |
| --- | --- |
| 스냅샷 | 스토리 하나를 특정 브라우저·뷰포트로 렌더링한 이미지. 과금 단위 |
| 기준(baseline) | 승인된 스냅샷. 브랜치별로 추적되고 머지하면 대상 브랜치로 넘어간다 |
| Accept / Deny | 변경을 승인하면 새 기준이 되고, 거부하면 회귀로 표시돼 빌드가 실패한다 |
| TurboSnap | Git 변경과 의존 그래프를 보고 영향받은 스토리만 찍어 스냅샷 수를 줄인다 |
| UI Review | PR 단위로 디자이너·PM이 바뀐 컴포넌트를 보고 코멘트하는 리뷰 화면 |

- **PR 체크로 연결.** GitHub·GitLab 등 CI 연동을 켜 두면 시각 변경이 승인될 때까지 PR 상태 체크가 대기한다.
- **애니메이션·동적 데이터 고정.** 날짜·랜덤 값·애니메이션은 스냅샷마다 달라지므로 스토리에서 값을 고정하거나 Chromatic의 지연·무시 옵션으로 처리한다.

## 언제 쓰나
- 쓸 때: 디자인 시스템·공용 컴포넌트를 여러 팀이 쓰고, CSS 변경이 다른 화면을 깨뜨리는지 PR에서 확인하고 싶을 때.
- 피할 때(대안): 스냅샷 과금이 부담되거나 데이터를 외부에 두기 어렵다면 Playwright의 `toHaveScreenshot()` 같은 자체 스크린샷 비교로 시작한다.

## 공식 문서
- [Storybook과 함께 쓰기](https://www.chromatic.com/docs/storybook/) · [요금](https://www.chromatic.com/pricing) · [chromatic-cli](https://github.com/chromaui/chromatic-cli)
