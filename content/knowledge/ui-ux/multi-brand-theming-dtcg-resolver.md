---
title: 멀티 브랜드 테마 (DTCG Resolver)
aka: [Multi-brand Theming, Design Token Resolver, DTCG Resolver Module, Modifiers, Contexts, White-label Theming]
category: ui-ux
group: design-system
level: advanced
summary: 하나의 컴포넌트 라이브러리로 여러 브랜드·테마(라이트/다크)를 지원하기 위해, 토큰 집합과 조건(modifier)을 resolutionOrder 로 합성해 결과 토큰을 얻는 DTCG Resolver 모듈 개념과 구현 감각.
tags: [design-system, design-tokens, dtcg, theming, multi-brand, resolver]
related: [ui-ux/design-tokens, ui-ux/color-system-semantic-roles, ui-ux/dark-mode-design, ui-ux/design-system-governance, ui-ux/state-layer-shape-elevation-tokens, ui-ux/figma-variables-token-sync]
sources:
  - https://www.designtokens.org/TR/2025.10/resolver/
  - https://www.designtokens.org/TR/2025.10/format/
  - https://styledictionary.com/info/dtcg/
updatedAt: 2026-11-19
---

## 문제

- 브랜드 A·B 와 라이트·다크를 조합하면 파일이 곱으로 늘어난다(A-light, A-dark, B-light, B-dark …).
- 어떤 값이 어떤 조건에서 덮어쓰이는지 추적하기 어렵고, 도구마다 합성 규칙이 다르다.

## 해법

### 1. 계층화

| 층 | 내용 | 변하는 조건 |
| --- | --- | --- |
| 원시(reference) | 팔레트·스케일 | 브랜드 |
| 시맨틱(system) | `color.action.primary` 처럼 용도 | 테마(라이트/다크) |
| 컴포넌트 | `button.bg` | 거의 없음 |

컴포넌트는 시맨틱 토큰만 쓰고, 시맨틱은 원시를 가리킨다([시맨틱 색 역할](/develop-wiki/knowledge/ui-ux/color-system-semantic-roles/)). 브랜드는 원시 값을 바꾸고, 테마는 시맨틱의 매핑을 바꾼다.

### 2. DTCG Resolver Module (2025.10) 개념

Resolver 는 조건에 따라 토큰 값이 어떻게 달라지는지 JSON 으로 기술하는 별도 문서다.

- **`sets`**: 항상 적용되는 토큰 묶음. 각 set 은 `sources`(인라인 토큰 또는 `$ref` 파일)를 배열 순서대로 병합하며 나중 값이 이긴다.
- **`modifiers`**: 이름 붙은 조건. 각각 `contexts`(예: `light`, `dark`)를 갖고, 선택된 context 의 소스가 적용된다. `default` context 를 둘 수 있다.
- **`resolutionOrder`**: 필수. set·modifier 를 합성하는 순서. 뒤에 오는 것이 앞을 덮어쓴다.
- **입력(input)**: `{ "brand": "b", "theme": "dark" }` 처럼 modifier 이름 → context 이름. default 가 없는 modifier 를 생략하거나 모르는 키·값을 넣으면 오류.
- **`$ref`**: JSON 포인터로 파일 또는 같은 문서(`#/sets/foundation`)를 가리킨다. modifier 는 `resolutionOrder` 에서만 참조 가능, 순환 참조 금지. `$ref` 와 같은 객체의 다른 키는 로컬 오버라이드다.
- **해석 순서**: 입력 검증 → `resolutionOrder` 따라 병합(평탄화) → **별칭(alias) 해석은 마지막에** → 출력. 별칭은 순환하면 안 되고 `$type` 이 맞아야 한다.
- 모디파이어는 서로 다른 토큰을 건드리도록(직교) 유지하라는 것이 명세 설명의 핵심 조언이다. 같은 토큰을 둘이 바꾸면 순서에 따른 숨은 덮어쓰기가 생긴다.

### 3. 최소 구현으로 감 잡기 (node 로 실행해 확인)

