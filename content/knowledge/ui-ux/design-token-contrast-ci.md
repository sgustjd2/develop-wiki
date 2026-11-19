---
title: 디자인 토큰 대비 자동 검사 CI (브랜드·모드 조합별)
aka: [Token Contrast Check, Contrast Lint in CI, WCAG contrast matrix, 멀티 브랜드 대비 검증]
category: ui-ux
group: design-system
level: advanced
summary: 토큰을 브랜드×모드 조합별로 해석한 뒤 전경/배경 쌍의 WCAG 대비를 계산해 CI 에서 실패시키는 방법과, 자동 검사가 못 잡는 영역.
tags: [design-tokens, contrast, wcag, ci, multi-brand, dark-mode, automation]
related: [ui-ux/color-contrast-wcag-apca, ui-ux/multi-brand-theming-dtcg-resolver, ui-ux/design-tokens, ui-ux/color-system-semantic-roles, ui-ux/dark-mode-design, ui-ux/design-system-governance, ui-ux/a11y-testing-strategy, ui-ux/figma-variables-token-sync]
sources:
  - https://www.w3.org/TR/WCAG22/#contrast-minimum
  - https://www.w3.org/TR/WCAG22/#non-text-contrast
  - https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
  - https://www.w3.org/community/design-tokens/
updatedAt: 2026-11-19
---

## 문제

브랜드 3개 × 라이트/다크 2모드 = 6개 조합이면, 색 한 개를 바꿔도 어느 조합이 깨졌는지 눈으로 알 수 없다.

- 새 브랜드의 포인트 색 위에 흰 글자를 얹었더니 대비가 2:1 이다.
- 다크 모드에서 별칭 하나가 다른 토큰을 가리켜 의도치 않은 쌍이 생긴다.
- 디자이너가 Figma 에서 확인했어도 코드로 내보낸 값은 다시 검증되지 않는다.

## 해법

핵심은 **"토큰 해석 → 쌍 선언 → 계산 → 실패 처리"** 를 빌드 단계에 넣는 것이다. 토큰 해석 자체는 [멀티 브랜드 테마(DTCG resolver)](/develop-wiki/knowledge/ui-ux/multi-brand-theming-dtcg-resolver/), 대비 기준은 [색 대비](/develop-wiki/knowledge/ui-ux/color-contrast-wcag-apca/) 노트를 본다.

### 1. 단계

1. **조합 열거**: 브랜드 × 모드(× 밀도 등)를 빌드 산출물 기준으로 모두 해석한다. CI 가 검사하는 값은 디자이너가 본 값이 아니라 **실제 배포되는 값**이어야 한다.
2. **쌍 선언**: "어떤 전경이 어떤 배경 위에 놓이는가"를 규칙으로 적는다. 토큰 이름만으로는 알 수 없으므로 쌍 목록(또는 역할 규약: `on-*` ↔ `*`)이 필요하다.
3. **기준 매핑**: WCAG 2.2 기준으로 본문 텍스트 4.5:1, 큰 글자 3:1(1.4.3), 컴포넌트 경계·상태·의미 있는 그래픽 3:1(1.4.11).
4. **계산·실패**: 미달 쌍을 "브랜드/모드 / 전경 on 배경 / 비율 / 기준"으로 출력하고 종료 코드 1.
5. **예외 목록**: 비활성·장식은 기준에서 제외(WCAG 예외). 예외는 이유와 함께 파일로 남기고 리뷰 대상으로 둔다.

### 2. 코드 (Node 로 실행해 확인)

```ts
const resolve = (v: string, scope: any): string =>
  v.startsWith('{') ? resolve(v.slice(1, -1).split('.').reduce((o, k) => o[k], scope), scope) : v;

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// [전경, 배경, 최소 비율, 근거]
const PAIRS: [string, string, number, string][] = [
  ['text.default', 'surface.default', 4.5, '1.4.3'],
  ['action.fg', 'action.bg', 4.5, '1.4.3'],
  ['border.input', 'surface.default', 3, '1.4.11'],
];
for (const [brand, modes] of Object.entries(tokens.brands))
  for (const [mode, t] of Object.entries(modes))
    for (const [fg, bg, min, sc] of PAIRS) {
      const r = ratio(resolve(t[fg], tokens), resolve(t[bg], tokens));
      if (r < min) fails.push(`${brand}/${mode} ${fg} on ${bg}: ${r.toFixed(2)} < ${min} (WCAG ${sc})`);
    }
if (fails.length) { console.error(fails.join('\n')); process.exit(1); }
```

