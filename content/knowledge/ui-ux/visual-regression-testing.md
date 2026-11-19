---
title: 시각 회귀 테스트 (Storybook·Chromatic·Playwright)
aka: [Visual Regression Testing, Visual Testing, Screenshot Testing, toHaveScreenshot, Chromatic, Baseline Snapshot]
category: ui-ux
group: design-system
level: intermediate
summary: UI 의 렌더링 결과 이미지를 기준(baseline)과 비교해 의도치 않은 시각 변경을 잡는 테스트. 컴포넌트 단위(Storybook+Chromatic)와 페이지 단위(Playwright)의 역할과 불안정성 관리.
tags: [testing, visual-regression, storybook, chromatic, playwright, design-system]
related: [ui-ux/design-system-governance, ui-ux/design-system-structure, ui-ux/dark-mode-design, ui-ux/a11y-testing-strategy, ui-ux/icu-messageformat-pseudo-localization, ui-ux/design-tokens]
sources:
  - https://playwright.dev/docs/test-snapshots
  - https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1
  - https://storybook.js.org/docs/writing-tests/visual-testing
  - https://www.chromatic.com/docs/
updatedAt: 2026-11-19
---

## 문제

- 토큰 하나, 공용 CSS 한 줄을 바꾸면 수십 개 화면이 달라질 수 있는데 단위·E2E 테스트는 "보이는 모습"을 검증하지 못한다.
- 마크업 스냅샷은 코드가 바뀌어도 화면이 같으면 실패(오탐)하고, 코드가 같아도 CSS 때문에 화면이 깨지면 통과한다.

## 해법

**렌더링된 픽셀**을 기준 이미지와 비교한다. 기준과 달라지면 사람이 "의도한 변경인가" 를 판정해 승인하거나 고친다.

### 1. 도구별 역할

| 도구 | 단위 | 특징 |
| --- | --- | --- |
| Storybook + Chromatic | 컴포넌트 스토리 | 스토리 하나 = 시각 테스트 하나. 클라우드 브라우저(Chrome·Firefox·Safari·Edge)에서 병렬 촬영, 변경 검토·승인 워크플로, 테마·뷰포트·로캘은 Storybook globals 를 이용한 모드로 조합. TurboSnap 은 변경에 영향받는 스토리만 촬영 |
| Playwright `toHaveScreenshot` | 페이지·요소 | 코드로 제어하는 E2E 안에서 비교. 기준 이미지는 저장소에 커밋. 별도 서비스 없이 사용 |
| 직접 구축 | 자유 | 인프라·승인 UI 를 직접 운영해야 한다 |

Storybook 문서에 따르면 첫 실행이 기준을 만들고 이후 실행이 비교하며, 변경된 스토리는 의도한 것이면 새 기준으로 **승인**, 아니면 수정한다. 마크업(DOM) 스냅샷 테스트와 달리 화면 기반이라는 점을 구분해 설명한다. Chromatic 문서는 `play` 함수가 끝난 뒤 촬영하며, 불안정한 스토리는 "unstable" 로 표시해 빌드를 막지 않는다고 밝힌다(이 노트는 Chromatic 의 기준 승인 저장 방식 상세를 확인하지 않았다).

### 2. Playwright 설정 요점 (공식 문서 기준, 이 환경에서는 실행하지 않음)

```ts
// playwright.config.ts (일부)
export default defineConfig({
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 /* 허용 오차는 팀이 정한다 */ } },
});

// 테스트
await page.goto('/components/button');
await expect(page.getByTestId('button-matrix')).toHaveScreenshot('button-matrix.png', {
  mask: [page.getByTestId('timestamp')],   // 시간·랜덤 값 가림 (기본 마스크 색은 #FF00FF)
});
```

문서에서 확인한 사항:

