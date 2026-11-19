---
title: 낙관적 UI와 결과적 일관성 화면 설계
aka: [Optimistic UI, Optimistic Update, Pending State, Rollback, Eventual Consistency UI]
category: mobile-dev
group: architecture
level: intermediate
summary: 서버 응답 전에 사용자 행동의 결과를 먼저 화면에 반영하고, 실패하면 되돌리거나 재시도를 안내하며, 서버 확정 값으로 수렴시키는 UI 설계.
tags: [mobile, ux, optimistic-ui, eventual-consistency, rollback, state-management]
related: [mobile-dev/offline-first-sync, mobile-dev/mvvm-mvi-udf, distributed-systems/idempotency, data-modeling/optimistic-pessimistic-locking, architecture/aggregate-domain-events, mobile-dev/mobile-networking]
sources:
  - https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
  - https://developer.android.com/topic/architecture/data-layer/offline-first
  - https://martinfowler.com/eaaDev/DomainEvent.html
updatedAt: 2026-11-19
---

저장소 동기화와 충돌 해결은 [오프라인 우선 동기화](/develop-wiki/knowledge/mobile-dev/offline-first-sync/)에 있다. 이 노트는 그 위의 **화면이 어떻게 보이고 되돌려지는가**에 집중한다.

## 문제

- 좋아요·체크·메시지 전송을 서버 응답까지 기다리면 모바일 네트워크 지연이 그대로 화면 멈춤으로 보인다.
- 반대로 아무 표시 없이 성공으로 가정하면, 실패했을 때 사용자는 이미 다음 행동을 했고 화면과 서버가 어긋난다.
- 서버 쪽 시스템이 여러 저장소·큐로 나뉘어 있으면 방금 쓴 값이 바로 읽히지 않을 수 있다(결과적 일관성). 새로고침했더니 방금 한 일이 사라져 보이는 문제가 생긴다.

## 해법

원리는 단순하다. **로컬 상태를 먼저 바꾸고, 서버가 확정하면 수렴하고, 실패하면 보상한다.**

### 두 가지 구현 층 (TanStack Query 문서의 분류)

- **UI 변수 방식**: 진행 중인 변경의 입력값으로 임시 항목(흐리게)을 그린다. 실패하면 그대로 두고 재시도 버튼을 보인다. 롤백 로직이 필요 없고 한 컴포넌트만 쓸 때 단순하다.
- **캐시 직접 수정 방식**: 공유 캐시를 먼저 고쳐 여러 화면이 함께 갱신된다. 순서는 문서 기준으로 ① 진행 중인 재조회 취소(낙관 값을 덮어쓰지 않게) ② 이전 값 스냅샷 보관 ③ 새 값 기록 ④ 실패 시 스냅샷 복원 ⑤ 성공·실패 모두 끝난 뒤 서버 값으로 재조회.

```ts
async function toggleLike(postId: string) {
  const prev = store.get(postId);                   // 스냅샷
  store.set(postId, { ...prev, liked: !prev.liked, pending: true });
  try {
    const server = await api.like(postId, { idempotencyKey: newKey() });
    store.set(postId, { ...server, pending: false });  // 서버 확정값으로 교체
  } catch (e) {
    if (isRetryable(e)) store.set(postId, { ...store.get(postId), failed: true }); // 재시도 표시
    else store.set(postId, prev);                       // 규칙 위반이면 되돌림 + 사유 안내
  }
}
```

### 상태를 모델에 넣는다

- 항목마다 `pending`(전송 중) / `confirmed` / `failed` 를 구분한다. 이 구분이 있어야 "처리 중" 표시, 재시도, 중복 방지가 가능하다.
- 임시 ID 로 만든 항목은 서버가 준 실제 ID 로 교체한다. 그 사이 사용자가 그 항목을 열거나 삭제하면 어떻게 할지(큐에 묶기, 비활성화)를 정한다.

### 실패 정책을 둘로 나눈다

| 실패 종류 | 예 | UI 동작 |
| --- | --- | --- |
| 일시적 | 타임아웃, 오프라인 | 상태 유지 + 재시도(백오프). 사용자가 잃지 않게 보관 |
| 확정 거절 | 권한 없음, 재고 부족, 버전 충돌 | 롤백 + 이유 안내. 충돌이면 최신 값을 보여 주고 선택을 받음 |

### 서버 쪽 전제

- 재시도가 중복 반영되지 않도록 **멱등 키**를 보낸다. [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/).
- 충돌 감지는 버전 비교(낙관적 잠금)로 한다. [낙관적·비관적 잠금](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/).
- 서버가 이벤트로 후속 처리를 하는 구조라면 응답 시점에 모든 읽기 모델이 최신이 아닐 수 있다. 이는 집합체 간 결과적 일관성과 같은 성질이다. [집합체·도메인 이벤트](/develop-wiki/knowledge/architecture/aggregate-domain-events/). 방금 쓴 항목은 응답에 담아 돌려받거나, 클라이언트가 자기 쓰기를 읽기 결과에 합쳐 보여 준다.

## 언제 쓰나

- 실패율이 낮고 되돌리기 쉬운 가벼운 변경: 좋아요, 북마크, 읽음 표시, 할 일 체크, 채팅 전송.
- 지연이 체감 품질을 좌우하는 화면, 오프라인에서도 입력을 받아야 하는 앱.

## 주의·비용

- **돈·재고·권한처럼 되돌릴 수 없거나 실패 비용이 큰 작업에는 쓰지 않는다.** 결제 완료 화면을 먼저 보여 줬다가 실패하면 신뢰 문제가 된다. 이때는 "처리 중" 상태를 명시한다.
- 롤백 때 그 사이 다른 낙관 변경이 이미 쌓였으면, 스냅샷 복원이 최근 변경까지 지울 수 있다. 변경을 직렬 큐로 처리하거나 변경 단위로 되돌린다.
- 재조회가 낙관 값을 덮어쓰는 경합이 가장 흔한 버그다(그래서 문서가 진행 중 조회 취소를 단계에 넣는다).
- 실패를 조용히 되돌리면 사용자는 이유를 모른다. 최소한 토스트·인라인 표시가 필요하다.
- 상태가 `pending/failed` 를 갖게 되면 화면·테스트 경우의 수가 늘어난다. 단방향 상태 모델([MVVM·MVI·UDF](/develop-wiki/knowledge/mobile-dev/mvvm-mvi-udf/))이 이를 다루기 쉽다.
- 접근성: 상태 변화(전송 중, 실패)를 보조 기술에 알려야 한다. 색만으로 구분하지 않는다.

> 출처 확인 범위: TanStack Query 의 optimistic updates 문서, Android 오프라인 우선 가이드(이전 노트에서 읽은 범위), Fowler 의 Domain Event 글을 근거로 했다. 결과적 일관성의 고전 정의(Vogels, ACM Queue)는 접근 거부(403)로 읽지 못해 출처에 넣지 않았다. "응답에 쓴 항목을 담아 돌려받는다"는 구체 대응은 일반적 설계 관행으로 특정 1차 출처가 없다.
