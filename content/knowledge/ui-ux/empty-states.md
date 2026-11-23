---
title: 빈 상태 (Empty State)
aka: [Empty State, Zero State, Blank Slate, No Results, First-use State, 빈 화면, 결과 없음]
category: ui-ux
group: patterns
level: beginner
summary: 표시할 데이터가 없을 때 시스템 상태를 알리고, 기능을 설명하며, 다음 행동으로 바로 이어 주는 화면 설계. 로딩·오류와 구별해 보여 주는 것이 핵심이다.
tags: [ux, empty-state, onboarding, search, nngroup]
related: [ui-ux/loading-states, ui-ux/error-messages, ui-ux/search-filter-sort, ui-ux/onboarding, ui-ux/ux-writing-principles]
sources:
  - https://www.nngroup.com/articles/empty-state-interface-design/
  - https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
updatedAt: 2026-11-23
---

## 문제

- 빈 컨테이너만 보이면 사용자는 **아직 로딩 중인지, 실패했는지, 정말 없는지** 구별하지 못한다.
- 로딩이 끝나기 전에 "항목이 없습니다"를 먼저 보여 주면 사용자는 데이터가 오기 전에 떠난다.
- 처음 쓰는 기능의 빈 화면은 기능을 가르칠 가장 좋은 자리인데 그냥 비워 둔다.

## 해법

### 1. 상태를 타입으로 구분한다

목록 화면은 최소 네 가지 상태를 가진다. 불리언 두세 개(`isLoading`, `isError`, `items.length`)를 조합하면 "로딩 중 + 빈 상태" 같은 불가능한 조합이 화면에 새어 나온다.

```ts
type ListState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'empty'; reason: 'first-use' | 'no-results' | 'all-done' }
  | { status: 'ready'; items: T[] };
```

### 2. 빈 상태의 종류별 내용

| 종류 | 원인 | 보여 줄 것 |
| --- | --- | --- |
| 처음 사용(first-use) | 아직 만든 게 없음 | 기능이 무엇인지 한 문장 + 첫 행동 버튼("첫 프로젝트 만들기"), 필요하면 예시 데이터로 체험 |
| 결과 없음(no-results) | 검색어·필터가 너무 좁음 | 적용된 조건 표시, 필터 해제·철자 확인·연관 검색 제안 → [검색·필터](/develop-wiki/knowledge/ui-ux/search-filter-sort/) |
| 모두 처리(all-done) | 할 일·알림을 다 비움 | 완료 확인 문구. 굳이 행동을 강요하지 않음 |
| 권한·설정 없음 | 연동·권한이 아직 없음 | 왜 비었는지 + 설정 경로 |

아래 그림은 위 표의 네 종류를 나란히 놓은 것이다. 모두 처리 화면에는 행동 버튼이 없다.

<figure class="fig" role="group" aria-label="처음 사용, 결과 없음, 모두 처리, 권한·설정 없음 빈 상태 비교. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="처음 사용"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="48" y="12" width="24" height="18" rx="4" class="f-fill-gray"/><text x="60" y="45" class="f-text" text-anchor="middle" font-size="6.5">아직 없어요</text><rect x="34" y="53" width="52" height="12" rx="5" class="f-fill-blue"/><text x="60" y="61.5" class="f-on" text-anchor="middle" font-size="6.5">첫 항목 만들기</text></svg><span>처음 사용</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="결과 없음"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><circle cx="60" cy="22" r="9" class="f-ring"/><line x1="67" y1="29" x2="74" y2="36" class="f-line"/><text x="60" y="45" class="f-text" text-anchor="middle" font-size="6.5">결과 없음</text><rect x="34" y="53" width="52" height="12" rx="5" class="f-fill-blue"/><text x="60" y="61.5" class="f-on" text-anchor="middle" font-size="6.5">필터 해제</text></svg><span>결과 없음</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="모두 처리"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><path d="M50 22 l7 7 l13 -15" class="f-outline"/><text x="60" y="45" class="f-text" text-anchor="middle" font-size="6.5">모두 처리했어요</text></svg><span>모두 처리</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="권한·설정 없음"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="48" y="12" width="24" height="18" rx="4" class="f-fill-gray"/><text x="60" y="45" class="f-text" text-anchor="middle" font-size="6.5">연동 없음</text><rect x="34" y="53" width="52" height="12" rx="5" class="f-fill-blue"/><text x="60" y="61.5" class="f-on" text-anchor="middle" font-size="6.5">설정 열기</text></svg><span>권한·설정 없음</span></div></div><figcaption>빈 상태의 네 종류. 원인에 따라 보여 줄 문구와 다음 행동이 다르다. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

NN/g(Kaplan, 2021)는 복잡한 애플리케이션의 빈 상태 지침으로 **시스템 상태 전달**, **학습 가능성 향상**(맥락 속 설명), **핵심 과업으로 가는 직접 경로**(링크·버튼) 세 가지를 든다.

### 3. 문구 예

| 나쁜 예 | 고친 예 |
| --- | --- |
| 데이터 없음 | 아직 즐겨찾기가 없습니다. 별 아이콘을 눌러 자주 보는 문서를 여기에 모아 두세요. |
| 검색 결과가 없습니다. | ‘노트북 16GB 화이트’ 결과가 없습니다. 필터 2개를 해제하거나 다른 검색어를 입력해 보세요. [필터 모두 해제] |

### 4. 접근성

- 검색·필터 후 "결과 0건"은 WCAG 4.1.3 의 상태 메시지다. 포커스를 옮기지 않는다면 `role="status"` 로 알린다. → [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)
- 일러스트는 장식이면 `alt=""`.

## 언제 쓰나

- 목록·대시보드·검색 결과·받은편지함·장바구니처럼 데이터가 0개일 수 있는 모든 화면.
- 새 기능 출시 시, 별도 투어 대신 빈 상태로 기능을 소개할 때. → [온보딩](/develop-wiki/knowledge/ui-ux/onboarding/)

## 체크리스트

- 로딩·오류·빈 상태·정상 상태가 시각적으로 구별된다.
- 빈 상태 문구가 "왜 비었는지 + 무엇을 하면 되는지"를 담는다.
- 행동 버튼은 실제로 그 작업을 시작하는 곳으로 간다.
- 검색 결과 없음에서 사용자가 입력한 검색어와 필터를 보여 준다.

## 흔한 실수·주의

- **로딩 전에 빈 상태 표시.** 첫 렌더에서 데이터가 `[]` 로 초기화돼 "없음"이 깜박인다. 상태를 분리하면 막을 수 있다.
- **오류를 빈 상태로 위장.** API 실패 시 빈 배열을 반환하면 사용자는 "정말 없다"고 믿는다. → [에러 메시지](/develop-wiki/knowledge/ui-ux/error-messages/)
- **장식에 공을 들이고 행동은 없음.** 큰 일러스트는 화면을 차지할 뿐이다. 행동 경로가 우선이다.
- **모든 빈 상태에 같은 문구·그림.** 원인이 다르면 다음 행동도 다르다.