- 첫 실행은 기준 이미지를 만들고 실패로 보고한다. `npx playwright test --update-snapshots` 로 의도한 변경을 갱신한다.
- 기준 파일명에 브라우저·플랫폼이 붙는다(`…-chromium-darwin.png`). **OS·폰트·렌더링이 다르면 결과가 달라지므로** 기준 생성과 비교는 같은 환경(보통 CI 컨테이너)에서 해야 한다. 로컬 맥에서 만든 기준을 리눅스 CI 가 비교하면 실패한다.
- `toHaveScreenshot` 기본값: `animations: "disabled"`(CSS 애니메이션·전환 정지), `caret: "hide"`, `threshold: 0.2`(픽셀 색 차이 허용), `maxDiffPixels`/`maxDiffPixelRatio` 는 설정값이 기본. `mask`, `stylePath`(촬영 시 적용할 스타일), `fullPage` 옵션이 있다.
- 호버 상태가 찍히지 않도록 마우스를 화면 밖으로 옮긴다(문서의 `page.mouse.move(-1, -1)` 예).

### 3. 불안정(flaky)을 줄이는 법

| 원인 | 대처 |
| --- | --- |
| 폰트 로딩 지연·교체 | 테스트에서 폰트를 로드 완료까지 대기, 시스템 폰트 고정 또는 로컬 호스팅 |
| 애니메이션·전환·스켈레톤 | 애니메이션 비활성(Playwright 기본), 로딩 상태는 별도 스토리로 고정 |
| 날짜·랜덤·외부 이미지 | 목 데이터 고정, 시간 고정, `mask` |
| 렌더링 환경 차이 | 컨테이너에서 촬영·비교, 기준도 같은 환경에서 생성 |
| 스크롤바·캐럿·포커스 | 숨김·고정 |
| 서브픽셀 안티앨리어싱 | 낮은 임계값을 쓰되 오탐 방지용 허용치를 문서화 |

### 4. 무엇을 찍을까

- 디자인 시스템: 컴포넌트 × 상태(기본·hover·focus·disabled·error) × 테마(라이트·다크·브랜드) × 로캘(긴 문자열·의사 번역([ICU 노트](/develop-wiki/knowledge/ui-ux/icu-messageformat-pseudo-localization/))) 조합. 조합이 폭발하므로 대표값을 고른다.
- 앱: 핵심 화면 몇 개와 레이아웃 변경에 민감한 화면.
- 접근성은 시각 테스트가 대체하지 못한다([접근성 테스트 전략](/develop-wiki/knowledge/ui-ux/a11y-testing-strategy/)). 시각 테스트는 "예전과 같다" 만 알려 준다.

## 언제 쓰나

- 디자인 시스템·공용 컴포넌트 라이브러리, 토큰·테마 변경이 잦은 곳. 리팩터링 중 화면이 변하지 않았음을 확인할 때.
- 변화가 잦은 초기 프로토타입에는 승인 비용이 더 커서 이르다.

## 주의·비용

- **승인 피로**: 변경이 많으면 리뷰어가 대충 승인한다. 변경 PR 을 작게 쪼개고, 컴포넌트별 소유자를 정한다([거버넌스](/develop-wiki/knowledge/ui-ux/design-system-governance/)).
- 클라우드 서비스는 촬영 건수에 따라 비용이 든다(TurboSnap 이 절감 수단으로 소개되지만 절감률은 상황 의존). 가격·한도는 공식 페이지에서 확인한다.
- 이미지 기준 파일이 저장소 용량을 키운다. 해상도·개수를 관리하거나 외부 저장을 고려한다.
- 안티앨리어싱 오탐·플랫폼 차이는 완전히 없앨 수 없다. 허용 오차를 너무 크게 잡으면 실제 회귀를 놓친다.

## 체크리스트

- [ ] 기준 생성·비교가 같은 환경(컨테이너)에서 돌아간다
- [ ] 동적 값·애니메이션·폰트가 고정되어 있다
- [ ] PR 에 변경된 이미지가 보이고 승인 규칙(누가, 언제)이 있다
- [ ] 라이트/다크·긴 문자열·상태 변형이 포함되어 있다
- [ ] 허용 오차(`threshold`, `maxDiffPixelRatio`)와 그 이유가 문서화되어 있다

## 흔한 실수

- 로컬에서 갱신한 기준을 커밋해 CI 에서 계속 실패한다.
- 실패할 때마다 `--update-snapshots` 로 일괄 갱신해 회귀가 기준이 된다.
- 전체 페이지를 모두 찍어 사소한 변경에도 많은 diff 가 쏟아진다(요소 단위로 좁힌다).
- 데이터(사용자 이름, 날짜)가 매번 바뀌어 불안정하다.
