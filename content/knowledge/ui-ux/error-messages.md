---
title: 에러 상태와 에러 메시지
aka: [Error Message, Error State, Error Handling UX, Validation Message, 오류 메시지, 오류 화면]
category: ui-ux
group: patterns
level: beginner
summary: 무엇이 잘못됐고 어떻게 고치는지를 사용자의 말로, 문제가 생긴 자리에 보여 주는 에러 메시지 작성법과 필드·화면·시스템 단위 에러 상태 설계.
tags: [ux, error, ux-writing, forms, accessibility, gov-uk]
related: [ui-ux/form-inline-validation, ui-ux/ux-writing-principles, ui-ux/empty-states, ui-ux/toast-notification-banner, ui-ux/cognitive-accessibility, ui-ux/nielsen-usability-heuristics]
sources:
  - https://design-system.service.gov.uk/components/error-message/
  - https://www.nngroup.com/articles/errors-forms-design-guidelines/
  - https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
  - https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
  - https://developer.apple.com/design/human-interface-guidelines/writing
updatedAt: 2026-11-19
---

## 문제

- "오류가 발생했습니다(코드 500)", "잘못된 입력입니다", "이 필드는 필수입니다" — 무엇을 해야 하는지 알려 주지 않는다.
- 오류의 범위(한 필드? 이 화면? 서비스 전체?)에 맞지 않는 표현 수단을 쓴다. 필드 오류를 모달로, 서비스 장애를 필드 아래 작은 글씨로 띄운다.
- 사용자를 탓하는 말투("잘못 입력하셨습니다")나 농담("앗! 뭔가 꼬였어요 🙈")이 스트레스를 키운다.

## 해법

### 1. 범위별 에러 상태

| 범위 | 표현 | 예 |
| --- | --- | --- |
| 필드 | 필드 옆 메시지 + 테두리·아이콘 | 이메일 형식 |
| 폼/화면 | 상단 오류 요약(필드 링크) + 필드별 메시지 | 제출 시 3개 오류 → [폼 검증](/develop-wiki/knowledge/ui-ux/form-inline-validation/) |
| 화면 일부(데이터 로드 실패) | 해당 영역 안에 메시지 + 다시 시도 | 위젯 하나가 불러오기 실패 |
| 백그라운드 작업 | 토스트·배너 + 재시도 | 동기화 실패 → [토스트·배너](/develop-wiki/knowledge/ui-ux/toast-notification-banner/) |
| 서비스·권한·자격 | **전용 페이지** | 점검 중, 권한 없음, 신청 대상 아님 |

GOV.UK 는 자격 없음·권한 없음·서비스 문제를 입력 오류 메시지로 표현하지 말고 전용 페이지에서 이유와 다음 행동을 설명하라고 한다.

### 2. 메시지 작성 규칙

1. **무엇이 잘못됐는지 + 어떻게 고치는지**를 함께(WCAG 3.3.1 오류 식별, 3.3.3 수정 제안).
2. **라벨의 단어를 재사용**한다. 라벨이 "휴대폰 번호"면 메시지도 "휴대폰 번호를 …".
3. 비어 있는 필드는 **지시형**, 그 밖의 문제는 **설명형**.
4. 기술 용어·오류 코드·"유효하지 않은"·"잘못된" 같은 막연한 말을 피한다. 코드는 문의용으로 작게 덧붙인다.
5. 탓하지 않고, 사과·농담을 남발하지 않는다. 사과는 서비스 쪽 잘못일 때만.
6. 화면에 이미 있는 예시를 반복하지 않는다. 소리 내어 읽어 어색한지 확인한다.

| 나쁜 예 | 고친 예 |
| --- | --- |
| 필수 입력 항목입니다. | 이름을 입력하세요. |
| 잘못된 날짜입니다. | 생년월일에 올바른 월(1~12)을 입력하세요. |
| 입력 형식 오류 | 이메일 주소를 name@example.com 형식으로 입력하세요. |
| 너무 깁니다. | 닉네임은 20자 이하로 입력하세요. |
| 오류 500 | 저장하지 못했습니다. 잠시 후 다시 시도하세요. 계속되면 고객센터에 오류 번호 A-1029 를 알려 주세요. |
| 비밀번호가 틀렸습니다(로그인) | 이메일 또는 비밀번호가 일치하지 않습니다. *(계정 존재 여부를 노출하지 않게)* |

### 3. 시각·접근성

- 색만으로 구별하지 않는다(1.4.1). 아이콘 + 텍스트 + 테두리.
- 낭독기용으로 메시지 앞에 숨긴 "오류:" 접두어를 둔다(GOV.UK 컴포넌트 방식).
- 메시지는 `aria-describedby` 로 필드에 연결한다. 제출 후 다수 오류는 요약으로 포커스 이동.
- 비동기 실패는 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)으로 알린다.

## 언제 쓰나

- 폼 검증, API 실패, 권한·네트워크 오류, 빈 결과와 구별해야 하는 실패 상태를 설계할 때.
- 디자인 시스템에 오류 문구 템플릿(필수·형식·길이·범위·중복)을 정할 때.

## 체크리스트

- 모든 오류 문구가 "무엇 + 어떻게"를 담는다.
- 오류 유형별 문구 템플릿이 있고, 서버·클라이언트가 같은 문구를 쓴다.
- 네트워크 오류는 재시도 버튼이 있고, 입력 내용이 보존된다.
- 오류 빈도를 분석으로 추적해 문구·흐름을 개선한다(같은 오류 반복은 설계 문제 신호).

## 흔한 실수·주의

- **"알 수 없는 오류가 발생했습니다" 하나로 통일.** 개발은 편하지만 사용자는 다음 행동을 알 수 없다. 최소한 재시도 가능 여부와 연락 경로를 준다.
- **보안 정보 노출.** 스택 트레이스, SQL 오류, "존재하지 않는 계정" 같은 정보는 공격에 쓰인다.
- **빈 상태를 오류처럼 표시.** 결과 0건은 실패가 아니다. → [빈 상태](/develop-wiki/knowledge/ui-ux/empty-states/)
- **오류 후 입력값 초기화.** 사용자는 무엇이 틀렸는지 볼 수 없고 처음부터 다시 입력해야 한다.
