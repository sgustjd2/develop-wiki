---
title: "CJK 타이포와 줄바꿈 (word-break: keep-all)"
aka: [CJK Typography, word-break keep-all, line-break, overflow-wrap, 한글 줄바꿈, 어절 단위 줄바꿈, text-wrap balance]
category: ui-ux
group: visual
level: intermediate
summary: 한국어·중국어·일본어 텍스트의 줄바꿈 기본 동작과, 한국어에서 어절 단위로 줄을 바꾸려는 word-break:keep-all 과 overflow-wrap 의 조합, 줄 높이·자간·폰트 선택 주의점.
tags: [typography, css, korean, cjk, line-break, i18n, visual-design]
related: [ui-ux/typography-scale-rhythm, ui-ux/web-font-loading-variable-fonts, ui-ux/i18n-ux, ui-ux/korean-ui-writing-guide, ui-ux/responsive-adaptive-container-queries]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/CSS/word-break
  - https://developer.mozilla.org/en-US/docs/Web/CSS/line-break
  - https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap
  - https://www.w3.org/TR/css-text-3/
updatedAt: 2026-11-19
---

## 문제

- CJK 는 단어 사이 공백이 없어 브라우저가 글자 사이에서 줄을 바꿀 수 있다. 한국어는 띄어쓰기가 있어도 기본(`normal`) 상태에서 **어절 중간에서 줄이 끊긴다**. "데이터베/이스" 처럼 읽기 불편한 줄바꿈이 생긴다.
- 반대로 `keep-all` 만 적용하면 긴 어절(URL, 합성어)이 컨테이너를 넘친다.

## 해법

### 1. 속성 정리 (MDN 요약)

| 속성·값 | 효과 |
| --- | --- |
| `word-break: keep-all` | CJK 텍스트 안에서 줄바꿈을 막는다. 공백이 있는 곳에서만 줄이 바뀌고, 비 CJK 텍스트는 `normal` 과 같다 |
| `word-break: break-all` | 모든 글자 사이 줄바꿈을 허용(비 CJK 의 넘침 방지용). CJK 는 이미 글자 사이에서 끊어질 수 있어 CJK 만 있을 때는 차이가 작다 |
| `word-break: break-word` | 사용 중단(deprecated). `overflow-wrap: anywhere` 와 동등한 효과 |
| `overflow-wrap: break-word` / `anywhere` | 넘칠 때만 단어 내부에서 끊기. `anywhere` 는 최소 폭 계산에도 반영 |
| `line-break: strict/normal/loose/anywhere` | CJK 의 금칙(줄 처음·끝에 오면 안 되는 문장부호·작은 가나 등) 엄격도. 일본어·중국어에서 영향이 크고, 한국어 UI 에서는 보통 기본값으로 충분하다 |

MDN 은 `word-break` 가 널리 지원되는 기능(Baseline widely available)이라고 표시하며 `auto-phrase` 는 실험적, `manual` 은 어느 브라우저도 지원하지 않는다고 적는다.

### 2. 한국어 UI 권장 조합

```css
/* 본문·제목·버튼 등 한국어 텍스트 */
:lang(ko) { word-break: keep-all; overflow-wrap: break-word; }

/* 좁은 셀·URL·해시 같은 긴 토큰 */
.token { word-break: normal; overflow-wrap: anywhere; }

/* 제목류는 줄 길이 균형 (지원 여부 확인 후 점진적 적용) */
h1, h2, h3 { text-wrap: balance; }
```

