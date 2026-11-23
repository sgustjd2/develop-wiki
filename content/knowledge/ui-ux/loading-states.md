---
title: 로딩 상태 (스켈레톤·스피너·진행 막대·낙관적 UI)
aka: [Loading State, Skeleton Screen, Spinner, Progress Bar, Optimistic UI, Perceived Performance, aria-busy, 로딩 인디케이터]
category: ui-ux
group: patterns
level: intermediate
summary: 기다림의 길이와 성격에 맞춰 표시 없음·스피너·스켈레톤·진행 막대·낙관적 갱신 중 하나를 고르고, 깜박임과 접근성 문제를 피하는 로딩 상태 설계.
tags: [ux, loading, skeleton, spinner, optimistic-ui, performance, nngroup]
related: [ui-ux/empty-states, ui-ux/live-regions-announcements, mobile-dev/optimistic-ui-eventual-consistency, performance/core-web-vitals, ui-ux/confirmation-vs-undo, ui-ux/response-time-feedback]
sources:
  - https://www.nngroup.com/articles/response-times-3-important-limits/
  - https://www.nngroup.com/articles/skeleton-screens/
  - https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy
updatedAt: 2026-11-23
---

## 문제

- 빠른 요청에도 스피너가 번쩍였다 사라져 화면이 불안정해 보인다.
- 긴 업로드에 무한 회전 스피너만 있으면 멈췄는지 진행 중인지 알 수 없다.
- 데이터가 도착하면서 레이아웃이 밀려 엉뚱한 곳을 누른다(CLS).
- 낭독기 사용자는 로딩이 시작·끝났는지 모른다.

## 해법

### 1. 시간 기준 (Nielsen 응답 시간 한계, 1993)

| 지연 | 사용자 체감 | 표시 |
| --- | --- | --- |
| ~0.1초 | 즉시 반응 | 표시 없음 |
| ~1초 | 흐름은 유지, 지연은 느낌 | 대개 표시 없음 |
| ~10초 | 주의를 붙잡아 둘 수 있는 한계 | 진행 중임을 알리는 표시 |
| 10초 초과 | 다른 일로 넘어감 | 진행률(남은 양)·취소 수단 |

NN/g 의 스켈레톤 가이드(Tankala, 2023)는 이를 이렇게 적용한다: 1초 미만은 표시하지 않고, 약 2~10초는 스피너나 스켈레톤, 10초를 넘으면 진행 막대.

### 2. 무엇을 고르나

| 표시 | 적합 | 부적합 |
| --- | --- | --- |
| **스켈레톤** | 페이지·목록 전체 첫 로드. 레이아웃을 미리 보여 줘 체감 대기를 줄임 | 업로드·변환 같은 과정형 작업, 헤더·푸터만 그린 빈 틀 |
| **스피너** | 카드·버튼·모듈 하나의 짧은 대기 | 10초 이상, 진행률을 알 수 있는 작업 |
| **진행 막대(확정)** | 업로드·다운로드·내보내기·다단계 처리 | 양을 모르는 작업에 가짜 진행률 |
| **낙관적 UI** | 좋아요·체크·이름 변경처럼 성공률이 높고 되돌리기 쉬운 동작 | 결제·송금처럼 실패 시 되돌릴 수 없는 동작 → [낙관적 UI 설계](/develop-wiki/knowledge/mobile-dev/optimistic-ui-eventual-consistency/) |

아래 그림은 위 표의 스켈레톤, 스피너, 진행 막대(확정)를 나란히 놓은 것이다. 낙관적 UI 는 화면 표시가 아니라 갱신 방식이라 그리지 않았다.

