---
title: CRDT 이력과 개인정보 삭제 (삭제권 vs 변경 이력)
aka: [CRDT Right to Erasure, GDPR Article 17 CRDT, Yjs garbage collection, Automerge history deletion, Tombstone Personal Data, 협업 문서 개인정보 삭제]
category: ui-ux
group: patterns
level: advanced
summary: CRDT 협업 문서에서 지운 텍스트가 이력·업데이트 로그·다른 복제본에 남는 문제를 GDPR 제17조 삭제권과 대비하고, Yjs gc 와 Automerge 이력 보존을 직접 실행해 확인한 결과로 설계 선택지를 정리한다.
tags: [crdt, privacy, gdpr, right-to-erasure, yjs, automerge, version-history, local-first, patterns]
related: [ui-ux/crdt-collaboration-history-undo-ux, ui-ux/offline-conflict-resolution-ux, ui-ux/offline-outbox-background-sync, ui-ux/research-ethics-consent-recruiting, distributed-systems/crdt, mobile-dev/social-login-account-linking-deletion, security/secrets-management]
sources:
  - https://gdpr-info.eu/art-17-gdpr/
  - https://gdpr-info.eu/art-12-gdpr/
  - https://github.com/yjs/yjs/blob/main/README.md
  - https://github.com/yjs/yjs/blob/v13/src/utils/Snapshot.js
  - https://automerge.org/docs/reference/under-the-hood/storage/
updatedAt: 2026-11-19
---

이력·되돌리기 화면 자체는 [CRDT 협업의 변경 이력·되돌리기 UX](/develop-wiki/knowledge/ui-ux/crdt-collaboration-history-undo-ux/)에 있다. 이 노트는 그 이력이 **지워야 할 개인정보를 붙잡고 있는 문제**를 다룬다. 법률 자문이 아니며, 법 조항은 요지만 옮겼다.

## 문제

- 사용자가 협업 문서에 전화번호·주민번호를 붙여 넣었다가 지웠다. 화면에서는 사라졌지만 CRDT 는 병합을 위해 삭제 연산과 그 대상 정보를 남길 수 있다. 버전 기록 기능을 켰다면 지운 내용이 일부러 보존된다.
- 사용자가 탈퇴하며 자기 데이터 삭제를 요구하면, 그 사람이 쓴 문장이 다른 사람과 공유한 문서의 이력 속에 섞여 있다.
- 로컬 우선(local-first) 구조에서는 복제본이 각 기기에 있다. 서버에서 지워도 오프라인 기기에 남는다.

## 해법

### 1. 법이 요구하는 것 (GDPR 요지)

- 제17조(1): 목적이 끝났거나, 동의를 철회했거나, 불법 처리였던 경우 등에는 정보주체 요청 시 "지체 없이" 지워야 한다.
- 제17조(2): 공개한 데이터라면 기술·비용을 고려한 합리적 조치로 그 데이터를 처리하고 있는 다른 컨트롤러(controller)에게 링크·사본·복제본 삭제 요청을 알린다.
- 제17조(3): 표현의 자유, 법적 의무, 공익 기록 보존, 법적 청구 방어 등은 예외.
- 제12조(3): 요청에 대한 조치 결과는 원칙적으로 1개월 안에 알리고, 복잡하면 2개월 연장할 수 있다(연장 사유는 첫 달 안에 통지).
- 한국 개인정보 보호법 등 다른 관할의 요건은 이 노트에서 확인하지 않았다.

### 2. 라이브러리 동작 (직접 실행: yjs 13.6.33, @automerge/automerge 3.5.0)

문자열 `note: <비밀>` 을 넣고 `<비밀>` 을 지운 뒤 바이트에 비밀 문자열이 남는지 확인했다.

| 경우 | 결과 |
| --- | --- |
| Yjs `gc: true`(기본값) 문서의 `encodeStateAsUpdate` | 비밀 문자열 **없음** |
| Yjs `gc: false` 문서의 `encodeStateAsUpdate` | **있음**. 삭제 전 스냅숏에서 원문 복원됨 |
| Yjs `gc: true` 에서 스냅숏 복원(`createDocFromSnapshot`) | 오류: gc 를 꺼야 함 |
| Yjs 증분 업데이트 로그(`update` 이벤트로 받은 바이트) | 첫 업데이트에 **있음** |
| 그 로그를 `Y.mergeUpdates` 로 합친 결과 | **있음** (합치기는 gc 하지 않음) |
| 합친 로그를 gc 켠 새 문서에 적용 후 다시 인코딩 | 없음 |
| Automerge `save()` 결과 바이트 | **있음** |
| Automerge 저장본을 `load` 후 삭제 전 heads 로 `view` | 원문 그대로 보임 |
| Automerge 현재 값만 새 문서(`from`)로 복사 | 없음. 단 heads 가 달라 기존 복제본과 병합 이력이 끊김 |

