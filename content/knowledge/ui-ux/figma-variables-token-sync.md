---
title: Figma 변수↔코드 토큰 동기화
aka: [Figma Variables, Token Sync, Design-to-Code Tokens, Figma Variables REST API, Tokens Studio, Style Dictionary]
category: ui-ux
group: design-system
level: advanced
summary: Figma 변수(컬렉션·모드·별칭)를 DTCG 토큰 JSON 으로 내보내고 코드의 단일 원천과 맞추는 방식, 방향별(디자인→코드/코드→디자인) 트레이드오프와 REST API 제약.
tags: [design-system, design-tokens, figma, dtcg, sync, style-dictionary]
related: [ui-ux/design-tokens, ui-ux/design-dev-handoff, ui-ux/design-system-governance, ui-ux/multi-brand-theming-dtcg-resolver, ui-ux/color-system-semantic-roles, ui-ux/dark-mode-design]
sources:
  - https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
  - https://developers.figma.com/docs/rest-api/variables-endpoints/
  - https://www.designtokens.org/TR/2025.10/format/
  - https://styledictionary.com/info/dtcg/
updatedAt: 2026-11-19
---

## 문제

- 디자이너는 Figma 에서 색을 바꾸고 개발자는 코드에서 따로 바꿔 두 값이 어긋난다.
- "어느 쪽이 원본인가" 가 정해지지 않으면 동기화 도구를 도입해도 충돌만 늘어난다.

## 해법

### 1. Figma 변수 개념 (공식 안내 요지)

- 변수는 디자인 속성·프로토타입 동작에 쓰는 재사용 값이다. **모드**로 한 변수에 여러 값(라이트/다크)을 두고, 다른 변수를 참조하는 **별칭**, 사용처를 제한하는 **스코프**, 컬렉션 구조를 가진다.
- 팀 라이브러리 게시 등 일부 기능은 유료 플랜이 필요하다(공식 안내 기준). 변수 타입·모드 한도 같은 세부는 플랜·시점에 따라 달라지므로 현재 문서를 확인한다.

### 2. REST API (Variables endpoints 문서 기준)

| 엔드포인트 | 용도 |
| --- | --- |
| `GET /v1/files/:file_key/variables/local` | 파일의 로컬 변수·컬렉션(모드 값 포함) 조회 |
| `GET /v1/files/:file_key/variables/published` | 게시된 변수 조회(모드는 빠짐) |
| `POST /v1/files/:file_key/variables` | 컬렉션·모드·변수·모드 값 일괄 생성/수정/삭제 |

- 세 엔드포인트 모두 **Enterprise 조직의 정회원**이 대상이고, 쓰기는 파일 편집 권한도 필요하다. 읽기 스코프 `file_variables:read`, 쓰기 `file_variables:write`.
- POST 본문은 `variableCollections → variableModes → variables → variableModeValues` 순으로 적용되며, 새 객체를 임시 id 로 참조할 수 있고 응답이 `tempIdToRealId` 를 돌려준다. 전체가 **원자적**(검증 실패 시 400 으로 아무것도 저장되지 않음), 본문 4MB 한도, 컬렉션당 모드 40개·변수 5,000개 한도가 문서에 있다. 원격(남의 라이브러리) 변수는 수정할 수 없다.
- Enterprise 가 아니면 REST 로 변수를 읽을 수 없으므로, 플러그인(Plugin API)·Tokens Studio 같은 우회 경로를 써야 한다. 어느 경로가 가능한지는 플랜에 달려 있다.

### 3. 동기화 방향

| 방식 | 원본 | 장점 | 비용 |
| --- | --- | --- | --- |
| 디자인 → 코드 | Figma | 디자이너 주도, 빠른 반영 | 코드에서만 쓰는 토큰(상태·모션)을 표현하기 어렵다 |
| 코드 → 디자인 | 저장소의 DTCG JSON | 리뷰·버전 관리(Git), 테스트 가능 | Figma 에 반영하는 쓰기 경로 필요(Enterprise API 또는 플러그인) |
| 양방향 | 둘 | 이론상 편함 | 충돌 해결·루프가 어렵다. 대개 피한다 |

대다수 팀은 **한쪽을 원본으로 고정**하고(색·타입·간격은 Figma, 상태·모션은 코드 등 토큰군별 분담) 변경은 PR 로 검토한다.

### 4. 변환 예 (mock 응답으로 node 에서 확인)

