---
title: 폼 UX와 인라인 검증
aka: [Form Design, Inline Validation, Live Validation, Error Summary, Form Validation Timing, 폼 검증, 입력 검증]
category: ui-ux
group: patterns
level: intermediate
summary: 폼을 짧고 예측 가능하게 만들고, 검증 시점(제출 시·필드 이탈 시·입력 중)과 오류 표시 위치를 정해 사용자가 막힘 없이 입력을 끝내게 하는 패턴.
tags: [ux, forms, validation, accessibility, gov-uk, nngroup]
related: [ui-ux/error-messages, ui-ux/live-regions-announcements, ui-ux/cognitive-accessibility, ui-ux/keyboard-focus-management, ui-ux/ux-writing-principles]
sources:
  - https://design-system.service.gov.uk/patterns/validation/
  - https://design-system.service.gov.uk/components/error-summary/
  - https://www.nngroup.com/articles/errors-forms-design-guidelines/
  - https://www.w3.org/WAI/tutorials/forms/
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
updatedAt: 2026-11-19
---

## 문제

- 사용자가 아직 입력 중인데 "올바르지 않은 이메일" 이 빨갛게 뜬다.
- 제출 버튼을 눌렀더니 화면 맨 위에 "입력값을 확인하세요" 한 줄만 나오고 어느 필드인지 모른다.
- 오류가 나자 입력해 둔 값이 지워진다.
- 낭독기 사용자는 오류가 생겼다는 사실 자체를 모른다.

## 해법

### 1. 폼 자체를 줄인다 (검증보다 먼저)

- 묻지 않아도 되는 질문은 없앤다. 필수가 아닌 필드는 "(선택)" 으로 표시한다.
- 라벨은 입력 **위**에, 항상 보이게. placeholder 는 라벨을 대신하지 않는다.
- 형식 힌트는 라벨 아래 상시 문구로(`aria-describedby` 연결).
- `autocomplete`, `type="email"`, `inputmode="numeric"` 으로 자동 채움·적절한 키보드를 쓴다(WCAG 1.3.5).
- 공백·하이픈 섞인 전화번호처럼 **애매하지 않은 형식 차이는 받아들이고** 서버에서 정규화한다.

### 2. 검증 시점: 두 정평 있는 입장

| 입장 | 내용 |
| --- | --- |
| GOV.UK Design System | 필드를 떠날 때 검증하지 말고 **사용자가 계속/제출을 누를 때** 검증. 입력 중 검증은 느린 입력자를 방해한다. 실시간 검증은 리서치로 이득이 확인될 때만(예: 글자 수 세기). 브라우저 기본 검증은 `novalidate` 로 끄고 서버 검증은 항상 한다 |
| NN/g (Krause, 2019) | 가능하면 **필드를 마친 뒤**(이탈 시) 인라인 검증. 입력 중이거나 건드리지 않은 필드에는 오류를 띄우지 않는다. 복잡한 필드(아이디 중복, 비밀번호 강도)는 성공 피드백도 준다 |

공통점: **입력 도중에는 오류를 띄우지 않는다**, 오류는 **필드 옆**에, 요약만으로 끝내지 않는다. 실무 절충안은 "제출 시 검증 + 오류가 생긴 필드는 고치는 동안 즉시 해소 표시"다.

### 3. 제출 시 오류 처리 흐름

1. 제출을 막고 오류 필드에 `aria-invalid="true"`, 메시지를 `aria-describedby` 로 연결.
2. 페이지 상단에 **오류 요약**(각 항목은 해당 필드로 가는 링크)을 보여 주고 **포커스를 요약으로 이동**.
3. 페이지 제목 앞에 "오류:" 를 붙여(새로고침형 폼) 낭독기가 먼저 알게 한다.
4. 입력값은 지우지 않는다.

```ts
type FieldError = { name: string; message: string };

export function showErrors(form: HTMLFormElement, summary: HTMLElement, errors: FieldError[]) {
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll<HTMLElement>('.field-error').forEach((el) => { el.textContent = ''; });
  const list = summary.querySelector('ul')!;
  list.replaceChildren();
  for (const { name, message } of errors) {
    const input = form.elements.namedItem(name) as HTMLInputElement;
    const msg = document.getElementById(`${name}-error`)!;
    msg.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', msg.id);
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${input.id}"></a>`;
    li.firstElementChild!.textContent = message;
    list.append(li);
  }
  summary.hidden = errors.length === 0;   // summary 는 tabindex="-1"
  if (errors.length) summary.focus();
}
```

(jsdom 에서 aria-invalid 설정, 요약 포커스, 링크 대상, 재검증 시 초기화를 확인했다. 힌트 문구가 이미 `aria-describedby` 에 있으면 id 를 공백으로 이어 붙인다.)

라이브러리로 상태 관리를 할 때는 [React Hook Form](/develop-wiki/frontend/state-data/react-hook-form/) 같은 도구의 검증 모드(`onSubmit`/`onBlur`/`onChange`)를 위 원칙에 맞춰 고른다. 스키마 검증은 [Zod](/develop-wiki/backend/api/zod/) 등을 서버와 공유할 수 있다.

## 언제 쓰나

- 가입, 결제, 신청, 설정 등 입력이 있는 모든 화면.
- 실시간 검증은 서버 확인이 필요한 고유성 검사, 글자 수 제한, 비밀번호 규칙처럼 **입력하면서 조정하는 것이 이득인 필드**에 한정.

## 체크리스트

- 모든 입력에 보이는 `<label>`, 그룹에는 `<fieldset><legend>`.
- 오류는 필드 옆 + 상단 요약, 문구가 같다.
- 색 외에 아이콘·텍스트로도 오류를 표시한다(1.4.1).
- 오류 후에도 입력값이 남는다. 비밀번호 같은 민감 필드만 예외로 검토.
- 클라이언트 검증이 꺼져도 서버 검증이 같은 메시지를 돌려준다.
- 같은 오류가 반복되는 필드를 분석으로 추적한다.

## 흔한 실수·주의

- **입력 중(onChange) 검증을 기본값으로.** 첫 글자부터 오류가 뜬다. 최소한 첫 이탈 전까지는 보류한다.
- **제출 버튼 비활성화로 검증 대신.** 왜 눌리지 않는지 알 수 없고 낭독기 사용자는 버튼을 놓친다. 눌리게 두고 오류를 보여 준다.
- **툴팁·모달에만 오류.** 놓치기 쉽고 고치는 동안 사라진다.
- **브라우저 기본 검증 말풍선에 의존.** 문구·스타일을 통제할 수 없고 화면마다 다르다.
- 문구 작성은 [에러 메시지](/develop-wiki/knowledge/ui-ux/error-messages/) 노트를 따른다.