- `keep-all` + `overflow-wrap: break-word` 이면 어절 단위로 줄이 바뀌면서, 한 어절이 한 줄보다 길 때만 안전하게 끊긴다.
- 한글 어절은 영문 단어보다 길어지는 경우가 있어 **좁은 칼럼(모바일, 테이블 셀, 사이드바)** 에서는 keep-all 때문에 줄 오른쪽 여백이 크게 남거나(들쭉날쭉) 넘칠 수 있다. 칼럼 폭이 약 12~15자(em) 미만이라면 `normal` 이 낫다(경험칙, 근거 문서 없음).
- `text-wrap: balance`/`pretty` 는 MDN `word-break` 페이지가 설명하지 않았다. 지원·동작은 `text-wrap` 문서와 대상 브라우저에서 직접 확인한다.
- **렌더링 검증 한계**: 이 노트의 CSS 줄바꿈 결과는 이 작업 환경에서 브라우저로 시각 확인하지 못했다(jsdom 은 레이아웃을 계산하지 않는다). 동작 설명은 MDN 문서에 근거한다. 실제 적용 시 대상 브라우저에서 확인한다.

### 3. 그 밖의 한글 타이포 주의

- **줄 높이**: 한글은 라틴 소문자보다 글자 면이 크고 복잡해 본문 줄 높이를 1.5~1.7 근처로 두는 사례가 흔하다([타이포 스케일](/develop-wiki/knowledge/ui-ux/typography-scale-rhythm/)). 수치는 폰트·크기에 따라 시각적으로 조정한다.
- **자간**: 라틴용 음수 자간을 한글에 그대로 쓰면 뭉친다. 한글 폰트는 자체 간격이 조정되어 있는 경우가 많으니 기본값에서 시작한다.
- **폰트 선택·로딩**: 한글 웹폰트는 용량이 커서 서브셋·가변 폰트·`font-display` 를 고려한다([웹폰트 로딩](/develop-wiki/knowledge/ui-ux/web-font-loading-variable-fonts/)). 라틴과 한글을 섞을 때 `font-family` 에 한글 폰트를 명시해 폴백 차이를 줄인다.
- **혼합 문자**: 숫자·영문 단위(`5MB`)가 줄 끝에서 끊기지 않도록 `white-space: nowrap` 또는 NBSP(`&nbsp;`)를 쓴다.
- **`lang` 속성**: `<html lang="ko">`. 같은 한자가 중·일·한마다 다른 글리프를 쓰므로 `lang` 이 폰트·줄바꿈 선택에 영향을 준다.
- **강조**: 한글 폰트에 이탤릭이 없으면 브라우저가 글자를 억지로 기울여(합성 기울임) 어색해질 수 있다. 굵기나 색으로 대체하는 관행이 흔하다(일반 관행, 근거 문서 없음).

## 언제 쓰나

- 한국어 본문·카드 제목·버튼·토스트 등 모든 한국어 UI 텍스트의 기본 규칙으로.
- 이미 `keep-all` 이 켜진 곳에 번역 문자열(영문·일문)이 섞이는 다국어 화면에서는 `:lang()` 로 범위를 제한한다.

## 체크리스트

- [ ] `:lang(ko)` 에 `word-break: keep-all` + `overflow-wrap: break-word`
- [ ] 긴 URL·코드·고유 식별자 셀은 `overflow-wrap: anywhere`
- [ ] 좁은 칼럼(모바일 320px, 테이블 셀)에서 넘침·과도한 여백 확인
- [ ] 텍스트 200% 확대(WCAG 1.4.4)·리플로우(1.4.10)에서 가려지지 않는다
- [ ] 의사 번역·긴 문자열 스냅샷으로 [시각 회귀 테스트](/develop-wiki/knowledge/ui-ux/visual-regression-testing/)에 포함

## 흔한 실수

- 전역에 `word-break: break-all` 을 적용해 한글·영문 모두 어절 중간에서 끊는다.
- `keep-all` 만 쓰고 넘침 보호(`overflow-wrap`)를 빠뜨린다.
- 고정 폭(px) 컨테이너에 한글 라벨을 넣고 `overflow: hidden` 으로 잘라 의미를 잃는다.
- 줄 수를 `-webkit-line-clamp` 로 줄이면서 전체 텍스트를 접근 가능한 방법(툴팁·펼치기)으로 제공하지 않는다.
