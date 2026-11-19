---
title: 번역 길이·잘림 검사 (문자열 길이별 확장률과 플랫폼 의사 로캘)
aka: [Translation Length Testing, Text Expansion Testing, Truncation Check, Pseudo-locale en-XA ar-XB, Double-Length Pseudolanguage, 번역 확장 검사]
category: ui-ux
group: writing
level: intermediate
summary: 번역 후 늘어나는 텍스트로 생기는 잘림·넘침을 번역 전에 찾기 위해, 짧은 문자열일수록 더 크게 늘리는 길이별 확장률(W3C 가 인용한 IBM 수치)과 Android·Xcode·FormatJS 의 의사 로캘을 쓰는 방법.
tags: [i18n, l10n, pseudo-localization, text-expansion, truncation, qa, android, xcode, formatjs]
related: [ui-ux/icu-messageformat-pseudo-localization, ui-ux/translation-qa-icu-syntax-validation, ui-ux/translation-workflow-xliff-tm, ui-ux/i18n-ux, ui-ux/cjk-typography-line-breaking, ui-ux/visual-regression-testing, ui-ux/responsive-adaptive-container-queries]
sources:
  - https://www.w3.org/International/articles/article-text-size
  - https://developer.android.com/guide/topics/resources/pseudolocales
  - https://developer.apple.com/wwdc20/10219
  - https://formatjs.github.io/docs/tooling/cli/
updatedAt: 2026-11-19
---

의사 번역의 기본(악센트 치환, 괄호, ICU 자리표시자 보존)은 [ICU MessageFormat과 의사 번역](/develop-wiki/knowledge/ui-ux/icu-messageformat-pseudo-localization/), 번역 구문 검사는 [번역 QA 자동화](/develop-wiki/knowledge/ui-ux/translation-qa-icu-syntax-validation/)에 있다. 이 노트는 **길이** 하나만 다룬다.

## 문제

- 모든 문자열을 30% 늘리는 식의 균일한 의사 번역은 **짧은 라벨을 과소평가**한다. W3C 가 인용한 IBM 수치상 짧은 문자열일수록 확장률이 커서 버튼·탭·배지가 잘리기 쉽다.
- 잘림은 대개 말줄임표(`…`)나 `overflow: hidden` 으로 조용히 숨겨져, 스크린샷을 눈으로 봐야만 발견된다.
- 한국어 원문 기준으로 만든 UI 는 영어·독일어 번역에서 넘치고, 영어 원문 기준 UI 는 한·중·일 글자 폭 때문에 예상과 다르게 넘친다.

## 해법

### 1. 길이별 확장률을 쓴다

W3C 국제화 문서가 IBM 가이드에서 인용한 수치(영어 → 유럽 언어 평균 확장):

| 영어 원문 글자 수 | 번역 길이(원문 대비) |
| --- | --- |
| 10 이하 | 200–300% |
| 11–20 | 180–200% |
| 21–30 | 160–180% |
| 31–50 | 140–160% |
| 51–70 | 151–170% |
| 70 초과 | 130% |

- 51–70 구간이 31–50 보다 큰 것은 원문 표 그대로다(오기일 수 있으나 확인하지 못했다).
- 같은 문서: 한·중 글자는 영문 글자 폭의 약 두 배라 글자 수가 적어도 가로 폭이 더 클 수 있다. 태국어·아랍어·데바나가리 등은 **세로 공간**도 더 필요하다.

```ts
// 표의 하한값으로 목표 길이를 정하고 괄호 포함해 채운다
const ratio = (n: number) => (n <= 10 ? 2.0 : n <= 20 ? 1.8 : n <= 30 ? 1.6 : n <= 50 ? 1.4 : n <= 70 ? 1.5 : 1.3);

export function pseudoExpand(s: string): string {
  const len = [...s].length;
  const pad = Math.max(0, Math.ceil(len * ratio(len)) - len - 2);
  return `[${s}${'·'.repeat(pad)}]`;
}
// pseudoExpand('Save')            → "[Save··]"                  4 → 8자
// pseudoExpand('Delete account')  → "[Delete account··········]" 14 → 26자
```

- 위 결과는 Node 24 에서 실행해 확인했다. 41자 문장은 58자(약 141%)가 된다.
- ICU 자리표시자(`{name}`) 보존·악센트 치환은 기존 의사 번역 함수와 합쳐 쓴다.

### 2. 플랫폼 의사 로캘

