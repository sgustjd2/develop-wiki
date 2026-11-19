---
title: Playwright 로 텍스트 잘림 자동 검출 (scrollWidth 비교와 의사 로캘 확장)
aka: [Automated Truncation Detection, Text Overflow Detection, scrollWidth clientWidth check, Pseudo-localization Expansion Test, 텍스트 잘림 검사 자동화]
category: ui-ux
group: writing
level: intermediate
summary: Playwright 로 요소의 scrollWidth·scrollHeight 를 client 크기와 비교하고 의사 로캘로 늘려 다시 재 텍스트 잘림을 CI 에서 찾는 방법. 직접 실행해 확인한 누락(소수점 폭)과 오탐(공백 없는 패딩)을 정리한다.
tags: [i18n, l10n, pseudo-localization, truncation, playwright, testing, qa, css, text-overflow]
related: [ui-ux/translation-length-truncation-testing, ui-ux/icu-messageformat-pseudo-localization, ui-ux/translation-qa-icu-syntax-validation, ui-ux/visual-regression-testing, ui-ux/cjk-typography-line-breaking, ui-ux/responsive-adaptive-container-queries, testing-practice/flaky-e2e-tests]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth
  - https://playwright.dev/docs/evaluating
  - https://www.w3.org/International/articles/article-text-size
updatedAt: 2026-11-19
---

길이별 확장률과 플랫폼 의사 로캘은 [번역 길이·잘림 검사](/develop-wiki/knowledge/ui-ux/translation-length-truncation-testing/)에 있다. 그 노트에서 "실행 검증하지 않았다"고 남긴 `scrollWidth > clientWidth` 검사를 이 노트에서 직접 돌려 확인했다.

## 문제

- `text-overflow: ellipsis`·`-webkit-line-clamp` 로 잘린 텍스트는 화면에 "…"만 남아 리뷰에서 놓치기 쉽다. 시각 회귀 테스트는 원문 화면과 비교하므로, 원문이 짧으면 잘림 자체를 기준으로 삼아 버린다.
- 번역이 도착하기 전에 찾고 싶다. 사람이 화면을 넘겨 보는 방식은 화면 수가 늘면 유지되지 않는다.

## 해법

### 1. 측정 원리

- `scrollWidth` 는 넘친 부분까지 포함한 내용 폭, `clientWidth` 는 보이는 안쪽 폭(패딩 포함, 테두리·스크롤바 제외)이다. 넘치지 않으면 둘이 같다(MDN).
- 그래서 `scrollWidth > clientWidth` 면 가로로, `scrollHeight > clientHeight` 면 세로로(줄 수 제한) 넘친 것이다.
- `overflow` 계산값을 함께 보면 "잘림"(hidden·clip)과 "삐져나옴"(visible)을 구분할 수 있다.

### 2. 검사 코드 (직접 작성, Playwright)

```ts
import { test, expect } from '@playwright/test';

const pseudo = (s: string) => { // 짧을수록 더 늘림 + 괄호
  const r = s.length <= 10 ? 1.0 : s.length <= 20 ? 0.8 : s.length <= 30 ? 0.6 : 0.4;
  return `[${s}${' ~'.repeat(Math.ceil((s.length * r) / 2))}]`; // 공백 섞어 줄바꿈 허용
};

test('번역 확장 시 잘림 없음', async ({ page }) => {
  await page.goto('/settings');
  await page.evaluate((src) => { // 함수는 브라우저에서 실행. 바깥 변수는 인자로 넘긴다
    const fn = new Function(`return ${src}`)();
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = fn(el.textContent ?? ''); });
  }, pseudo.toString());
  const clipped = await page.$$eval('[data-i18n]', (els) => els.filter((el) => {
    const r = document.createRange(); r.selectNodeContents(el);
    const box = el.getBoundingClientRect(), txt = r.getBoundingClientRect();
    return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight
      || txt.width > box.width + 0.5; // 소수점 폭 보완
  }).map((el) => el.textContent));
  expect(clipped).toEqual([]);
});
```

- 실제 앱이라면 텍스트를 DOM 에서 바꾸기보다 의사 로캘 빌드(번역 파일)를 띄우는 편이 정확하다. 위 방식은 빌드 없이 빠르게 돌려 보는 용도다(필자 제안).
- `page.evaluate` 에 넘긴 함수는 페이지 안에서 실행되므로 테스트 쪽 변수를 클로저로 쓸 수 없고 인자로 넘겨야 한다(Playwright 문서).

### 3. 직접 실행한 결과 (Chromium 151 headless, Playwright 1.65.1)

같은 페이지를 원문과 의사 로캘(위 확장률, 공백 없는 `~` 패딩)로 측정했다.

