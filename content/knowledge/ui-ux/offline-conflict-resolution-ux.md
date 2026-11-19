---
title: 오프라인 충돌 해결 UX
aka: [Offline Conflict Resolution, Sync Conflict UX, Lost Update, Three-way Merge, 동기화 충돌 화면]
category: ui-ux
group: patterns
level: advanced
summary: 오프라인 편집이 서버의 새 변경과 부딪힐 때, 충돌 감지(버전·ETag)와 필드 단위 병합으로 대부분을 조용히 처리하고 진짜 충돌만 사용자에게 선택지로 보여 주는 설계.
tags: [offline, sync, conflict, optimistic-lock, etag, merge, crdt, patterns]
related: [ui-ux/multi-tab-sync-draft-restore, ui-ux/confirmation-vs-undo, ui-ux/error-messages, ui-ux/toast-notification-banner, ui-ux/session-timeout-ux, ui-ux/loading-states, ui-ux/live-regions-announcements, ui-ux/offline-outbox-background-sync, ui-ux/crdt-collaboration-history-undo-ux]
sources:
  - https://www.inkandswitch.com/essay/local-first/
  - https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match
updatedAt: 2026-11-19
---

탭 간 동기화와 임시 저장은 [다중 탭 동기화](/develop-wiki/knowledge/ui-ux/multi-tab-sync-draft-restore/)에서 다뤘다. 이 노트는 **기기 간·서버와의 충돌**과 그 화면에 집중한다.

## 문제

- 오프라인에서 고친 내용을 온라인에서 올리면 그 사이 다른 사람(또는 다른 기기)이 같은 레코드를 바꿨을 수 있다.
- 아무 처리가 없으면 마지막 쓰기가 이긴다(lost update). 사용자는 자기 변경이나 남의 변경이 사라진 것을 모른다.
- 반대로 모든 불일치마다 "충돌" 대화상자를 띄우면 대부분 사용자가 판단할 필요가 없는 경우에도 피로하다.

## 해법

### 1. 감지: 버전 확인

- Fowler 의 Optimistic Offline Lock: 저장 직전에 다른 세션이 먼저 바꾸지 않았는지 검사하고, 충돌이면 거부한다. 충돌 가능성이 낮을 때 동시성을 살리는 방식이다(반대는 비관적 잠금).
- HTTP 에서는 `ETag` + `If-Match` 로 같은 일을 한다(MDN). 서버는 ETag 가 현재와 다르면 `412 Precondition Failed` 를 돌려주고 리소스를 바꾸지 않는다. 클라이언트는 다시 가져와 병합한 뒤 새 ETag 로 재시도한다. 약한 ETag(`W/`)는 `If-Match` 에서 일치하지 않는다.
- 클라이언트는 편집 시작 시점의 **base 버전**을 변경과 함께 저장해야 한다. 이게 없으면 병합 기준이 없다.

### 2. 병합: 가능한 건 조용히, 진짜 충돌만 묻는다

base/mine/theirs 를 필드 단위로 비교한다.

| 상황 | 처리 |
| --- | --- |
| 나만 바꿈 | mine 적용 |
| 상대만 바꿈 | theirs 유지 |
| 둘 다 같은 값으로 바꿈 | 충돌 아님 |
| 둘 다 같은 필드를 다르게 바꿈 | **충돌 → 사용자 선택** |

```ts
type R = Record<string, unknown>;
const diff = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

function merge(base: R, mine: R, theirs: R) {
  const merged: R = { ...theirs }, conflicts: { field: string; mine: unknown; theirs: unknown }[] = [];
  for (const k of new Set([...Object.keys(base), ...Object.keys(mine), ...Object.keys(theirs)])) {
    const m = diff(mine[k], base[k]), t = diff(theirs[k], base[k]);
    if (m && !t) merged[k] = mine[k];
    else if (m && t && diff(mine[k], theirs[k])) conflicts.push({ field: k, mine: mine[k], theirs: theirs[k] });
  }
  return { merged, conflicts };
}
```

