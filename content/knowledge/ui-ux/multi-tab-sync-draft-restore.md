---
title: 다중 탭 동기화와 입력 임시 저장·복원
aka: [BroadcastChannel, Cross-tab Sync, Draft Autosave, Form Draft Restore, storage event, 입력 임시저장]
category: ui-ux
group: patterns
level: intermediate
summary: 같은 앱을 여러 탭에서 열었을 때 BroadcastChannel·localStorage 로 상태를 맞추고, 작성 중 입력을 임시 저장해 새로고침·세션 만료 후 복원하는 설계.
tags: [broadcastchannel, multi-tab, session, draft, autosave, localstorage, forms]
related: [ui-ux/session-timeout-ux, ui-ux/confirmation-vs-undo, ui-ux/form-inline-validation, ui-ux/multi-step-form-wizard, ui-ux/toast-notification-banner, ui-ux/error-messages, ui-ux/live-regions-announcements]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
  - https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
  - https://www.w3.org/TR/WCAG22/#redundant-entry
updatedAt: 2026-11-19
---

## 문제

- 한 탭에서 로그아웃했는데 다른 탭은 로그인된 채라 요청이 갑자기 401 로 실패한다.
- 두 탭에서 같은 문서를 편집해 나중 저장이 앞선 저장을 조용히 덮어쓴다.
- 긴 양식을 쓰다가 세션이 만료되거나 탭이 새로고침되어 입력이 사라진다([세션 만료 UX](/develop-wiki/knowledge/ui-ux/session-timeout-ux/)).

## 해법

### 1. 탭 간 통신 수단 (MDN)

| 수단 | 특징 |
| --- | --- |
| `BroadcastChannel` | 같은 출처·같은 저장소 파티션의 탭·iframe·워커에 메시지 전달. 구조화 복제로 객체 전송. 보낸 객체 자신은 수신하지 않음. 메시지 의미는 직접 정의해야 함 |
| `storage` 이벤트 | `localStorage` 가 바뀌면 **같은 출처의 다른 문서**에 발생. 변경한 문서에는 발생하지 않음. `sessionStorage` 는 같은 탭 안 프레임에만 |
| `visibilitychange` | `hidden` 전환이 페이지가 마지막으로 안정적으로 관측하는 시점. 저장·전송은 여기서 |

- `BroadcastChannel` 은 메시지 통로일 뿐 **저장은 하지 않는다**. 나중에 연 탭은 과거 메시지를 못 받으므로 현재 상태는 `localStorage`(또는 IndexedDB)에 두고, 변경 알림을 채널로 보낸다.
- 개인정보 모드·저장소 차단·파티셔닝(최상위 사이트별 분리)에서는 통신이 막힐 수 있다. 실패해도 단일 탭에서 정상 동작해야 한다.

### 2. 동기화할 것과 하지 않을 것

| 동기화 | 하지 않음 |
| --- | --- |
| 로그인/로그아웃, 세션 연장 | 입력 중인 필드 값(탭마다 다른 작업일 수 있음) |
| 읽지 않은 알림 수·테마·언어 | 스크롤·포커스·펼침 상태 |
| 저장 완료 사실(다른 탭의 낡은 화면 갱신) | 서버가 권위를 갖는 값을 낙관적으로 덮어쓰기 |

- 로그아웃은 모든 탭에서 같은 화면(재로그인 안내)으로 수렴시킨다. 다른 탭에 작성 중인 내용이 있으면 바로 지우지 말고 임시 저장 후 안내한다.

### 3. 충돌: 마지막 쓰기 vs 버전 확인

- 메시지에 `tabId`·`rev`(단조 증가 번호)를 넣고 더 낮거나 같은 `rev` 는 무시한다.
- 편집 문서는 서버가 낙관적 동시성(버전/ETag 확인)을 해야 최종 보호된다. 탭 간 메시지는 **UX 보조**이지 정합성 보장이 아니다.
- 충돌이 나면 조용히 덮지 말고 "다른 탭에서 수정됨 — 불러오기/내 것 유지" 같은 선택을 준다([확인 vs 되돌리기](/develop-wiki/knowledge/ui-ux/confirmation-vs-undo/)).

### 4. 코드: 임시 저장 + 탭 동기화 (Node 의 BroadcastChannel + jsdom localStorage 로 확인)

