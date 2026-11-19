---
title: 다단계 폼·마법사 (진행 표시와 데이터 보존)
aka: [Multi-step Form, Wizard, Stepper, Progress Indicator, Form Steps, 단계별 입력]
category: ui-ux
group: patterns
level: intermediate
summary: 긴 폼을 단계로 나눌 때 단계 수 안내, 제목·진행 표시, 이전 단계 수정, 입력 보존, 확인 화면까지를 접근성과 함께 설계하는 방법.
tags: [ux, forms, wizard, stepper, progress, accessibility]
related: [ui-ux/form-inline-validation, ui-ux/cognitive-load-progressive-disclosure, ui-ux/error-messages, ui-ux/keyboard-focus-management, ui-ux/session-timeout-ux, ui-ux/cognitive-accessibility]
sources:
  - https://www.w3.org/WAI/tutorials/forms/multi-page/
  - https://design-system.service.gov.uk/patterns/question-pages/
  - https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
updatedAt: 2026-11-19
---

## 문제

- 긴 폼 한 페이지는 부담스럽지만, 나누면 "지금 어디고 얼마나 남았나", "뒤로 가면 입력이 사라지나" 가 새 문제가 된다.
- 단계가 바뀌어도 낭독기에는 페이지 변화가 전달되지 않는 SPA 구현이 많다.

## 해법 (W3C WAI 다중 페이지 폼 튜토리얼·GOV.UK 질문 페이지 지침 요지)

1. **시작 전에 총 단계 수를 알린다**, 각 단계에서 현재 위치를 보여 준다.
2. **제목에 진행을 앞쪽에 둔다**: `<title>` = "2/3단계: 결제 - 주문", `<h1>` = "결제 (2/3단계)". 오류가 있으면 그 표기도 앞에 둔다.
3. 단계 수가 고정이면 **순서 있는 목록(`<ol>`)** 을 진행 표시로 쓰고 현재 단계는 시각 + 숨김 텍스트("현재 단계")로 표시한다. 단계 수가 입력에 따라 변하면 `<progress>` 를 쓴다(일부 OS 의 애니메이션은 WCAG 2.2.2 를 해칠 수 있어 정지시킨다는 것이 W3C 의 주의).
4. **완료한 단계는 링크**로 두어 되돌아가 수정할 수 있게 하고, 이때 현재 단계 입력도 저장한다.
5. 모든 단계에 공통 안내를 반복하고, 선택 단계는 제목에 표시해 건너뛰기 쉽게 한다.
6. 논리적 묶음(배송/결제)으로 단계를 나눈다. 한 페이지 한 질문(GOV.UK 기본값)이 맞는지는 연구로 정한다. 진행 표시는 없이도 테스트해 보고 필요할 때만 추가하라는 것이 GOV.UK 의 입장이다.
7. 마지막에 **확인 화면**: 입력 요약 + 각 항목의 "수정" 링크 + 제출 버튼.
8. 한 번 입력한 정보를 다시 묻지 않는다. WCAG 3.3.7 Redundant Entry(A)가 같은 과정에서 이미 입력한 정보의 재입력을 줄이도록 요구한다(이 항목은 Understanding 문서 본문을 읽지 못하고 기억에 근거해 요약했다).

### 코드: 단계 상태와 제목 (node 로 확인한 로직)

```ts
const steps = ['배송지', '결제', '확인'] as const;
type Data = Record<string, string>;

class Wizard {
  i = 0; data: Data = {};
  title(site = '주문') { return `${this.i + 1}/${steps.length}단계: ${steps[this.i]} - ${site}`; }
  next(patch: Data) { this.data = { ...this.data, ...patch }; this.i = Math.min(this.i + 1, steps.length - 1); }
  goto(i: number, patch: Data) { this.data = { ...this.data, ...patch }; this.i = i; } // 이동 전 현재 입력 보존
}
// new Wizard().title() === '1/3단계: 배송지 - 주문'  (위치는 title 의 앞쪽)
```

- 단계 전환 후에는 [포커스를 새 `<h1>`(tabindex=-1)로 옮기고](/develop-wiki/knowledge/ui-ux/keyboard-focus-management/) `document.title` 을 갱신한다. 이 동작은 낭독기에서 직접 확인하지 못했다.
- 입력 보존은 상태(메모리)·`sessionStorage`·서버 임시 저장 중 선택한다. 민감 정보(카드 번호 등)는 저장 위치를 신중히 정한다.

## 언제 쓰나

- 입력 항목이 많고 그룹이 뚜렷한 흐름(가입, 결제, 신청서).
- 분기가 있어 앞 답변에 따라 뒤 질문이 달라지는 경우.
- 항목이 대여섯 개뿐이면 한 페이지가 더 빠르다. 단계 분할은 클릭 수와 로딩을 늘린다.

## 체크리스트

- [ ] 총 단계 수와 현재 단계가 제목·헤딩·진행 표시에 있다
- [ ] 뒤로 가기(브라우저·화면 링크) 시 입력이 남아 있다
- [ ] 단계별 검증 + 오류 요약, 제출 전 확인 화면
- [ ] 단계 전환 시 포커스·문서 제목 갱신
- [ ] 새로고침·세션 만료 시 복구 방법([세션 타임아웃](/develop-wiki/knowledge/ui-ux/session-timeout-ux/))

## 흔한 실수

- 가짜 진행 표시: 분기 때문에 실제 단계 수가 변하는데 "3/5" 로 고정 표기한다.
- 클릭 가능한 스테퍼를 색(채움)만으로 완료·현재를 구분한다.
- 단계마다 서버 검증을 모두 통과해야 이전 단계로 갈 수 있게 해 수정이 막힌다.
- 확인 화면 없이 마지막 단계에서 바로 제출하게 해 오입력을 못 본다([확인 vs 되돌리기](/develop-wiki/knowledge/ui-ux/confirmation-vs-undo/)).