- 확인한 동작(Node 24): 제목은 내가, 상태는 상대가 바꾼 경우 둘 다 반영되고 충돌 0건; 같은 제목 필드를 서로 다르게 바꾸면 충돌 1건이 나오고 기본값은 theirs; 같은 값으로 바꾸면 충돌 없음.
- 한계: 필드 단위만 다룬다. **긴 텍스트 안의 서로 다른 줄**, 배열 항목 순서, 삭제 vs 수정 같은 경우는 처리하지 않는다. 그런 자료형은 텍스트 병합이나 CRDT 같은 전용 구조가 필요하다.
- Ink & Switch 의 로컬 우선 에세이는 CRDT 로 충돌 대부분이 자동 병합되고, 같은 객체의 같은 속성을 동시에 바꾼 경우에만 선택이 필요하다고 서술한다. 병합 결과를 이해하려면 **변경 이력을 볼 수 있어야 한다**는 점도 지적한다(해법은 열린 문제로 둔다).

### 3. 충돌 화면 설계

- 막지 않는다: 편집을 막는 경고 대신, 저장 상태를 표시한다("오프라인 — 연결되면 동기화").
- 충돌 항목만 보여준다: 필드 이름, **내 값 / 서버 값**을 나란히, 누가·언제 바꿨는지(알 수 있을 때).
- 선택지는 구체적인 동사로: "내 변경 유지", "서버 값 사용", "둘 다 보관(복사본 만들기)". "확인/취소"는 의미가 모호하다([에러 메시지](/develop-wiki/knowledge/ui-ux/error-messages/)).
- 되돌릴 수 있게: 자동 병합 결과도 알려 주고(토스트·배너) 이전 값으로 되돌릴 경로를 둔다([확인 vs 되돌리기](/develop-wiki/knowledge/ui-ux/confirmation-vs-undo/)).
- 접근성: 충돌 발생과 해결 결과는 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)으로 알리고, 비교 화면은 색만으로 mine/theirs 를 구분하지 않는다(WCAG 1.4.1). 이 노트는 낭독기 실기기 확인을 하지 않았다.
- 충돌을 미룰 수 있게: 지금 해결하지 않아도 항목에 "충돌 있음" 표식을 남겨 나중에 처리한다.

## 언제 쓰나

- 오프라인 편집·다기기·여러 사용자가 같은 레코드를 고치는 앱.
- 충돌이 드물고 레코드가 작으면 버전 확인 + 간단한 충돌 화면으로 충분하다.
- 실시간 공동 편집이 본질이면 처음부터 CRDT/OT 같은 구조를 검토한다(이 노트 범위 밖).

## 주의·비용

- base 버전·변경 큐(outbox)를 클라이언트에 저장하고 재시도·순서·중복 전송을 처리해야 한다. 구현 비용이 크다([outbox 큐와 Background Sync](/develop-wiki/knowledge/ui-ux/offline-outbox-background-sync/)).
- 실시간 공동 편집의 변경 이력·되돌리기는 [CRDT 협업의 변경 이력 UX](/develop-wiki/knowledge/ui-ux/crdt-collaboration-history-undo-ux/)에 있다.
- 서버 시계·클라이언트 시계로 "최신"을 판정하면 틀린다. 버전 번호·ETag 같은 논리적 비교를 쓴다.
- 자동 병합은 값은 맞아도 **의미가 어긋날 수 있다**(예: 금액은 내가, 통화는 상대가 변경). 서로 의존하는 필드는 묶어서 충돌로 취급한다.
- 삭제된 레코드에 대한 편집은 별도 시나리오다(복원 vs 폐기 선택).
- 권한·세션 만료 중 쌓인 변경은 [세션 만료 UX](/develop-wiki/knowledge/ui-ux/session-timeout-ux/)와 함께 설계한다.

## 체크리스트

- [ ] 저장 요청에 base 버전(ETag·버전 번호)이 포함된다
- [ ] 충돌 시 서버가 변경을 거부하고(412 등) 클라이언트가 재병합한다
- [ ] 필드 단위 자동 병합 범위와 한계가 문서화돼 있다
- [ ] 진짜 충돌만 사용자에게 보이고 선택지가 구체적이다
- [ ] 자동 병합·충돌 해결 결과가 알림·되돌리기로 제공된다
- [ ] 의존 필드 묶음, 삭제 vs 수정 시나리오 정의
- [ ] 낭독기·키보드로 충돌 해결 가능(수동 확인)