```ts
function draftSync(tabId: string, key: string, onRemote: (v: string) => void) {
  const bc = new BroadcastChannel('draft:' + key);
  let rev = 0;
  bc.onmessage = (e) => {
    const m = e.data;
    if (m.tabId !== tabId && m.rev > rev) { rev = m.rev; onRemote(m.value); }
  };
  return {
    save(value: string) {
      rev += 1;
      localStorage.setItem('draft:' + key, JSON.stringify({ rev, value, at: Date.now() }));
      bc.postMessage({ tabId, rev, value });
    },
    restore() {
      const s = localStorage.getItem('draft:' + key);
      if (!s) return null;
      const d = JSON.parse(s); rev = Math.max(rev, d.rev); return d;
    },
    clear() { localStorage.removeItem('draft:' + key); }, // 제출 성공 후
    close: () => bc.close(),
  };
}
```

- 확인한 동작: 탭 A 의 `save` 를 탭 B 가 수신, 새 탭이 `restore()` 로 값 복원, 자기 채널에서는 자기 메시지를 받지 않음, `clear()` 후 복원 결과 없음. 실제 여러 브라우저 탭이 아니라 **한 Node 프로세스 안의 채널 객체 여러 개**로 검증했다. 다중 프로세스·실제 탭에서의 지연·순서와 Safari 등 브라우저 차이는 확인하지 못했다.
- 호출 시점: 입력 디바운스 저장 + `visibilitychange`(hidden) 시 즉시 저장. `beforeunload` 는 모바일·강제 종료에서 믿기 어렵다고 알려져 있다(MDN 해당 페이지는 비교하지 않음 — 일반 지식).

### 5. 복원 UX

- 복원은 **자동 덮어쓰기보다 알림 + 선택**: "저장하지 않은 내용이 있어요(방금 전). 이어서 쓰기 / 버리기". 최종 제출된 항목에서는 임시 저장을 지운다.
- 복원 안내는 [토스트/배너](/develop-wiki/knowledge/ui-ux/toast-notification-banner/)와 낭독기 알림([라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/))을 쓴다.
- 이미 입력한 정보를 다시 요구하지 않는 것은 WCAG 2.2 의 Redundant Entry(3.3.7) 취지와도 맞는다. 단계형 양식이면 [멀티스텝](/develop-wiki/knowledge/ui-ux/multi-step-form-wizard/)의 단계 데이터를 함께 저장한다.
- 만료 시간(예: 며칠 뒤 삭제)과 저장 범위를 정한다.

## 언제 쓰나

- 로그인 상태·알림·테마처럼 탭마다 달라지면 혼란스러운 전역 상태.
- 작성 시간이 긴 양식·편집기(글, 신청서, 설문).
- 짧은 입력(검색어, 한두 필드)에는 임시 저장이 과하다.

## 주의

- **민감정보를 `localStorage` 에 평문 저장하지 않는다**(같은 출처 스크립트가 읽을 수 있고 공용 PC 에 남는다). 비밀번호·결제 정보·주민번호 등은 저장 대상에서 제외하고, 로그아웃 시 정리한다.
- 공용 기기에서 다른 사람이 복원할 수 있다. 로그아웃/세션 종료 시 해당 사용자 초안을 삭제하거나 사용자별 키를 쓴다.
- 이벤트 폭주: 키 입력마다 저장·방송하지 않는다(디바운스).
- 스키마가 바뀐 뒤 옛 초안이 복원되면 깨진다. 초안에 버전을 넣고 안 맞으면 버린다.
- 탭 간 동기화 코드가 늘면 상태 관리 복잡도가 커진다. 서버가 권위이고 탭은 캐시라는 원칙을 유지한다.
- [한글 IME 조합](/develop-wiki/knowledge/ui-ux/korean-ime-composition-input/) 중에는 값을 덮어쓰지 않는다. 원격 변경을 현재 편집 중 필드에 적용할 때 특히 주의한다.

## 체크리스트

- [ ] 동기화 대상이 전역 상태로 한정돼 있다(입력 중 필드 제외)
- [ ] 메시지에 `tabId`·`rev`, 자기 메시지·낡은 메시지 무시
- [ ] 채널 생성 실패/미지원/차단 시 단일 탭으로 정상 동작
- [ ] 임시 저장은 디바운스 + `visibilitychange(hidden)`
- [ ] 복원은 알림 + 선택, 제출 성공 시 삭제
- [ ] 민감정보 제외, 사용자별 키, 로그아웃 시 정리, 만료
- [ ] 서버 쪽 버전 확인으로 최종 충돌 방지
- [ ] 컴포넌트 해제 시 `bc.close()`

## 흔한 실수

- `storage` 이벤트가 **같은 탭에서도** 온다고 가정(오지 않는다).
- BroadcastChannel 로 보낸 상태가 나중에 연 탭에도 전달된다고 가정.
- 로그아웃 방송과 동시에 초안을 지워 사용자 작업을 잃게 함.
- 초안 키를 사용자·문서 구분 없이 하나로 둠.