| 요소 | CSS | 원문 | 의사 로캘 |
| --- | --- | --- | --- |
| 버튼 "Save" (120px) | nowrap + ellipsis | 정상 | 정상 |
| 버튼 "Save changes" (120px) | nowrap + ellipsis | 정상 | **가로 잘림** (182 > 118) |
| 탭 "Settings" (90px) | nowrap + hidden | 정상 | **가로 잘림** (150 > 90) |
| 문단 (160px) | line-clamp 2 | **세로 잘림** (67 > 45) | 가로·세로 잘림 |
| 문단 (120px) | 제한 없음 | 정상 | 가로 넘침 (243 > 120) ← 오탐 |
| 라벨 "Notifications" (60px) | nowrap, overflow visible | 가로 넘침 (91 > 60) | 가로 넘침 |

- line-clamp 문단은 원문에서 이미 잘려 있었다. 원문 검사만으로도 잡히는 버그가 있다.
- 제한 없는 문단의 "넘침"은 패딩 `~~~~` 가 공백 없는 한 덩어리라 줄바꿈되지 못해서 생겼다. **의사 로캘 패딩에 공백을 섞어야** 실제 번역(단어 사이 공백)과 비슷해진다. 위 코드처럼 `' ~'` 패딩으로 바꿔 다시 돌리자 이 문단은 정상(줄바꿈으로 높이만 증가)으로 바뀌었고, 나머지 판정(버튼·탭 가로 잘림, line-clamp 세로 잘림, visible 라벨 넘침)은 그대로였다.
- overflow visible 라벨은 잘리진 않지만 옆 요소와 겹친다. 보고는 하되 "잘림"과 "넘침"을 나눠 분류한다.

### 4. 놓치는 경우: 정수 반올림

`scrollWidth`·`clientWidth` 는 정수다(MDN). 자연 폭 134.875px 인 ellipsis 텍스트의 상자 폭을 줄여 가며 쟀다.

| 상자 폭 | scrollWidth / clientWidth | 정수 비교 | Range 폭 비교 |
| --- | --- | --- | --- |
| 134.675px (0.2px 부족) | 135 / 135 | **놓침** | 잡음 |
| 134.475px (0.4px 부족) | 135 / 134 | 잡음 | 잡음 |
| 132.875px (2px 부족) | 135 / 133 | 잡음 | 잡음 |

- 1px 미만 차이는 정수 비교로 놓칠 수 있다. 화면에서는 마지막 글자가 "…"로 바뀐다. `Range.getBoundingClientRect()` 의 소수 폭과 비교해 보완했다. 반올림 방식은 브라우저마다 다를 수 있다(미확인).

## 언제 쓰나

- 고정 폭 UI(버튼, 탭, 내비게이션, 배지, 표 머리글)가 많은 제품의 CI. 번역 전 단계에서 의사 로캘로 돌린다.
- 사용자 데이터(이름, 파일명)가 들어가는 곳은 긴 테스트 데이터로 같은 검사를 돌린다.

## 주의·비용

- 의도된 잘림(긴 파일명 "…")은 허용 목록이 필요하다. `data-allow-truncate` 같은 표시와 함께 전체 텍스트를 볼 수 있는 접근 가능한 수단이 있는지 따로 확인한다.
- 화면에 없는 요소(접힌 메뉴, 닫힌 모달, `display: none`)는 폭이 0 이라 검사되지 않는다. 상태별로 열어서 잰다.
- 폰트 로딩 전에 재면 대체 폰트 폭으로 판정한다. `document.fonts.ready` 를 기다린다.
- 뷰포트 크기마다 결과가 다르다. 대표 폭(모바일·데스크톱) 최소 2개로 돌린다(필자 제안).
- CJK 처럼 확장률이 다른 언어, 세로로 길어지는 언어(악센트·발음 구별 기호)는 의사 로캘만으로 대표되지 않는다. 실제 번역본으로 다시 확인한다.

## 검증 범위

- 확인함: 표 3·4 는 스크래치에서 Playwright 1.65.1 + Chrome for Testing 151.0.7922.34(headless shell)로 직접 실행한 결과. `scrollWidth` 정의와 정수 반환은 MDN, `evaluate` 인자 전달 규칙은 Playwright 문서.
- 확인 못 함: Firefox·WebKit 결과, 위 TypeScript 테스트 파일 그대로의 실행(실험은 같은 논리의 `.mjs` 스크립트로 했다), 확장률 수치 자체의 근거(→ W3C 문서, 기존 노트 참조), 낭독기에서 잘린 텍스트가 어떻게 읽히는지.
