---
title: AI 응답 액션 버튼 (복사·재생성·피드백·공유·편집)
aka: [AI Response Actions, Copy Regenerate Thumbs Feedback, Chat Message Actions, 응답 액션 줄, 챗 UI 피드백 버튼]
category: ui-ux
group: patterns
level: intermediate
summary: AI 챗 응답 아래의 복사·재생성·좋아요/싫어요·공유·편집 버튼을 Google PAIR·Microsoft HAX 지침과 APG 접근성 근거로 설계하는 법. 두 지침에 개별 버튼 규격은 없다.
tags: [ux, ai, chat, feedback, regenerate, copy, accessibility, pair, hax]
related: [ui-ux/like-bookmark-share-rating-ui, ui-ux/ui-component-lookalikes-naming, ui-ux/toast-notification-banner, ui-ux/confirmation-vs-undo, ui-ux/response-time-feedback, ui-ux/live-regions-announcements, ui-ux/error-messages, ui-ux/microinteractions, ui-ux/touch-target-size, ui-ux/deceptive-design-dark-patterns]
sources:
  - https://pair.withgoogle.com/chapter/feedback-controls/
  - https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/
  - https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf
  - https://www.w3.org/WAI/ARIA/apg/patterns/button/
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed
  - https://developer.apple.com/design/human-interface-guidelines/activity-views
updatedAt: 2026-11-23
---

## 문제

AI 챗 응답 아래에는 거의 같은 모양의 아이콘 줄이 붙는다: 복사, 다시 생성, 좋아요/싫어요, 공유, 편집. 아이콘 뜻이 제품마다 다르고, 눌러도 무슨 일이 일어났는지 알기 어렵다.

- "싫어요"가 모델 학습에 쓰이는지, 이 대화에만 영향을 주는지 모른다.
- "다시 생성"을 누르면 이전 답이 사라질까 걱정된다.
- "복사"가 됐는지 화면에 아무 변화가 없다.
- 낭독기 사용자는 아이콘 버튼의 이름과 눌림 상태를 알 수 없다.

## 공식 근거가 말하는 것과 말하지 않는 것

- Google **People + AI Guidebook**(PAIR)의 Feedback + Control 장과 Microsoft **Guidelines for Human-AI Interaction**(Amershi 외, CHI 2019)은 **AI 제품 일반**의 피드백·제어 원칙이다. 이 노트에서 읽은 범위에서 두 문서 모두 "복사", "재생성" 같은 개별 버튼을 정의하지 않는다. 아래 표의 버튼별 해석은 두 원칙을 필자가 적용한 것이다.
- 접근성 근거는 WAI-ARIA APG 버튼 패턴과 MDN(`aria-pressed`, `status` role)이다.
- HAX Toolkit 페이지는 디자인 패턴이 초기 상호작용·상호작용 중·AI 가 틀렸을 때·시간이 지나며의 네 시점에서 지침 구현을 돕는다고 설명한다(18개 지침을 이 네 단계로 묶는 것은 Amershi 외 2019 논문).

## 원칙에서 버튼으로

아래 그림은 응답 말풍선 아래의 액션 줄(복사, 재생성, 좋아요, 싫어요)을 그린 예다. 공유와 편집은 그림에 없다.

<figure class="fig" role="group" aria-label="AI 응답 아래 액션 줄 예시. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="응답 아래 액션 줄"><rect x="14" y="14" width="92" height="26" rx="4" class="f-fill-gray"/><line x1="20" y1="22" x2="96" y2="22" class="f-line"/><line x1="20" y1="30" x2="80" y2="30" class="f-line"/><rect x="15" y="50" width="20" height="14" rx="7" class="f-btn"/><text x="25" y="59.5" class="f-text" text-anchor="middle" font-size="5.2">복사</text><rect x="35" y="50" width="20" height="14" rx="7" class="f-btn"/><text x="45" y="59.5" class="f-text" text-anchor="middle" font-size="5.2">재생성</text><rect x="59" y="50" width="20" height="14" rx="7" class="f-btn"/><text x="69" y="59.5" class="f-text" text-anchor="middle" font-size="5.2">좋아요</text><rect x="83" y="50" width="20" height="14" rx="7" class="f-btn"/><text x="93" y="59.5" class="f-text" text-anchor="middle" font-size="5.2">싫어요</text></svg><span>응답 아래 액션 줄</span></div></div><figcaption>AI 응답 아래 액션 줄 예시. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

