---
title: 마이크로인터랙션
aka: [Microinteractions, Trigger, Rules, Feedback, Loops and Modes, UI Animation, Dan Saffer]
category: ui-ux
group: interaction
level: intermediate
summary: 토글, 좋아요, 당겨서 새로고침처럼 한 가지 일만 하는 작은 상호작용. 트리거·규칙·피드백·반복/모드로 설계하고 상태와 결과를 짧고 분명하게 알린다.
tags: [ux, microinteractions, animation, feedback, motion, accessibility]
related: [ui-ux/response-time-feedback, ui-ux/affordance-signifier-mental-model, ui-ux/nielsen-usability-heuristics, mobile-dev/optimistic-ui-eventual-consistency, graphics-xr/vr-motion-sickness-ux, ui-ux/motion-design-principles]
sources:
  - https://www.nngroup.com/articles/microinteractions/
  - https://www.oreilly.com/library/view/microinteractions/9781449342760/
  - https://www.nngroup.com/articles/animation-duration/
  - https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
updatedAt: 2026-11-19
---

## 문제

- 즐겨찾기를 눌렀는데 아이콘 색만 미세하게 바뀌어 됐는지 모른다.
- 반대로 체크할 때마다 0.8초짜리 튀는 애니메이션이 나와 하루 100번 쓰는 사용자를 지치게 한다.
- 전정 장애가 있는 사용자는 큰 화면 전환 모션에 어지럼을 느낀다.

## 해법

### 정의

NN/g 는 마이크로인터랙션을 **트리거와 피드백이 짝을 이룬 단일 목적의 작은 상호작용**으로 정의한다. 트리거는 사용자 행동이거나 시스템 상태 변화다. 예: 스크롤바, 당겨서 새로고침, 입력하면서 바뀌는 비밀번호 조건 표시, 길게 누르면 흔들리는 아이콘.

### 네 부분 (Dan Saffer, 『Microinteractions』, O'Reilly 2013)

| 부분 | 질문 | 예: 좋아요 버튼 |
| --- | --- | --- |
| 트리거 | 무엇이 시작하나 (사용자/시스템) | 하트 탭 |
| 규칙 | 무엇이 일어나고 무엇은 안 되나 | 로그인 필요, 다시 누르면 취소 |
| 피드백 | 규칙을 어떻게 보이게 하나 | 하트 채움 + 짧은 확대, 숫자 +1 |
| 반복·모드 | 시간이 지나거나 반복하면 어떻게 되나 | 이미 누른 상태 기억, 오프라인이면 대기 표시 |

### 시간: 짧게, 자주 보는 것일수록 더 짧게

NN/g 는 대부분의 UI 애니메이션을 100~500ms, 실무적으로 100~400ms 범위로 권한다.

- 체크박스·토글 같은 단순 피드백: 약 100ms.
- 모달 등장처럼 큰 화면 변화: 200~300ms. 나타날 때가 사라질 때보다 약간 길게.
- 500ms 쯤부터 지연처럼 느껴진다. 너무 긴 경우가 너무 짧은 경우보다 훨씬 흔하다.

```css
.like-icon { transition: transform 120ms ease-out, color 120ms ease-out; }
.like-icon[aria-pressed="true"] { color: var(--color-like); transform: scale(1.15); }

/* 움직임 줄이기 설정을 존중: 모션은 빼고 상태 변화(색)는 유지 */
@media (prefers-reduced-motion: reduce) {
  .like-icon { transition: color 120ms linear; transform: none !important; }
}
```

```tsx
<button aria-pressed={liked} aria-label="좋아요" onClick={toggleLike}>
  <HeartIcon className="like-icon" aria-hidden />
  <span>{count}</span>
</button>
```

### 접근성

- WCAG 2.2 SC 2.3.3(AAA)은 상호작용으로 생기는 모션 애니메이션을 끌 수 있어야 한다고 요구한다(필수 애니메이션 제외). 기법으로 CSS·JS 에서 `prefers-reduced-motion` 을 쓰는 방법이 제시된다. AAA 이지만 구현 비용이 낮아 기본으로 적용할 만하다.
- 상태는 시각 효과뿐 아니라 `aria-pressed`, `role="status"` 등으로도 전달한다.

## 언제 쓰나

- 상태가 바뀌는 작은 조작(토글, 선택, 즐겨찾기, 복사), 입력 검증, 새로고침·동기화 표시.
- 브랜드 성격을 드러내되, 과업을 방해하지 않는 범위에서.

## 체크리스트

- [ ] 모든 상태 변화에 짧은 시각 피드백이 있다(0.1초 안에 시작)
- [ ] 자주 반복되는 동작의 애니메이션은 짧고 은은하다
- [ ] `prefers-reduced-motion` 에서 이동·확대 모션이 빠지고 상태 표시는 남는다
- [ ] 상태가 보조 기술에도 전달된다(`aria-pressed`, `aria-checked`, 상태 메시지)
- [ ] 실패했을 때의 피드백(되돌림 + 이유)도 설계됐다

## 흔한 실수·주의

- **장식이 목적이 된다.** NN/g 는 마이크로인터랙션이 목적을 가져야 하며, 공격적인 애니메이션은 주 과업에서 주의를 빼앗는다고 경고한다.
- **처음 한 번만 보고 정한다.** Saffer 의 "반복" 관점처럼 100번째 사용에서 어떤지 상상한다.
- **새 제스처를 발명한다.** 익숙한 마이크로인터랙션(스크롤바, 체크박스)보다 새 패턴이 잘못 설계될 가능성이 크다.
- **브랜드 톤 불일치.** 업무용 도구에 장난스러운 효과는 어울리지 않을 수 있다.
- Saffer 책 본문은 직접 읽지 못했다. 네 부분 구조는 O'Reilly 도서 페이지와 2차 요약으로 확인했다.