| 도구 | 이름 | 하는 일 (공식 문서 기준) |
| --- | --- | --- |
| Android | `en-XA` | 악센트 문자 치환, 악센트 없는 텍스트를 덧붙여 확장, 메시지 단위를 괄호로 감쌈 |
| Android | `ar-XB` | 원문을 RTL 방향으로 바꿔 문자 순서를 뒤집음 |
| Xcode | Double Length Pseudolanguage | 모든 컨트롤·라벨의 텍스트를 두 배로 (WWDC20 세션) |
| FormatJS CLI | `xx-LS` | 메시지 끝에 긴 `S` 문자열을 붙임 |
| FormatJS CLI | `en-XA` / `en-XB` | 악센트+괄호 / 뒤집힌 글자+RTL 제어 문자 |

- Android: `build.gradle` 의 debug 빌드 타입에 `pseudoLocalesEnabled true`(Kotlin DSL `isPseudoLocalesEnabled = true`)를 켜고, 개발자 옵션이 켜진 기기(Android 4.3 이상)에서 언어 목록 맨 위로 의사 로캘을 올린다. 문서는 하드코딩 문자열(악센트 없음), 문자열 이어 붙이기(괄호가 여러 개로 갈라짐), BIDI·미러링 문제도 이 방법으로 찾는다고 설명한다.
- Xcode: Scheme 편집 → Run → Options → App Language 에서 고른다. WWDC20 발표는 미리보기 캔버스에서도 같은 언어를 고를 수 있다고 시연한다.
- FormatJS: `formatjs compile --ast --pseudo-locale xx-LS` 처럼 `--ast` 가 필수다. `xx-LS` 는 고정 길이를 붙이므로 짧은 라벨 검사에는 1절의 길이별 확장이 더 엄격하다.

### 3. 잘림을 자동으로 찾는다

- 의사 로캘 빌드로 [시각 회귀 테스트](/develop-wiki/knowledge/ui-ux/visual-regression-testing/)를 돌려 원문 빌드와 비교한다.
- 웹이라면 브라우저 테스트에서 텍스트 요소의 `scrollWidth > clientWidth`(또는 높이)인 요소를 모아 보고하는 방식이 있다. `text-overflow: ellipsis` 로 숨긴 잘림도 이 비교로 드러난다. 이 노트에서는 실행 검증하지 않았다.
- 잘림을 허용할 곳(긴 파일명 등)은 전체 텍스트를 툴팁·`title` 이 아닌 접근 가능한 방법으로 볼 수 있게 하고, 검사 예외 목록에 명시한다.

## 언제 쓰나

- 번역 전 단계(새 화면 개발 중)에 CI 로 돌린다. 번역이 도착한 뒤 고치면 디자인 수정·재번역이 겹친다.
- 버튼·탭·내비게이션·배지·표 머리글처럼 폭이 고정된 곳을 우선 본다.

## 주의·비용

- 확장률은 평균이다. 특정 언어(독일어 합성어, 핀란드어)나 특정 단어는 더 길 수 있다. 실제 번역본으로 다시 확인한다.
- 짧은 문자열을 두세 배로 늘리면 거의 모든 버튼이 깨져 보일 수 있다. 결과를 "줄바꿈 허용 / 축약 금지 / 레이아웃 재설계" 중 무엇으로 대응할지 디자인 규칙을 먼저 정한다([i18n UX](/develop-wiki/knowledge/ui-ux/i18n-ux/)).
- W3C 문서는 공간을 맞추려고 축약어를 쓰기 전에 다시 생각하라고 권한다. 다른 언어는 같은 방식으로 줄일 수 없다.
- 반대로 짧아지는 번역은 빈 공간·정렬 문제를 만든다.
- 확장 문자열로 데이터베이스 필드 길이·서버 검증 한도도 넘을 수 있다(사용자 입력이 아닌 라벨에는 해당 없음).

## 검증 범위

- 확인함: 확장률 표는 W3C 문서 원문 HTML, Android 의사 로캘 이름·동작·설정은 Android Developers 문서, Xcode Double Length 는 WWDC20 "Build localization-friendly layouts using Xcode", FormatJS 의사 로캘은 CLI 문서. `pseudoExpand` 는 Node 에서 실행.
- 확인 못 함: Xcode 의 다른 의사 언어(Accented, Bounded String, Right-to-Left)의 공식 설명 — Apple 문서 페이지에서 해당 절을 찾지 못했다. IBM 원 가이드 문서, 한국어 원문 기준 확장률.