| 버튼 | 근거가 되는 원칙(출처 서술을 필자 말로) | 설계 질문(필자 정리) |
| --- | --- | --- |
| 복사 | 해당 지침 없음(미확인, 필자 적용) | 복사된 사실을 어떻게 알리는가 |
| 재생성 | 오류 시 편집·다듬기·복구를 쉽게(G9, "Support efficient correction") | 이전 응답을 잃는가, 되돌릴 수 있는가 |
| 좋아요/싫어요 | 세밀한 피드백을 일상 상호작용 안에서(G15), 행동의 결과 전달(G16) | 이 피드백이 무엇을 바꾸는가 |
| 편집 | 편집·복구(G9) | 편집이 응답을 바꾸는가, 새 프롬프트인가 |
| 공유 | 해당 지침 없음(미확인) | 대화 전체인가 한 응답인가, 누가 볼 수 있는가 |

G번호는 Amershi 외(2019)의 번호다.

## 피드백 버튼 설계

### 엄지 올림/내림의 의미를 정한다

- PAIR 는 모델에 쓰는 명시적 피드백이면 선택지가 상호 배타적이고 포괄적이어야 한다고 한다. 엄지 올림 대 내림이 "yay/nay"로 명확하고 쓸모 있는 의견을 모두 덮는다는 예를 든다(PAIR 는 "괜찮음"은 실행하기 어려운 정보라고 본다).
- PAIR 는 한 번의 피드백이 사용자에게 주는 의미와 시스템이 쓰는 의미가 같아야 한다고 한다. 사용자가 "이 답이 틀렸다"고 누른 것인지 "마음에 안 든다"고 누른 것인지 분리하려면 한 단계 더 묻는다(필자 제안: 싫어요 뒤에 선택형 사유).
- 눌렀을 때 무엇이 일어나는지 말해야 한다. PAIR 는 감사 인사만 하지 말고 영향 시점·범위를 알리라고 하며 예시 문구 다섯 가지를 비교한다(영향 없음 → "다음 추천에는 포함하지 않을게요" → "업데이트했어요" 순으로 구체적). 모델 학습과 무관한 필터일 수 있는데 사용자가 즉시 조정된다고 믿으면 곤란하다는 점도 같은 장에 있다.
- Amershi G16: 사용자 행동이 AI 의 미래 동작에 어떤 영향을 줄지 즉시 갱신하거나 전달한다.

### 데이터 사용 고지

- PAIR 는 어떤 정보를 모으고 무엇에 쓰는지 알리고, 암묵적 피드백 수집은 거부할 수 있게 하라고 한다.
- 대화 내용을 피드백과 함께 제출하는 UI 라면 무엇이 전송되는지 그 자리에서 알려야 한다(필자 정리, PAIR 의 투명성 서술의 적용).

### 요청 과다

- 응답마다 평가 팝업을 띄우는 방식은 사용자를 압박한다. PAIR 의 지침은 피드백을 선택 사항으로 두고 그만둘 방법을 주라는 쪽이다. 응답이 많은 화면에서 버튼 줄은 평소에 눈에 덜 띄게 두고 호버·포커스·최신 응답에서 보이게 하는 방식은 흔하지만, 키보드·터치에서 도달 가능해야 한다(필자 주의).

## 접근성

### 토글 vs 즉시 동작

- 복사·재생성·공유는 눌러서 한 번 동작하는 일반 버튼이다.
- 좋아요/싫어요는 선택 상태가 남으므로 토글 버튼이다. APG: `aria-pressed` 로 상태를 노출하고 라벨은 바꾸지 않는다. 라벨을 바꾸는 방식이면 `aria-pressed` 를 쓰지 않는다(MDN).

```html
<div role="group" aria-label="응답 평가">
  <button type="button" aria-pressed="false">좋아요</button>
  <button type="button" aria-pressed="false">싫어요</button>
</div>
```

