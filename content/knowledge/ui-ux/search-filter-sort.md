---
title: 검색·필터·정렬 UX
aka: [Search UX, Faceted Search, Filtering, Batch Filtering, Interactive Filtering, Sorting, Search Results Page, 패싯 검색]
category: ui-ux
group: patterns
level: intermediate
summary: 검색창·필터(패싯)·정렬을 사용자 의도에 맞춰 즉시 적용 또는 일괄 적용으로 설계하고, 적용 상태를 보여 주며 결과 0건 막다른 길을 피하는 방법.
tags: [ux, search, filter, facet, sort, url-state, nngroup]
related: [ui-ux/empty-states, ui-ux/pagination-vs-infinite-scroll, ui-ux/data-table-density, ui-ux/live-regions-announcements, ui-ux/loading-states]
sources:
  - https://www.nngroup.com/articles/applying-filters/
  - https://www.nngroup.com/articles/filters-vs-facets/
  - https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search
updatedAt: 2026-11-19
---

## 문제

- 필터를 하나 누를 때마다 페이지가 다시 로드돼 다섯 개를 고르는 데 30초가 걸린다.
- 반대로 체크할 때마다 결과가 바뀌며 화면이 들썩이고, 스크롤이 맨 위로 튄다.
- 여러 필터를 조합했더니 결과가 0건인데 어떤 조건 때문인지 모른다.
- 새로고침·뒤로 가기·링크 공유를 하면 필터가 사라진다.

## 해법

### 1. 즉시 적용 vs 일괄 적용 (NN/g, Sherwin 2016)

| 방식 | 적합 | 위험 |
| --- | --- | --- |
| **즉시(interactive)** — 선택마다 결과 갱신 | 탐색형 사용자, 결과가 약 1초 안에 오는 경우 | 화면 산만, 느리면 답답 |
| **일괄(batch)** — 여러 조건 고른 뒤 "적용" | 기준이 분명한 사용자, 느린 환경·모바일 | 0건 조합, 남은 선택지 피드백 부족 |

보완책: 필터 영역에 포커스·호버가 있으면 더 고를 것으로 보고 기다리기, 1~2초 비활동 후 갱신, 갱신 중 결과 영역을 흐리게 + 진행 표시, 각 선택지 옆 **결과 수** 표시로 0건 예방.

### 2. 적용 상태를 보이게

- 결과 위에 적용된 조건을 칩(제거 버튼 포함)으로, "모두 해제" 제공.
- 결과 수를 항상 표시하고, 바뀌면 `role="status"` 로 알린다("검색 결과 18건"). → [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)
- 검색어는 결과 페이지의 검색창에 그대로 남긴다.

### 3. 정렬

- 기본 정렬을 명시한다("관련도순"). 관련도 기준을 모호하게 두면 신뢰가 떨어진다.
- 선택지는 과업에 맞게 소수로: 최신순, 가격 낮은순, 평점순.
- 표에서는 열 머리글 정렬 + `aria-sort`. → [데이터 테이블](/develop-wiki/knowledge/ui-ux/data-table-density/)

### 4. 상태는 URL 에

```ts
export type SearchState = { q: string; sort: 'relevance' | 'newest' | 'price-asc'; filters: Record<string, string[]>; page: number };

export function toParams(s: SearchState): URLSearchParams {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.sort !== 'relevance') p.set('sort', s.sort);           // 기본값은 생략해 URL 을 짧게
  for (const [key, values] of Object.entries(s.filters)) for (const v of values) p.append(key, v);
  if (s.page > 1) p.set('page', String(s.page));
  return p;
}

export function fromParams(p: URLSearchParams, filterKeys: string[]): SearchState {
  const filters: Record<string, string[]> = {};
  for (const k of filterKeys) if (p.getAll(k).length) filters[k] = p.getAll(k);
  return { q: p.get('q') ?? '', sort: (p.get('sort') as SearchState['sort']) ?? 'relevance', filters, page: Number(p.get('page') ?? 1) };
}
// 필터·정렬이 바뀌면 page 는 1로 되돌린다
```

(Node 에서 `q=노트북&sort=newest&brand=lg&brand=samsung&ram=16&page=2` 왕복 변환을 확인했다. 실제로는 `sort` 값을 허용 목록으로 검증한다.)

- 즉시 적용 필터는 `history.replaceState`, 사용자가 의도적으로 한 검색은 `pushState` 로 기록하면 뒤로 가기가 자연스럽다(팀 정책으로 정한다).

### 5. 검색창

- 검색 영역은 `<search>` 요소(또는 `role="search"`)로 감싸 랜드마크로 노출.
- 보이는 라벨 또는 `aria-label="사이트 검색"`, 제출 버튼 제공(Enter 만 의존 ×).
- 자동 완성은 APG 콤보박스 패턴을 따른다.
- 결과 0건 화면은 철자 제안·필터 해제·인기 검색어로 다음 행동을 준다. → [빈 상태](/develop-wiki/knowledge/ui-ux/empty-states/)

## 언제 쓰나

- 상품·문서·로그처럼 항목이 많아 훑어보기로는 찾을 수 없는 목록.
- 필터 vs 패싯: 단순 범위 축소는 필터, 여러 속성 차원을 조합해 탐색하게 하려면 패싯(선택지별 결과 수 표시).

## 체크리스트

- 결과 수와 적용 조건이 항상 보인다.
- 필터 변경 중 스크롤이 맨 위로 튀지 않는다(결과가 적을 때만 결과 상단을 보여 줌).
- 모바일 필터 시트에 "결과 N건 보기" 버튼이 있다.
- URL 로 같은 결과를 재현할 수 있다.
- 키보드로 필터·정렬·결과 이동이 된다.

## 흔한 실수·주의

- **0건이 되는 선택지를 그대로 노출.** 개수를 표시하거나 비활성화(이유 설명)한다.
- **필터 변경 후 페이지 번호 유지.** 3페이지가 없는 결과에서 빈 화면이 나온다.
- **정렬·필터를 클라이언트에서만 처리.** 페이지네이션과 섞이면 현재 페이지 안에서만 정렬되는 오류가 생긴다.
- **입력마다 서버 요청.** 디바운스·요청 취소(`AbortController`)로 늦게 온 이전 응답이 최신 결과를 덮지 않게 한다.
