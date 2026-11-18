---
title: 오프라인 우선 설계와 동기화·충돌 해결
aka: [Offline-first, Local-first, Sync, Conflict Resolution, Last Write Wins, Write Queue]
category: mobile-dev
group: architecture
level: advanced
summary: 로컬 저장소를 진실 공급원으로 삼아 네트워크 없이도 읽고 쓰게 하고, 연결이 돌아오면 큐·재시도·버전 정보로 서버와 맞추는 설계.
tags: [mobile, offline, sync, conflict, workmanager, repository]
related: [mobile-dev/background-work-constraints, mobile-dev/clean-architecture-mobile, mobile-dev/push-notification-architecture, distributed-systems/consistency-models, distributed-systems/idempotency, performance/timeout-retry-circuit-breaker]
sources:
  - https://developer.android.com/topic/architecture/data-layer/offline-first
  - https://developer.android.com/topic/architecture
updatedAt: 2026-11-18
---

## 문제

- 엘리베이터, 지하철, 로밍처럼 모바일 네트워크는 자주 끊기고 느리다. 요청이 끝나길 기다리는 화면은 "빈 화면 또는 스피너"가 된다.
- 서버를 진실로 두고 매번 읽으면 오프라인에서 앱이 쓸모없어지고, 오프라인에서 쓴 데이터는 사라질 위험이 있다.
- 두 기기가 오프라인에서 같은 데이터를 고치면 합칠 때 충돌한다.

## 해법

### 구조: 로컬이 진실, 네트워크는 동기화 대상

Android 가이드의 정의로 오프라인 우선은 "최소한 읽기는 네트워크 없이 된다"이다. 네트워크를 쓰는 Repository 는 **항상 로컬 데이터 소스를 가진다.**

- 읽기: UI → Repository → **로컬 DB 의 관찰 가능한 스트림**(Flow, Combine, Core Data/SwiftData 관찰). 네트워크 결과는 먼저 로컬에 쓰고, 로컬 변경이 UI 로 흘러간다.
- 쓰기: 비동기 API(suspend, async). 로컬에 먼저 기록하고 서버 반영은 큐로 미룬다.
- 상위 계층(도메인, UI)은 네트워크에 직접 접근하지 않는다. 네트워크는 Repository 뒤에 숨긴다.

```kotlin
class NotesRepository(private val dao: NoteDao, private val api: NoteApi, private val outbox: OutboxDao) {
    fun notes(): Flow<List<Note>> = dao.observeAll()            // 읽기는 항상 로컬
    suspend fun save(note: Note) {                              // 쓰기: 로컬 + 큐
        dao.upsert(note.copy(version = note.version + 1, dirty = true))
        outbox.enqueue(OutboxItem(noteId = note.id, op = "UPSERT"))
        // 실제 전송은 WorkManager(네트워크 연결 제약)가 큐를 비운다
    }
}
```

### 쓰기 전략 3가지(공식 가이드 분류)

| 전략 | 방식 | 적합한 경우 |
| --- | --- | --- |
| 온라인 전용 쓰기 | 네트워크 성공 후에만 로컬 갱신 | 송금처럼 실시간 성공이 필수 |
| 큐 쓰기 | 큐에 넣고 연결 시 지수 백오프로 비움 | 분석 이벤트, 로그처럼 유실되어도 치명적이지 않은 것 |
| 지연(lazy) 쓰기 | 로컬에 먼저 쓰고 서버 반영을 나중에 | 사용자 입력이 소중한 할 일·메모 앱. 충돌 처리 필요 |

### 동기화 방식

- **풀(pull)**: 화면에 들어가기 직전에 가져온다. 구현이 쉽고 안 쓰는 데이터는 안 받지만, 반복 방문 시 중복 요청이 늘고 관계형 데이터에 약하다.
- **푸시(push)**: 처음에 기준선을 받고, 이후 서버가 "바뀌었다"고 알리면 그 부분만 가져온다. 오래 오프라인이어도 동작하지만 서버가 변경 알림을 지원해야 하고 버전 관리가 어렵다. 푸시 알림(FCM 데이터 메시지 등)을 트리거로 쓸 수 있다.
- 실무는 혼합이다. 피드는 풀, 내 프로필·설정은 푸시.

### 충돌 해결

- 충돌 해결은 보통 **버전/타임스탬프 메타데이터**가 필요하다. 클라이언트가 수정 시각이나 기반 버전을 같이 보내고, 서버가 최종 판정자가 된다.
- 모바일에서 흔한 기본값은 **last write wins**: 더 늦은 쓰기가 이긴다. 단순하지만 먼저 쓴 사용자의 변경이 조용히 사라진다.
- 대안: 필드 단위 병합, 서버 버전 번호 비교(낙관적 잠금) 후 충돌 시 사용자에게 선택 UI, 또는 CRDT 같은 자동 병합 구조(구현 비용 큼).

## 언제 쓰나

- 현장 업무, 노트·할 일, 문서 편집, 지도·여행처럼 연결이 불안정하거나 즉각적인 반응이 가치인 앱.
- 반대로 은행 이체·재고 확정처럼 항상 최신이어야 하는 도메인은 온라인 전용 쓰기를 섞는다.

## 주의·비용

- 쓰기 재시도는 **멱등**이어야 한다. 요청에 클라이언트가 만든 ID(멱등 키)를 달아 중복 반영을 막는다. [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) 참고.
- last write wins 는 시계 오차에 취약하다. 기기 시계를 믿지 말고 서버 타임스탬프나 서버 버전 번호를 쓴다.
- 삭제는 "지웠다"는 표시(tombstone)를 남겨 동기화해야 다른 기기에서 되살아나지 않는다.
- 로컬 스키마 마이그레이션, 큐 영속화, 부분 실패 복구, 사용자에게 보이는 "동기화 중/실패" 상태까지 설계 범위가 커진다. 읽기 캐시만으로 충분한지 먼저 따져본다.
- 동기화 작업은 OS 백그라운드 제약을 받는다. [백그라운드 작업 제약](/develop-wiki/knowledge/mobile-dev/background-work-constraints/) 참고.
- Firestore 같은 관리형 서비스는 디스크 캐시·오프라인 쓰기 큐·양방향 동기화를 SDK 가 처리해 직접 구현 비용을 줄이지만, 충돌 정책을 세밀하게 제어하기 어렵다(공식 가이드의 "커스텀 vs 관리형" 구분).