- 둘이 상호 배타적이므로 하나를 누르면 다른 하나의 `aria-pressed` 를 `false` 로 바꾼다. APG 에 엄지 올림/내림 전용 패턴은 없다. 라디오 그룹으로 만들 수도 있지만 "선택 취소" 동작이 달라지므로 어느 쪽이든 필자 선택이다.
- 아이콘만 있는 버튼은 보이지 않는 이름이 필요하다. 여러 응답이 이어지면 "응답 3 복사"처럼 대상을 포함해야 같은 이름의 버튼이 반복되지 않는다(필자 정리).
- 터치 영역은 [터치 타깃 크기](/develop-wiki/knowledge/ui-ux/touch-target-size/).

### 결과 알림

- "복사했어요" 같은 완료 문구는 눈에 보이게 하고, 낭독기에는 `role="status"` 영역으로 알린다. MDN 은 status 를 알림(`alert`)만큼 중요하지 않은 안내용으로 설명하고 암묵적으로 `aria-live="polite"` 이며, 갱신 때 포커스를 옮기지 말라고 한다. 영역을 먼저 DOM 에 두고 내용만 바꾸는 방식은 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)에 있다.
- 토스트로만 알리고 버튼 자체에는 변화가 없으면 놓치기 쉽다. 아이콘을 체크로 잠깐 바꾸는 방식을 병행할 수 있다([마이크로인터랙션](/develop-wiki/knowledge/ui-ux/microinteractions/)). 토스트 규칙은 [토스트·알림 배너](/develop-wiki/knowledge/ui-ux/toast-notification-banner/).
- 응답이 스트리밍되는 동안 액션 버튼을 어떻게 낭독기에 알릴지는 이 노트에서 근거를 읽지 못했다.

## 재생성·편집과 되돌리기

- Amershi G9 는 오류 시 편집·다듬기·복구를 쉽게 하라고 한다. 재생성이 이전 응답을 덮어쓰면 복구가 안 되므로 이전 응답으로 돌아가는 방법(버전 넘기기 등)이 복구 수단이 된다(필자 정리).
- 재생성은 파괴적이지 않으므로 확인 대화상자보다 되돌리기가 맞다. 판단 기준은 [확인 vs 실행 취소](/develop-wiki/knowledge/ui-ux/confirmation-vs-undo/).
- 오류는 [오류 메시지](/develop-wiki/knowledge/ui-ux/error-messages/), 대기는 [응답 시간 피드백](/develop-wiki/knowledge/ui-ux/response-time-feedback/).
- 공유는 [공유 시트](/develop-wiki/knowledge/ui-ux/like-bookmark-share-rating-ui/)와 같은 문제다. HIG 는 시스템 Share 버튼을 쓰라고 한다.

## 언제 쓰나

- AI 응답이 사용자가 가져다 쓰는 산출물(글, 코드)일 때: 복사·편집이 핵심.
- 응답 품질을 제품 개선에 쓰려 할 때: 피드백 버튼과 데이터 사용 고지.
- 응답이 재현 가능한 경우: 재생성. 같은 입력의 결과가 달라진다는 점을 사용자에게 알린다.

## 주의

- 버튼을 많이 넣으면 시선이 분산된다. 첫 줄에는 가장 자주 쓰는 두세 개만, 나머지는 더보기에 둔다(필자 제안).
- 싫어요 후에 사유를 반드시 입력하게 하면 피드백이 막힌다. 선택 사항으로 둔다(PAIR 의 거부 가능 원칙과 맞는다).
- 감사 인사만 하지 말고 피드백이 어떻게 쓰이는지 알리면 다시 피드백할 가능성이 높아진다(PAIR. 감사 인사만으로도 신뢰는 쌓일 수 있다고 한다).
- 두 지침은 AI 제품 일반의 서술이며 챗 UI 전용 규격이 아니다.

## 검증 범위

- 읽음: PAIR Feedback + Control 장 본문(웹), Amershi 외 2019 논문 본문(PDF 텍스트 추출, G1~G18 표 포함), HAX Toolkit 지침 소개 페이지, APG button, MDN aria-pressed·status role, HIG activity views.
- 못 읽음: HAX Design Library 의 개별 지침 예시, PAIR 의 Errors + Graceful Failure·Explainability 장, 챗 제품들의 실제 버튼 구성(관찰 안 함), 낭독기에서의 실제 동작.
- 미확인: "공유"·"복사"·"재생성"에 대한 공식 지침(없을 가능성이 있음), 스트리밍 중 live region 처리, 싫어요 사유 수집 비율 같은 수치.
