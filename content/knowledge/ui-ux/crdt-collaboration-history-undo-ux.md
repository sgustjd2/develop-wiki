---
title: CRDT 협업의 변경 이력·되돌리기 UX
aka: [CRDT Version History UX, Collaborative Undo, Selective Undo, Yjs UndoManager, Automerge heads, 협업 편집 변경 이력]
category: ui-ux
group: patterns
level: advanced
summary: Yjs·Automerge 같은 CRDT 위에서 "내 변경만 되돌리기", 과거 시점 보기, 버전 비교·복원 화면을 만들 때 라이브러리가 주는 기능(UndoManager, 스냅샷, heads·view·diff)과 그 한계, Ink & Switch 의 작가 연구에서 나온 설계 단서.
tags: [crdt, collaboration, undo, version-history, yjs, automerge, local-first, patterns]
related: [ui-ux/offline-conflict-resolution-ux, ui-ux/offline-outbox-background-sync, ui-ux/confirmation-vs-undo, ui-ux/multi-tab-sync-draft-restore, ui-ux/live-regions-announcements, distributed-systems/crdt]
sources:
  - https://docs.yjs.dev/api/undo-manager
  - https://github.com/yjs/yjs/blob/v13/src/utils/Snapshot.js
  - https://cdn.jsdelivr.net/npm/@automerge/automerge@3.5.0/dist/implementation.d.ts
  - https://www.inkandswitch.com/upwelling/
  - https://www.inkandswitch.com/essay/local-first/
updatedAt: 2026-11-19
---

CRDT 자체는 [CRDT](/develop-wiki/knowledge/distributed-systems/crdt/), 필드 단위 충돌 화면은 [오프라인 충돌 해결 UX](/develop-wiki/knowledge/ui-ux/offline-conflict-resolution-ux/)에 있다. 이 노트는 **자동 병합된 뒤 "무엇이 바뀌었고 어떻게 되돌리는가"**를 다룬다.

## 문제

- 여러 사람이 동시에 편집하면 Ctrl+Z 의 의미가 애매하다. 전역 되돌리기는 **남의 방금 입력**을 지울 수 있다.
- CRDT 는 충돌 없이 합쳐 주지만, 합쳐진 결과가 의도와 맞는지는 사람이 봐야 한다. Ink & Switch 의 로컬 우선 에세이도 병합 결과를 이해하려면 변경 이력을 볼 수 있어야 한다고 지적한다.
- "이전 버전으로 복원"을 과거로 되감기로 구현하면, 다른 복제본이 가진 그 이후 변경과 다시 합쳐질 때 결과를 예측하기 어렵다.

## 해법

### 1. 되돌리기는 "내 변경만" (선택적 undo)

Yjs `UndoManager` 공식 문서에서 확인한 동작:

- 범위(공유 타입)를 지정해 만들고, **추적할 트랜잭션 origin** 을 `trackedOrigins` 로 정한다. 기본은 origin 이 없는(null) 로컬 변경만 추적하고, `trackedOrigins` 에 없는 origin 의 변경은 무시한다. 따라서 원격 변경을 적용할 때 별도 origin 을 붙이면 스택에 들어가지 않는다(사용하는 provider 가 어떤 origin 을 쓰는지는 provider 문서로 확인).
- `captureTimeout`(기본 500ms) 안의 연속 변경은 한 단위로 묶인다. `stopCapturing()` 으로 경계를 강제로 끊는다.
- `stack-item-added`/`stack-item-popped` 이벤트의 `stackItem.meta` 에 커서 위치 등을 저장했다가 되돌릴 때 복원할 수 있다.

```ts
import * as Y from 'yjs';

const doc = new Y.Doc();
const text = doc.getText('body');
const undo = new Y.UndoManager(text, { captureTimeout: 500 });

undo.on('stack-item-added', (e: any) => e.stackItem.meta.set('cursor', editor.getCursor()));
undo.on('stack-item-popped', (e: any) => editor.setCursor(e.stackItem.meta.get('cursor')));

toolbarBoldButton.onclick = () => { undo.stopCapturing(); applyBold(); }; // 서식 변경은 별도 단계
```

- 위 코드는 문서의 API 이름으로 작성했고 실행하지 않았다(`editor` 는 가상의 에디터 객체).
- Automerge 3.5.0 의 공개 타입 정의(`implementation.d.ts`)에는 undo/redo 함수가 없다. Automerge 에서 되돌리기는 에디터 바인딩이나 앱이 역연산을 만들어야 한다.

### 2. 과거 시점 보기와 비교

