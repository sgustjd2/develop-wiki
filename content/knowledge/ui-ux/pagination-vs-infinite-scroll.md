---
title: 페이지네이션 vs 무한 스크롤 vs 더 보기
aka: [Pagination, Infinite Scroll, Load More, Endless Scrolling, 페이징, 무한 스크롤]
category: ui-ux
group: patterns
level: beginner
summary: 긴 목록을 나눠 보여 주는 세 방식(페이지 번호, 무한 스크롤, 더 보기 버튼)을 사용자 목표·재방문·푸터 접근·접근성 기준으로 비교하고 고르는 법.
tags: [ux, pagination, infinite-scroll, load-more, accessibility, nngroup]
related: [ui-ux/search-filter-sort, ui-ux/data-table-density, ui-ux/keyboard-focus-management, ui-ux/loading-states, ui-ux/live-regions-announcements]
sources:
  - https://www.nngroup.com/articles/infinite-scrolling-tips/
  - https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html
  - https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
updatedAt: 2026-11-19
---

## 문제

- 무한 스크롤 쇼핑 목록에서 상품을 눌렀다 돌아오면 맨 위로 돌아가 다시 내려야 한다.
- 푸터의 고객센터·반품 정책 링크에 영원히 닿지 못한다.
- 페이지네이션은 넘길 때마다 흐름이 끊겨 탐색형 콘텐츠에서 이탈을 부른다.
- 키보드·낭독기 사용자는 끝없이 늘어나는 목록에서 다음 영역으로 빠져나가기 어렵다.

## 해법

### 비교 (NN/g, Neusesser 2022 요약)

| 방식 | 장점 | 단점 | 적합 |
| --- | --- | --- | --- |
| **페이지네이션** | 페이지가 위치 표지 역할 → 다시 찾기 쉬움, 상세 갔다 와도 작은 묶음 | 넘길 때마다 끊김 | 특정 항목을 찾고·비교하고·다시 방문하는 목록(검색 결과, 상품, 관리 표) |
| **무한 스크롤** | 상호작용 비용 최소, 모바일 스크롤과 잘 맞음 | 재방문 어려움, 끝난 줄 착각, 푸터 차단, 느려짐, SEO 불리 | 목적 없이 훑는 동질 콘텐츠(피드, 뉴스, 엔터테인먼트) |
| **더 보기 버튼** | 흐름 유지 + 푸터 도달, 데이터 절약 | 클릭 비용 | 위 둘의 절충. 저대역폭 사용자 많을 때 |

결론은 "항상 우월한 방식은 없다". 사용자 목표·기기·대역폭·접근성으로 고른다.

### 어느 방식이든 지킬 것

- **위치 보존**: 상세에서 돌아오면 같은 스크롤 위치·같은 로드 분량. 목록 상태를 URL(`?page=3` 또는 커서)과 메모리 캐시에 남긴다. → [검색·필터·정렬](/develop-wiki/knowledge/ui-ux/search-filter-sort/)
- **진행 표시**: "120개 중 40개 표시" 같은 개수로 끝이 있는지 알려 준다.
- **푸터 도달**: 무한 스크롤이면 중요한 푸터 링크를 다른 곳에도 두거나 더 보기로 바꾼다.

### 접근성: 더 보기 후 포커스

새 항목이 추가되면 키보드 포커스를 **새로 추가된 첫 항목**으로 옮겨, 사용자가 이미 본 항목을 다시 Tab 하지 않게 한다. 추가된 개수는 상태 메시지로 알린다.

```ts
export function appendPage(list: HTMLElement, newItems: HTMLElement[]) {
  const first = newItems[0];
  list.append(...newItems);
  if (first) { first.tabIndex = -1; first.focus(); }   // 이후 Tab 은 그 안의 링크로
}
// announce(`상품 ${newItems.length}개를 더 불러왔습니다`)  → 라이브 영역 노트
```

(jsdom 에서 새 첫 항목으로 포커스 이동을 확인했다.)

페이지네이션 마크업:

```html
<nav aria-label="페이지">
  <a href="?page=2" rel="prev">이전</a>
  <a href="?page=3" aria-current="page">3</a>
  <a href="?page=4">4</a>
  <a href="?page=4" rel="next">다음</a>
</nav>
```

- 링크(`<a href>`)로 만들어 새 탭 열기·공유가 되게 한다. 현재 페이지는 `aria-current="page"`.
- 페이지 이동 후 포커스는 결과 목록 제목으로.

## 언제 쓰나

- 페이지네이션: 비교·재방문·정확한 위치가 중요한 목록, 표, SEO 가 중요한 카탈로그.
- 무한 스크롤: 피드형 소비, 항목 간 우열이 약한 콘텐츠, 푸터가 중요하지 않은 앱 화면.
- 더 보기: 둘 다 애매할 때의 기본값.

## 체크리스트

- 뒤로 가기 시 위치·로드 분량이 복원된다.
- 전체 개수 또는 남은 양이 보인다.
- 무한 스크롤에서 키보드로 목록을 건너뛸 수 있다(건너뛰기 링크·랜드마크, WCAG 2.4.1).
- 로딩 중·더 없음·오류 상태가 목록 끝에 표시된다. → [로딩 상태](/develop-wiki/knowledge/ui-ux/loading-states/)
- 매우 긴 목록은 가상화하되, 낭독기에 전체 개수(`aria-setsize`/`aria-rowcount`)를 알린다.

## 흔한 실수·주의

- **무한 스크롤 + 푸터.** 닿을 수 없는 푸터를 두면 사용자를 놀린다.
- **오프셋 기반 페이지에서 데이터가 바뀜.** 새 항목이 들어오면 중복·누락이 생긴다. 실시간성이 있으면 커서 기반 페이지네이션을 쓴다.
- **페이지 번호를 버튼으로만 구현.** URL 이 바뀌지 않아 공유·뒤로 가기가 안 된다.
- **로드 중 중복 요청.** 스크롤 이벤트가 연속 발생해 같은 페이지를 여러 번 부른다. 진행 중 플래그로 막는다.