<figure class="fig" role="group" aria-label="스켈레톤, 스피너, 진행 막대 비교 도식. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="스켈레톤"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><circle cx="24" cy="24" r="8" class="f-fill-gray"/><rect x="38" y="18" width="54" height="5" rx="2.5" class="f-fill-gray"/><rect x="38" y="28" width="38" height="5" rx="2.5" class="f-fill-gray"/><rect x="16" y="44" width="88" height="5" rx="2.5" class="f-fill-gray"/><rect x="16" y="54" width="70" height="5" rx="2.5" class="f-fill-gray"/><rect x="16" y="64" width="80" height="5" rx="2.5" class="f-fill-gray"/></svg><span>스켈레톤</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="스피너"><circle cx="60" cy="36" r="14" class="f-ring"/><path d="M60 22 a14 14 0 0 1 14 14" class="f-arc"/><text x="60" y="66" class="f-muted" text-anchor="middle" font-size="7">불확정</text></svg><span>스피너</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="진행 막대(확정)"><rect x="14" y="34" width="92" height="8" rx="4" class="f-fill-gray"/><rect x="14" y="34" width="55.2" height="8" rx="4" class="f-fill-blue"/><text x="60" y="58" class="f-muted" text-anchor="middle" font-size="7">60%</text></svg><span>진행 막대(확정)</span></div></div><figcaption>스켈레톤은 레이아웃을, 스피너는 짧은 대기를, 진행 막대는 진행률을 보여 준다. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

### 3. 깜박임 방지: 지연 표시

```ts
// 작업이 delayMs 안에 끝나면 인디케이터를 아예 보이지 않는다
export async function withDelayedIndicator<T>(
  work: Promise<T>, show: () => void, hide: () => void, delayMs = 1000,
): Promise<T> {
  const timer = setTimeout(show, delayMs);
  try { return await work; } finally { clearTimeout(timer); hide(); }
}
```

(Node 에서 50ms 작업은 표시 0회, 지연보다 긴 작업은 표시 1회를 확인했다.) 반대로 한번 보인 인디케이터는 최소 수백 ms 유지하면 번쩍임이 줄어든다(실무 관행, 수치는 팀이 정함).

### 4. 레이아웃 안정성

- 스켈레톤·이미지 자리에 실제 콘텐츠와 같은 크기를 예약한다(`aspect-ratio`, 고정 높이). → [Core Web Vitals](/develop-wiki/knowledge/performance/core-web-vitals/) CLS
- 버튼 로딩 상태는 너비를 유지한 채 라벨 옆에 스피너를 둔다. 같은 요청 중복 제출은 막는다.

### 5. 접근성

- 갱신 중인 영역에 `aria-busy="true"`, 끝나면 제거.
- 시작·완료를 `role="status"` 로 알린다("주문 목록 불러오는 중" → "주문 20건 불러옴"). 진행 막대는 `<progress>` 또는 `role="progressbar"` + `aria-valuenow`. → [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)
- 회전·반짝임 애니메이션은 `prefers-reduced-motion` 에서 줄인다. 스켈레톤 반짝임(shimmer)도 포함.

## 언제 쓰나

- 모든 비동기 화면. 특히 첫 진입(스켈레톤), 부분 갱신(스피너), 파일 작업(진행 막대), 즉시성이 중요한 토글(낙관적 UI).

## 체크리스트

- 1초 안에 끝나는 요청에는 인디케이터가 보이지 않는다.
- 10초 넘는 작업에는 진행률과 취소가 있다.
- 로딩 → 빈 상태/오류/정상이 명확히 구분된다. → [빈 상태](/develop-wiki/knowledge/ui-ux/empty-states/)
- 데이터 도착 시 레이아웃이 밀리지 않는다.
- 낭독기로 시작·완료가 들린다.

## 흔한 실수·주의

- **스켈레톤을 성능 개선으로 착각.** 체감만 바꿀 뿐 실제 대기 시간은 그대로다. 근본은 응답 속도다.
- **전체 화면 스피너로 모든 상호작용 차단.** 부분 로딩이면 그 영역만 표시하고 나머지는 계속 쓰게 한다.
- **낙관적 갱신 후 실패를 조용히 되돌림.** 사용자는 성공한 줄 안다. 되돌릴 때는 알리고 재시도를 준다.
- **무한 스피너.** 타임아웃과 오류 상태가 없으면 영원히 돈다.