- Yjs README 설명과 맞는다: 내용이 있는 구조체가 삭제되면 내용 없는 `ItemDeleted` 로 바뀌고, 부모가 삭제되면 자식은 존재·삭제 사실만 남는 `GC` 구조체가 된다. `doc.gc = false` 는 옛 내용을 복원하려고 gc 를 끄는 옵션이다.
- Automerge 저장소 문서: automerge-repo 는 변경마다 증분 청크를 저장하고, 가끔 전체를 스냅숏 하나로 압축(compaction)한다. 이력 자체를 잘라 내는 기능은 읽은 문서에서 찾지 못했다.

### 3. 설계 선택지 (필자 제안)

| 선택지 | 방법 | 대가 |
| --- | --- | --- |
| 이력 없는 Yjs | gc 켬, 스냅숏·버전 기록 기능을 쓰지 않음, 업데이트 로그를 주기적으로 상태 하나로 재인코딩 | 과거 시점 보기·복원 불가 |
| 재기준(rebase) | 삭제 요청 시 현재 상태만으로 새 문서를 만들고 모든 복제본을 교체 | 오프라인 기기의 미동기 변경 병합 불가 → 사용자에게 알리고 버림 처리 |
| 민감 필드 분리 | 개인정보는 CRDT 밖(서버 DB)에 두고 문서에는 참조 ID 만 | 오프라인 편집·검색 제약 |
| 암호화 삭제(crypto-shredding) | 사용자별 키로 내용을 암호화해 넣고, 삭제 시 키를 폐기 | 키 관리 비용, 법적 "삭제"로 인정되는지 별도 판단 필요(미확인) |

- 어떤 선택이든 **서버 백업, 검색 색인, 로그, 오프라인 기기**까지 삭제 범위를 문서화한다.

### 4. 화면 설계 (필자 제안)

- 버전 기록이 켜진 문서에는 "지운 내용도 기록에 남습니다"를 붙여 넣기 경고나 문서 정보에 표시한다.
- "영구 삭제" 동작은 일반 삭제와 분리하고, 다른 협업자 기기에 남을 수 있음(오프라인 복제본)을 알린다.
- 삭제 요청 처리 결과 화면에 무엇이 지워졌고 무엇이 남는지(법적 보존 예외 포함)를 적는다.

## 언제 쓰나

- CRDT 로 문서·메모·디자인 협업 기능을 만들면서 버전 기록·되돌리기를 제공할 때.
- 개인정보가 들어갈 수 있는 자유 입력 문서(고객 상담 메모, 의료·교육 기록)를 local-first 로 만들 때.

## 주의·비용

- gc 를 켜도 **이미 보낸 증분 업데이트**는 상대 기기·서버 로그·백업에 남는다. 저장소가 업데이트를 그대로 쌓는지, 언제 재인코딩하는지 확인한다.
- Yjs 기본 `gc: true` 에서도 삭제 사실·길이 같은 메타데이터는 남는다. 이것이 개인정보인지는 서비스별 판단이다.
- 재기준은 공동 편집자의 실행 취소 스택·과거 시점 링크를 깨뜨린다.
- "기술적으로 어렵다"는 그 자체로 제17조(3) 예외 목록에 없다. 설계 단계에서 정한다(필자 의견).

## 검증 범위

- 확인함: GDPR 제17·12조 요지는 gdpr-info.eu 의 조문 재게시본(EUR-Lex 원문 페이지는 자동 접근이 차단돼 열지 못함). Yjs gc·`ItemDeleted`·`GC` 구조체·`mergeUpdates` 설명은 README, 스냅숏 복원의 gc 조건은 v13 브랜치 `Snapshot.js` 소스, Automerge 저장 방식은 공식 문서. 표 2 는 스크래치에서 직접 실행.
- 확인 못 함: Automerge 에 이력을 잘라 내는 공식 API 가 있는지, y-indexeddb·y-websocket 서버 등 저장 계층의 압축 주기, 암호화 삭제의 법적 지위, 한국 개인정보 보호법의 파기 요건. 법률 해석은 하지 않았다.
