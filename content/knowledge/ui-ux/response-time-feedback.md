---
title: 시스템 상태 피드백과 응답 시간 한계
aka: [Response Time Limits, 0.1 1 10 seconds, Visibility of System Status, Progress Indicator, Spinner, Percent-done Indicator, Status Messages]
category: ui-ux
group: interaction
level: beginner
summary: 0.1초·1초·10초라는 지각 한계를 기준으로, 대기 시간마다 어떤 피드백(즉시 반응, 바쁨 표시, 스피너, 진행률, 중단 버튼)을 줄지 정하는 방법.
tags: [ux, response-time, feedback, progress-indicator, loading, performance, accessibility]
related: [ui-ux/nielsen-usability-heuristics, ui-ux/microinteractions, ui-ux/affordance-signifier-mental-model, performance/core-web-vitals, mobile-dev/optimistic-ui-eventual-consistency, graphics-xr/motion-to-photon-reprojection-frame-budget, ui-ux/live-regions-announcements]
sources:
  - https://www.nngroup.com/articles/response-times-3-important-limits/
  - https://www.nngroup.com/articles/progress-indicators/
  - https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
updatedAt: 2026-11-19
---

## 문제

- 버튼을 눌렀는데 아무 변화가 없으면 사용자는 다시 누른다. 중복 주문·중복 제출이 생긴다.
- 반대로 0.3초 만에 끝나는 요청에 스피너를 깜빡이면 오히려 산만하다.
- "로딩 중…" 텍스트만 고정으로 떠 있으면 진행 중인지 멈췄는지 알 수 없다.

## 해법

### 세 가지 시간 한계

NN/g 는 Miller(1968), Card 외(1991)를 근거로 세 한계를 제시하며, 이 기준은 수십 년간 거의 바뀌지 않았다고 말한다.

| 한계 | 지각 | 필요한 피드백 |
| --- | --- | --- |
| 약 0.1초 | 즉시 반응한다고 느낌 | 결과 자체가 피드백. 직접 조작(드래그, 선택)은 이 안에 반응해야 함 |
| 약 1초 | 지연은 느끼지만 생각 흐름은 유지 | 0.1~1초는 특별한 표시 불필요. 1초를 넘으면 작업 중임을 표시 |
| 약 10초 | 주의를 유지할 수 있는 한계 | 넘으면 진행률·예상 완료 시점, 중단 수단 제공 |

### 대기 시간별 표시 (NN/g 진행 표시 지침)

| 예상 시간 | 표시 |
| --- | --- |
| 1초 미만 | 반복 애니메이션 없음(깜빡임만 남음). 눌림 상태 등 즉시 피드백만 |
| 약 2~10초 | 스피너·반복 진행 바 + 무엇을 기다리는지 텍스트("댓글 불러오는 중") |
| 10초 이상 | 진행률(percent-done) + 남은 시간 대략 + **취소** 버튼 |
| 건수를 아는 일괄 작업 | "50건 중 3건 처리" 같은 절대 진행 |

```tsx
// 짧은 요청은 스피너를 늦게 보여 줘 깜빡임을 막는다
function useDelayedFlag(active: boolean, delayMs = 1000) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) return setShow(false);
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [active, delayMs]);
  return show;
}

// 사용: 버튼은 즉시 비활성·눌림 표시(0.1초), 스피너는 1초 뒤에
const showSpinner = useDelayedFlag(isPending);
<div role="status" aria-live="polite">{showSpinner ? "저장 중…" : saved ? "저장됨" : ""}</div>
```

### 접근성: 상태 메시지는 보조 기술에도 전달

WCAG 2.2 SC 4.1.3(AA)은 포커스를 옮기지 않는 상태 메시지(검색 결과 수, 저장됨, 진행률, 오류 수)를 역할·속성으로 보조 기술이 알 수 있게 하라고 요구한다. 일반 상태는 `role="status"`, 중요한 오류·경고는 `role="alert"`. 중요하지 않은 내용에 `alert`·`aria-live="assertive"` 를 쓰는 것은 실패 사례로 꼽힌다.

## 언제 쓰나

- 모든 비동기 동작: 저장, 검색, 업로드, 결제, 내보내기.
- 성능 목표를 정할 때: "체감상 즉시"가 필요한 상호작용(입력, 토글, 드래그)과 "기다려도 되는" 작업을 나눠 예산을 다르게 잡는다.

## 체크리스트

- [ ] 클릭·탭 후 0.1초 안에 눌림·비활성 등 시각 변화가 있다
- [ ] 1초 이상 걸릴 수 있는 작업에 진행 표시가 있다
- [ ] 10초 이상 작업은 진행률과 취소 수단이 있다
- [ ] 스피너 옆에 무엇을 기다리는지 텍스트가 있다
- [ ] 완료·실패 결과가 화면과 보조 기술(`role="status"`/`alert`) 모두에 전달된다
- [ ] 중복 제출이 막혀 있다(버튼 비활성 + 서버 멱등성)

## 흔한 실수·주의

- **"두 번 누르지 마세요" 경고문.** 첫 클릭이 접수됐다는 피드백을 주는 것이 해결책이다.
- **가짜 진행률.** 진행 바가 99%에서 오래 멈추면 기대를 깨뜨려 불만이 커진다. NN/g 는 처음엔 천천히, 끝으로 갈수록 빨라지는 쪽이 낫고 남은 시간 추정에 여유를 두라고 권한다.
- **피드백으로 성능 문제를 덮는다.** 좋은 로딩 표시도 느린 응답을 빠르게 만들지는 않는다. 서버·번들 최적화가 먼저다.
- 스켈레톤 화면은 이 노트가 근거로 삼은 NN/g 글에서 다루지 않아 권장 여부를 적지 않았다. 표시 지연(1초) 값은 위 한계에서 끌어낸 구현 예시이며 특정 출처의 권고 수치가 아니다.