- 확인한 동작(Node 24): `#000`/`#fff` 가 21:1, `#767676`/`#fff` 가 약 4.54:1 로 계산되고, 예시 토큰 2개 브랜드 중 노란 계열 브랜드의 "흰 글자 on 포인트색"(2.27:1) 한 쌍만 실패로 보고됐다. 공식은 WCAG 의 상대 휘도 정의를 직접 구현한 것이며, 상용 도구와의 교차 검증은 하지 않았다.
- 예제는 `#rrggbb` 만 다룬다. DTCG 의 객체형 색(색공간·컴포넌트), 알파 합성, 그라디언트·이미지 위 텍스트는 처리하지 않는다.

### 3. 파이프라인 위치

- 토큰 빌드(예: [Style Dictionary](/develop-wiki/frontend/styling/style-dictionary/)) 산출물 직후, 컴포넌트 빌드 전에 실행하면 실패가 빠르다.
- PR 에서는 변경된 토큰이 영향을 주는 조합만, main 에서는 전체 조합을 돌려도 된다(조합 수가 작으면 항상 전체가 단순).
- 보고는 표 형태로 PR 코멘트에 남기면 디자이너도 읽는다.

### 4. 자동 검사가 못 잡는 것

| 영역 | 이유 | 보완 |
| --- | --- | --- |
| 실제 렌더 결과 | 토큰 쌍은 선언일 뿐, 실제 어떤 컴포넌트가 어떤 쌍을 쓰는지는 모름 | 렌더 후 [axe-core](/develop-wiki/frontend/performance-a11y/axe-core/) 대비 규칙, 스토리 단위 검사 |
| 반투명·그림 위 글자 | 최종 색이 배경에 의존 | 합성 후 값을 계산하거나 수동 검토 |
| 호버·포커스·비활성 상태 | 쌍 목록에 없으면 누락 | 상태별 쌍을 목록에 추가 |
| 인접 색 구분(차트 계열) | 쌍이 아니라 집합 문제 | [데이터 시각화 색](/develop-wiki/knowledge/ui-ux/data-viz-color/) |
| 지각 대비 | WCAG 2 비율은 지각과 어긋나는 영역이 있다(특히 다크 모드) | APCA 는 참고 지표로 병행하되 준수 기준은 WCAG 2.x |

## 언제 쓰나

- 브랜드·모드가 2개 이상이거나, 토큰을 여러 팀이 고치는 시스템.
- 색 토큰 변경이 잦아 수동 확인이 병목일 때.
- 단일 브랜드·단일 모드의 작은 제품은 스토리·페이지 단위 axe 검사만으로도 충분할 수 있다.

## 주의

- 쌍 목록 유지 비용이 든다. 역할 이름 규약(`on-primary`/`primary`)을 두면 목록을 자동 생성할 수 있다.
- 기준을 통과시키려고 임계값에 맞춘 색만 고르면 시각적으로 단조로워진다. 팔레트 설계 단계에서 단계별 대비를 의도해 둔다([색 시스템](/develop-wiki/knowledge/ui-ux/color-system-semantic-roles/)).
- 대비 통과 ≠ 접근성 충족이다. 색만으로 의미를 전달하지 않는지(1.4.1) 등은 별도다([WCAG 2.2](/develop-wiki/knowledge/ui-ux/wcag-22-overview/)).
- 예외(allowlist)가 늘어나면 검사가 형식화된다. 만료일·사유를 요구한다([거버넌스](/develop-wiki/knowledge/ui-ux/design-system-governance/)).

## 체크리스트

- [ ] 모든 브랜드×모드를 실제 빌드 산출물로 해석한다
- [ ] 쌍 목록에 텍스트(4.5/3)와 컴포넌트 경계·아이콘(3)이 모두 있다
- [ ] 상태(hover·focus·selected·disabled 제외 사유) 쌍을 포함했다
- [ ] 실패 메시지에 브랜드·모드·토큰 이름·비율이 나온다
- [ ] 예외는 사유·담당·만료가 있다
- [ ] 렌더 기반 검사(axe)와 병행한다

## 흔한 실수

- 라이트 모드만 검사.
- 토큰이 아니라 Figma 스타일 값을 검사해 코드와 불일치.
- 계산식에 sRGB 감마(0.04045 구간) 누락.
- 알파가 있는 색을 불투명으로 가정.