| 필요 | Yjs (13.x) | Automerge (3.5.0) |
| --- | --- | --- |
| 시점 표시 | `Y.snapshot(doc)` 로 상태 벡터+삭제 집합 저장 | `getHeads(doc)` 로 해시 배열 저장 |
| 그 시점 문서 | `Y.createDocFromSnapshot(doc, snap)`. **원본 doc 의 `gc` 가 꺼져 있어야** 하고 아니면 오류를 던진다(소스 확인) | `view(doc, heads)`: 메모리를 공유하는 읽기 전용 사본. `change()` 에 넘길 수 없다 |
| 두 시점 차이 | (이 노트에서 확인하지 않음) | `diff(doc, before, after)` 로 패치 목록. 경로 한정 `diffPath` 는 experimental |
| 변경 설명 | (트랜잭션 origin 으로 출처 구분) | `change(doc, { message, time }, fn)`. `time` 은 참고용이며 병합에 쓰이지 않는다 |

- Automerge 의 `getHistory` 는 타입 정의에 `@hidden` 으로 표시돼 있다. 공개 API 로 가정하지 않는다.
- 이력 저장 비용: Yjs 는 GC 를 끄면 삭제된 내용도 계속 보관해 문서가 커진다. Automerge 는 `view`·`diff` 가 과거 heads 를 요구하는 구조라 변경 이력을 문서와 함께 보관한다.

### 3. 복원은 "새 변경"으로 만든다

- 과거 시점의 내용을 읽어 와 **현재 문서에 새 변경으로 적용**한다. 그러면 복원 자체도 이력에 남고, 다른 사람의 동시 변경과 일반 규칙대로 합쳐진다.
- 화면에는 "3월 2일 버전으로 복원함 (되돌리기 가능)"처럼 복원 행위를 하나의 이력 항목으로 보여 준다([확인 vs 되돌리기](/develop-wiki/knowledge/ui-ux/confirmation-vs-undo/)).
- 이 방식은 위 API 들의 성질(읽기 전용 view, 원본을 바꾸지 않는 스냅샷 문서)에서 나온 설계 판단이다. 라이브러리 문서가 이 절차를 정해 두지는 않았다.

### 4. Ink & Switch Upwelling(2023)에서 나온 단서

작가·편집자 인터뷰와 Automerge 기반 프로토타입 연구다. 요점만 옮긴다.

- 실시간 공동 편집이 늘 좋은 건 아니다. 작가들은 미완성 글을 누가 지켜보는 상황을 불편해했다. → **비공개 초안(draft)** 에서 작업하고 준비되면 합치는 흐름을 제공했다.
- 변경 추적은 미리 켜 두지 않아도 항상 기록되고, 나중에 "변경 보기"를 켜서 본다. 기여자별 색으로 구분하고, 삭제는 취소선 대신 작은 표식으로 숨겨 읽기 부담을 줄였다.
- 자동 병합은 문법적으로 어색한 결과나 용어 불일치 같은 **의미 충돌**을 잡지 못한다. 그래서 검토를 쉽게 만드는 데 집중했다.
- 한계로 부분 되돌리기 미지원, 전체 이력 보관에 따른 민감 정보 문제를 스스로 적었다.

## 언제 쓰나

- 실시간 공동 편집기(문서·화이트보드·스프레드시트)에서 undo·버전 기록을 설계할 때.
- 오프라인 편집 뒤 자동 병합 결과를 사용자에게 설명해야 할 때.

## 주의·비용

- 이력을 영구 보관하면 저장량이 계속 늘고, **지운 내용이 이력에 남는다.** 개인정보 삭제 요청과 충돌할 수 있다. 이력 보존 기간·압축 정책을 먼저 정한다.
- 선택적 undo 는 남의 변경과 얽힌 내 변경을 되돌릴 때 결과가 직관과 다를 수 있다(예: 내가 쓴 문장 안에 남이 단어를 추가한 뒤 내 입력을 되돌리기). 이런 경우의 실제 결과는 라이브러리별로 확인해야 한다.
- 시점 비교 화면에서 색만으로 작성자·추가·삭제를 구분하지 않는다(WCAG 1.4.1). 복원·되돌리기 결과는 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)으로 알린다.
- 타임스탬프는 기기 시계라 순서 판단에 쓰지 않는다. 표시용으로만 쓴다.

## 검증 범위

- 확인함: Yjs UndoManager 옵션·이벤트는 docs.yjs.dev, `createDocFromSnapshot` 의 gc 조건은 yjs v13 브랜치 소스, Automerge 함수 시그니처·주석은 npm 3.5.0 의 `implementation.d.ts`·`types.d.ts`, Upwelling 내용은 Ink & Switch 원문.
- 확인 못 함: Yjs 14(npm beta)의 이력·attribution API 변화, Yjs 의 두 스냅샷 간 diff 표시 방법, y-prosemirror 등 에디터 바인딩의 undo 동작, Automerge 3.5 의 author API 세부. 코드 예시는 실행하지 않았다.