```ts
type Tok = { $type?: string; $value?: unknown };
interface Doc {
  sets: Record<string, { sources: object[] }>;
  modifiers: Record<string, { default?: string; contexts: Record<string, object[]> }>;
  resolutionOrder: { $ref: string }[];
}
function merge(a: any, b: any) {
  for (const [k, v] of Object.entries<any>(b)) {
    if (v && typeof v === 'object' && !('$value' in v) && a[k]) merge(a[k], v); else a[k] = structuredClone(v);
  }
  return a;
}
export function resolve(doc: Doc, input: Record<string, string>) {
  const out: any = {};
  for (const { $ref } of doc.resolutionOrder) {
    const [, kind, name] = $ref.split('/');                 // '#/modifiers/brand'
    let sources: object[];
    if (kind === 'sets') sources = doc.sets[name].sources;
    else {
      const m = doc.modifiers[name], ctx = input[name] ?? m.default;
      if (!ctx || !m.contexts[ctx]) throw new Error(`modifier ${name}: invalid context ${ctx}`);
      sources = m.contexts[ctx];
    }
    sources.forEach((s) => merge(out, s));
  }
  return out;   // 이후 {alias} 해석 단계는 별도 (명세: 병합 후 마지막에)
}
```

- 시험한 문서: `foundation` set + `brand`(a, b) modifier + `theme`(light, dark) modifier, 순서는 foundation → brand → theme. 시맨틱 `sys.action` 은 light 에서 `{ref.primary}` 별칭, dark 에서 `#ffffff`. 결과: `{brand: b}` → `#c2410c`(브랜드 b 의 primary 로 해석), `{brand: b, theme: dark}` → `#ffffff`(뒤의 theme 이 덮어씀), 입력 없음 → default(a, light) 인 `#3a5ba9`, 잘못된 context(`z`) → 오류.
- 이 코드는 개념 설명용 축소판이며 명세의 `$ref` 파일 로딩, `$extends`, 타입 검사, 인라인 `$ref` 로컬 오버라이드를 구현하지 않았다. 실제 도구 지원은 확인이 필요하다(DTCG 2025.10 의 완전 구현은 제한적이며, 사용하는 변환 도구의 Resolver 지원 여부를 먼저 본다).

### 4. 산출물 전달 (웹)

브랜드·테마 조합을 CSS 로 빌드하는 전형적 방식은 `[data-brand="b"][data-theme="dark"] { --color-action-primary: …; }` 로 변수를 덮는 것이다.

- 컴포넌트는 변수만 읽으므로 런타임 전환이 가능하고, 조합 수가 적으면 한 번에 모두 번들, 많으면 브랜드별 파일을 지연 로드한다.
- `prefers-color-scheme` 과 사용자 선택을 조합하는 로직은 [다크 모드](/develop-wiki/knowledge/ui-ux/dark-mode-design/)를 참조.

## 언제 쓰나

- 화이트라벨 제품, 자회사·계열사별 브랜드, 라이트·다크·고대비 + 밀도(compact/comfortable)를 모두 지원해야 할 때.
- 브랜드 하나·테마 두 개 정도면 CSS 변수 파일 둘로 충분하고, Resolver 는 과하다.

## 주의·비용

- 조합 수가 곱으로 늘어 **테스트(대비·시각 회귀)** 부담이 커진다. 대표 조합 + 대비 자동 검사로 보완([시각 회귀](/develop-wiki/knowledge/ui-ux/visual-regression-testing/)).
- 브랜드 색이 대비 기준을 못 맞출 때: 원시 색 그대로가 아니라 시맨틱 층에서 접근성 보정(어두운 변형)을 허용하는 정책이 필요하다.
- 명세·도구가 아직 움직이는 영역이다. 이 노트는 2025.10 문서를 읽은 시점 기준이다.
- 구조 변경(시맨틱 이름 변경)은 모든 브랜드에 영향을 준다. 이름 변경은 거버넌스 절차로.

## 체크리스트

- [ ] 원시/시맨틱/컴포넌트 계층이 분리되어 있다
- [ ] 브랜드 modifier 는 원시, 테마 modifier 는 시맨틱 토큰만 바꾼다(직교)
- [ ] 조합별 대비 검사가 CI 에서 돈다
- [ ] 새 브랜드 추가 절차(필수 토큰 목록, 검증)가 문서화되어 있다
- [ ] 폴백: 정의되지 않은 토큰에 기본 브랜드 값이 적용된다

## 흔한 실수

- 컴포넌트 CSS 에서 브랜드를 분기(`if brand === 'b'`)한다.
- 브랜드가 시맨틱 토큰 이름을 바꿔 버려 컴포넌트가 깨진다.
- 별칭을 병합 전에 해석해 테마 오버라이드가 무시된다(명세는 병합 후 해석).
- 다크 테마를 "색 반전" 으로 만들어 의미 색 대비가 무너진다.
