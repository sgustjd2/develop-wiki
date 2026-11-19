---
title: 디자인 토큰 (W3C DTCG 포맷)
aka: [Design Tokens, DTCG, Design Tokens Format Module, Design Tokens Community Group, Token Aliasing, Style Dictionary]
category: ui-ux
group: design-system
level: intermediate
summary: 색·타입·간격·모션 같은 디자인 결정을 이름 붙은 데이터로 저장해 디자인 도구와 여러 플랫폼 코드가 같은 원천을 쓰게 하는 방식. W3C DTCG 2025.10 포맷이 공통 JSON 형식이다.
tags: [design-tokens, design-system, dtcg, theming, css-variables]
related: [ui-ux/color-system-semantic-roles, ui-ux/dark-mode-design, ui-ux/design-system-structure, ui-ux/design-dev-handoff, ui-ux/grid-spacing-system]
sources:
  - https://www.designtokens.org/TR/2025.10/format/
  - https://www.designtokens.org/TR/2025.10/color/
  - https://www.designtokens.org/TR/2025.10/resolver/
  - https://m3.material.io/styles/color/roles
  - https://styledictionary.com/info/dtcg/
updatedAt: 2026-11-19
---

## 문제

- Figma 에는 `Primary/500`, CSS 에는 `--brand-blue`, iOS 에는 `UIColor.mainBlue` — 같은 색이 세 이름으로 따로 관리돼 하나만 바뀐다.
- 도구마다 토큰 JSON 형식이 달라 디자인 도구 ↔ 변환 도구 ↔ 코드 사이에 매번 어댑터를 짠다.

## 해법

### 1. 계층

```
원시(primitive / option)   blue.40 = #3a5ba9            값만, 뜻 없음
   ↓ 별칭(alias)
의미(semantic / decision)  color.primary = {blue.40}     뜻, 테마마다 매핑 교체
   ↓ (선택)
컴포넌트(component)         button.bg = {color.primary}   특정 컴포넌트 전용
```

컴포넌트 층은 꼭 필요할 때만 만든다. 너무 잘게 쪼개면 토큰 수가 폭증한다.

### 2. DTCG 포맷 (2025.10)

Design Tokens Community Group(W3C 커뮤니티 그룹)이 2025-10-28 에 Format·Color·Resolver 모듈 2025.10 을 냈다. "안정판"으로 설명되지만 **W3C 표준(Recommendation)이 아닌 커뮤니티 그룹 보고서**다.

```json
{
  "color": {
    "$type": "color",
    "blue": {
      "40": { "$value": { "colorSpace": "srgb", "components": [0.227, 0.357, 0.663], "hex": "#3a5ba9" } }
    },
    "primary": { "$value": "{color.blue.40}", "$description": "주요 행동·강조" }
  },
  "space": {
    "$type": "dimension",
    "4": { "$value": { "value": 16, "unit": "px" } }
  },
  "motion": {
    "standard": { "$type": "cubicBezier", "$value": [0.2, 0, 0, 1] },
    "short":    { "$type": "duration", "$value": { "value": 150, "unit": "ms" } }
  }
}
```

| 규칙 | 내용 |
| --- | --- |
| 토큰 판별 | `$value` 가 있으면 토큰, 없으면 그룹 |
| `$type` | 토큰 또는 상위 그룹에 지정(상속). 값에서 타입을 추측하지 않는다 |
| 기본 타입 | color, dimension(px·rem), fontFamily, fontWeight(1~1000 또는 키워드), duration(ms·s), cubicBezier, number |
| 복합 타입 | strokeStyle, border, transition, shadow, gradient, typography |
| 참조 | `{group.token}` (토큰 전체) 또는 JSON Pointer `$ref` (하위 값까지). 순환 참조는 오류 |
| 기타 | `$description`, `$deprecated`, `$extensions`(벤더 데이터, 도구는 보존해야 함), 그룹의 `$root`·`$extends` |
| 파일 | 확장자 `.tokens` / `.tokens.json`, 미디어 타입 `application/design-tokens+json` |

라이트·다크·고대비처럼 맥락별 값은 **Resolver 모듈**로 표현한다: `sets`(토큰 묶음), `modifiers`(예: theme = light/dark), `resolutionOrder`(충돌 시 우선순위).

### 3. 변환

토큰 원본(JSON) → 변환 도구 → CSS 변수, Swift, Kotlin, Tailwind 설정 등. Style Dictionary 는 v4 부터 DTCG 형식을 지원하지만, 공식 문서 기준 2025.10 전체 지원은 진행 중이다.

```css
/* 생성 결과 예 */
:root { --color-primary: #3a5ba9; --space-4: 16px; --motion-standard: cubic-bezier(0.2, 0, 0, 1); }
```

## 언제 쓰나

- 플랫폼(웹·iOS·Android)이 둘 이상이거나, 테마가 둘 이상이거나, 디자인 도구와 코드 동기화가 자주 깨질 때.
- 단일 웹 앱·단일 테마라면 CSS 변수 파일 하나로 충분할 수 있다.

## 체크리스트

- [ ] 토큰 원본은 저장소 한 곳(단일 원천)에 있고, 산출물은 생성만 한다
- [ ] 이름은 용도 기준(`color.text.subtle`), 값 기준(`gray-600-text`) 아님
- [ ] 컴포넌트 코드는 의미 토큰만 참조 (원시 토큰 직접 사용 금지 린트)
- [ ] 폐기 예정 토큰은 `$deprecated` 로 표시하고 대체 토큰 안내
- [ ] 토큰 변경도 버전·변경 로그로 배포 ([거버넌스](/develop-wiki/knowledge/ui-ux/design-system-governance/))

## 흔한 실수

- 모든 값을 토큰화(`border-radius-card-header-left`) → 토큰 수천 개, 아무도 못 찾음.
- 원시 토큰을 컴포넌트에서 직접 사용 → 테마 교체가 불가능.
- 디자인 도구 플러그인 고유 형식에 묶여 도구 교체 시 전부 재작성.
- 별칭 깊이가 4~5단계 → 실제 값 추적이 어려움.

## 주의 (비용)

- 변환 파이프라인·명명 규칙·리뷰 절차라는 운영 비용이 생긴다. 토큰은 "시스템을 운영할 팀"이 있을 때 효과가 크다.
- DTCG 2025.10 을 완전히 구현한 도구는 아직 제한적이다. 도입 전 사용하는 디자인 도구·변환 도구의 지원 범위(특히 `$ref`, `$extends`, Resolver)를 확인한다.