```ts
// Figma GET .../variables/local 응답(meta.variableCollections / meta.variables)을 모드별 DTCG 트리로
const h2 = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');

export function toDtcgByMode(res: any) {
  const { variableCollections: cols, variables: vars } = res.meta;
  const out: any = {};
  for (const c of Object.values<any>(cols)) for (const mode of c.modes) {
    const tree = (out[mode.name] ??= {});
    for (const id of c.variableIds) {
      const v = vars[id]; if (v.resolvedType !== 'COLOR') continue;
      const raw = v.valuesByMode[mode.modeId];
      const value = raw.type === 'VARIABLE_ALIAS'
        ? `{${vars[raw.id].name.replaceAll('/', '.')}}`       // 별칭 → DTCG 참조
        : '#' + h2(raw.r) + h2(raw.g) + h2(raw.b);              // 0~1 float → hex
      let node = tree; const parts = v.name.split('/');
      for (const p of parts.slice(0, -1)) node = node[p] ??= {};
      node[parts.at(-1)!] = { $type: 'color', $value: value };
    }
  }
  return out;
}
```

- 직접 만든 mock 응답(컬렉션 1개, 모드 light/dark, 변수 2개 중 하나는 별칭)으로 실행해 `light.color.bg.default = #ffffff`, `dark... = #121212`, `text.default` 가 `{color.bg.default}` 별칭으로 나오는 것을 확인했다. **실제 응답의 필드 형태**(색 `{r,g,b,a}` 0~1 값, `VARIABLE_ALIAS`)는 문서 전체를 읽은 것이 아니라 일반적으로 알려진 형태를 쓴 mock 이므로 실제 API 응답으로 재확인해야 한다. 알파 채널·색 공간 처리는 생략했다.
- 이름 규약: Figma 의 `/` 구분 이름을 토큰 경로(`.`)로 매핑한다. 한 곳에서 명명 규칙을 정하고 린트한다.
- 변환 후 [Style Dictionary](/develop-wiki/frontend/styling/style-dictionary/) 로 CSS 변수·iOS·Android 산출물을 만들고, [Tokens Studio](/develop-wiki/frontend/styling/tokens-studio/) 는 Figma 안에서 토큰 JSON 을 다루는 도구다(두 도구의 현재 DTCG 지원 수준은 문서로 확인한다).
- CI 에서 `figma → JSON` 결과와 저장소 JSON 의 차이를 비교해 어긋남을 PR 로 알린다.

## 언제 쓰나

- 플랫폼 둘 이상이거나 테마·브랜드가 많아 값이 어긋나는 비용이 큰 팀. 디자이너·개발자가 같은 이름으로 대화해야 할 때.
- Figma 변수를 전혀 쓰지 않거나 토큰이 수십 개 이하면 수동 관리가 더 싸다.

## 주의·비용

- 모드·별칭 구조가 코드의 테마 구조와 다르면 매핑 규칙이 복잡해진다([Resolver 노트](/develop-wiki/knowledge/ui-ux/multi-brand-theming-dtcg-resolver/)).
- Figma 변수가 표현하지 못하는 것(복합 타입 일부, 코드 전용 토큰)이 있다. 지원 타입은 현재 문서에서 확인한다.
- API 한도(속도 제한, 본문 크기)와 플랜 의존성 때문에 도입 후 도구를 바꾸기 어려울 수 있다.
- 디자이너가 변수를 직접 수정하면 코드 릴리스와 분리되는 "디자인 드리프트" 가 생긴다. 변경 승인 절차를 둔다([거버넌스](/develop-wiki/knowledge/ui-ux/design-system-governance/)).

## 체크리스트

- [ ] 토큰군별 원본(Figma/코드)이 정해져 있다
- [ ] 이름 규칙이 문서화되고 자동 검증된다
- [ ] 동기화 결과가 PR 로 리뷰된다(자동 머지 금지)
- [ ] 별칭이 끊어지거나 순환하지 않는지 검사한다
- [ ] 플랜·권한·API 한도를 확인했다

## 흔한 실수

- 양방향 자동 동기화를 처음부터 구축한다.
- 모드 이름(light/dark)이 코드의 테마 키와 달라 매핑이 어긋난다.
- 값만 내보내고 별칭 구조를 잃어 테마 변경이 불가능해진다.
- Figma 변수 이름을 바꾸고 코드를 갱신하지 않아 참조가 끊어진다.
