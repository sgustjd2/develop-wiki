---
title: 확인 대화상자 vs 실행 취소
aka: [Confirmation Dialog, Undo, Destructive Action, Soft Delete, Error Prevention, Are you sure, 삭제 확인, 되돌리기]
category: ui-ux
group: patterns
level: intermediate
summary: 실수를 막는 두 방식, 실행 전에 묻는 확인 대화상자와 실행 후 되돌리는 실행 취소를 비교하고, 동작의 위험도·빈도에 따라 고르는 기준과 구현 방법.
tags: [ux, confirmation, undo, destructive-action, error-prevention, nngroup]
related: [ui-ux/modal-dialog, ui-ux/toast-notification-banner, ui-ux/error-messages, ui-ux/ux-writing-principles, mobile-dev/optimistic-ui-eventual-consistency, ui-ux/nielsen-usability-heuristics]
sources:
  - https://www.nngroup.com/articles/confirmation-dialog/
  - https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html
  - https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
updatedAt: 2026-11-19
---

## 문제

- 모든 삭제에 "정말 삭제하시겠습니까? [예] [아니요]"를 띄우면 사용자는 읽지 않고 "예"를 누르는 습관이 든다. 정작 위험한 순간에 확인이 아무것도 막지 못한다.
- 반대로 확인도 실행 취소도 없는 영구 삭제는 한 번의 실수로 데이터를 잃게 한다.

## 해법

### 1. 비교

| | 확인 대화상자 | 실행 취소 |
| --- | --- | --- |
| 시점 | 실행 전 | 실행 후 |
| 흐름 | 매번 끊김 | 끊기지 않음 |
| 습관화 | 자주 쓰면 무력화 | 거의 없음 |
| 효과 | 의도 재확인 | 실수를 알아챈 뒤 복구 |
| 구현 | 단순 | 지연 실행·소프트 삭제·역연산 필요 |
| 적합 | 드물고, 되돌릴 수 없고, 결과가 큰 동작 | 잦고, 되돌릴 수 있는 동작 |

NN/g(Nielsen, 2018)는 확인을 심각한 결과가 있는 동작에만 쓰고, 일상 동작에는 쓰지 말며, 확인으로 못 잡는 실수를 위해 실행 취소를 제공하라고 권한다.

### 2. 결정 기준

1. **되돌릴 수 있게 만들 수 있는가?** 가능하면 실행 취소(소프트 삭제·휴지통·보관). 대부분의 삭제는 여기로 간다.
2. 되돌릴 수 없다면(송금, 외부 발송, 영구 파기, 권한 회수) **확인**.
3. 매우 드물고 치명적이면 **강한 확인**: 대상 이름 입력 등 비표준 단계. 자주 쓰면 이것도 습관이 된다.
4. 법적 약속·금융 거래·데이터 삭제·시험 제출은 WCAG **3.3.4 (AA)**: 되돌릴 수 있음 / 입력 검사 후 수정 기회 / 제출 전 검토·확인 중 하나 이상.

### 3. 좋은 확인 대화상자

- 질문 대신 **대상과 결과**를 말한다: "‘2026 예산.xlsx’를 삭제할까요? 공유받은 3명도 접근할 수 없게 됩니다."
- 버튼은 **동사 + 대상**: [파일 삭제] [취소]. "예/아니요", "확인"은 피한다.
- 기본 선택(초기 포커스)을 파괴적 버튼에 두지 않는다. APG 도 되돌릴 수 없는 동작이면 가장 덜 파괴적인 동작에 초기 포커스를 권한다.
- 응답이 필수인 경고는 `role="alertdialog"`. → [모달](/develop-wiki/knowledge/ui-ux/modal-dialog/)

### 4. 실행 취소 구현 (지연 확정)

```ts
type Toast = (text: string, action: { label: string; onAction: () => void }) => void;

export function deleteWithUndo(
  id: string,
  deps: { hide(id: string): void; restore(id: string): void; commit(id: string): Promise<void>; toast: Toast },
  graceMs = 10_000,
) {
  deps.hide(id);                                          // 화면에서 즉시 제거
  const timer = setTimeout(() => { void deps.commit(id); }, graceMs);
  deps.toast('대화 1개를 삭제했습니다.', {
    label: '실행 취소',
    onAction: () => { clearTimeout(timer); deps.restore(id); },
  });
}
```

(Node 에서 실행 취소 시 commit 이 호출되지 않고, 유예 후에는 commit 되는 것을 확인했다.)

- 클라이언트 타이머만 믿으면 탭을 닫을 때 삭제가 누락되거나(지연 확정) 복구가 불가능해진다(즉시 확정). 더 견고한 방식은 **서버 소프트 삭제**(`deletedAt` 기록 → 실행 취소 시 해제 → 배치로 영구 삭제)다.
- 실행 취소 수단이 토스트뿐이면 놓치기 쉽다. 휴지통·기록·단축키(Ctrl/⌘+Z) 같은 두 번째 경로를 둔다. → [토스트](/develop-wiki/knowledge/ui-ux/toast-notification-banner/)

## 언제 쓰나

- 실행 취소: 메일 보관·삭제, 목록 항목 제거, 이동, 상태 변경, 편집기 작업.
- 확인: 계정 삭제, 결제·송금, 대량 발송, 되돌릴 수 없는 일괄 작업, 저장 안 한 변경을 버리고 나가기.
- 둘 다: 일괄 삭제(확인으로 개수 재확인 + 휴지통 복구).

## 체크리스트

- 파괴적 동작마다 "되돌릴 수 있나 / 얼마나 자주 하나 / 결과가 얼마나 큰가"를 표로 정리했다.
- 확인 문구에 대상·영향 범위가 들어 있고 버튼이 동사로 끝난다.
- 실행 취소가 서버 상태까지 되돌린다.
- 파괴적 버튼은 시각적으로 구별되고 다른 버튼과 떨어져 있다. → [터치 타깃](/develop-wiki/knowledge/ui-ux/touch-target-size/)

## 흔한 실수·주의

- **"정말요?" 만 있는 확인.** 사용자가 확인할 정보가 없다.
- **사용자를 위한 확인 대신 책임 회피용 확인.** 의미 없는 확인이 늘수록 진짜 경고가 묻힌다.
- **실행 취소가 있는데 확인도 띄움.** 이중 마찰이다.
- **외부 부수 효과가 있는 동작에 실행 취소 약속.** 이메일 발송·웹훅은 되돌릴 수 없다. 발송 자체를 몇 초 지연하는 "보내기 취소"처럼 설계해야 정직하다.
