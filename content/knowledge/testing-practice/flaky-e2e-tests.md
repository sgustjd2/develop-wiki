---
title: 불안정한(flaky) 테스트 다루기
aka: [Flaky Tests, Non-Deterministic Tests, E2E Stabilization, 플래키 테스트, 테스트 격리]
category: testing-practice
level: intermediate
summary: 코드가 같은데 통과와 실패를 오가는 테스트의 다섯 가지 원인(격리, 비동기, 원격 서비스, 시간, 자원 누수)과 E2E 에서 특히 효과적인 안정화 방법.
tags: [testing, e2e, flaky, playwright, ci, quarantine]
related: [testing-practice/test-pyramid-trophy, testing-practice/test-doubles, testing-practice/contract-testing]
sources:
  - https://martinfowler.com/articles/nonDeterminism.html
  - https://playwright.dev/docs/best-practices
  - https://martinfowler.com/articles/practical-test-pyramid.html
updatedAt: 2026-11-18
---

## 문제

불안정한 테스트는 실패해도 아무도 믿지 않게 만든다. "다시 돌리면 통과해"가 습관이 되면 진짜 실패도 묻힌다. 흔들리는 테스트 몇 개가 스위트 전체의 신뢰를 떨어뜨린다. E2E 는 구성 요소가 많아 특히 잘 흔들린다.

## 원인과 처방

| 원인 | 증상 | 처방 |
| --- | --- | --- |
| 격리 부족 | 순서를 바꾸거나 병렬로 돌리면 실패 | 테스트마다 데이터·세션을 새로 만든다. 공유 전역 상태 제거 |
| 비동기 | 느린 CI 에서만 실패 | 고정 `sleep` 금지. 조건을 폴링하며 기다리고, 넉넉한 타임아웃 |
| 원격 서비스 | 외부 API 가 느리거나 응답이 바뀜 | 테스트 더블·네트워크 스텁. 실제와의 일치는 계약 테스트로 따로 |
| 시간 | 자정·월말·서머타임에 실패 | 시계를 주입하고 테스트에서 고정 |
| 자원 누수 | 스위트 뒤쪽 테스트가 무작위로 실패 | 커넥션·파일 핸들 정리. 풀 크기를 1로 줄여 누수 위치를 드러내기 |

## E2E 안정화 (Playwright 권장 사항 기반)

```ts
// 나쁨: 한 번만 확인하고 넘어감 + 구현 세부 선택자 + 고정 대기
await page.waitForTimeout(2000);
expect(await page.locator('.btn-primary.submit').isVisible()).toBe(true);

// 좋음: 사용자가 보는 기준의 로케이터 + 재시도하는 단언
await page.getByRole('button', { name: '주문하기' }).click();
await expect(page.getByText('주문이 접수되었습니다')).toBeVisible();

// 외부 결제 위젯은 고정 응답으로
await page.route('**/payments/confirm', (r) =>
  r.fulfill({ status: 200, json: { status: 'APPROVED' } }));
```

- **사용자 관점 로케이터**(역할, 레이블, 텍스트)를 쓴다. CSS 클래스·DOM 구조는 자주 바뀐다.
- **웹 우선 단언**(`await expect(locator).toBeVisible()`)은 조건이 맞을 때까지 재시도한다.
- 각 테스트는 **독립**적이어야 한다. 로그인은 셋업 단계에서 한 번 해서 저장한 상태를 재사용한다.
- 우리가 통제하지 않는 서드파티 사이트는 테스트하지 않는다. 응답을 스텁한다.
- CI 에서는 **첫 재시도 때 트레이스**를 남겨 실패를 재현한다.
- DB 를 쓰는 테스트는 테스트별로 데이터를 시드하고, 가능하면 고유 ID 로 다른 테스트와 겹치지 않게 한다.

## 운영 방법

1. **격리(quarantine)**: 흔들리는 테스트를 별도 스위트로 옮겨 메인 파이프라인을 막지 않게 한다.
2. 격리 목록에 **개수 또는 기간 상한**을 둔다. 안 그러면 영원히 방치된다.
3. 재시도 횟수와 재시도 후 통과한 테스트를 기록해 "가끔 실패" 목록을 만든다.
4. 고칠 수 없으면 더 낮은 층(통합·단위)으로 옮기거나 지운다.

## 언제 쓰나

- CI 재실행이 잦아졌을 때, E2E 스위트를 처음 만들 때, 병렬 실행을 켤 때.

## 주의 (비용)

- **자동 재시도는 진통제다.** 실패율을 숨겨 실제 경쟁 조건(race) 버그까지 덮는다. 재시도 후 통과도 지표로 남긴다.
- 타임아웃을 무작정 늘리면 스위트가 느려질 뿐 원인은 그대로다.
- 플래키 테스트가 실제 제품 버그(경쟁 조건, 이벤트 순서)를 드러내는 경우도 있다. 테스트 탓으로 단정하지 않는다.
- E2E 를 줄이는 것이 가장 확실한 안정화일 때가 많다. 핵심 여정만 남기고 나머지는 [하위 층](/develop-wiki/knowledge/testing-practice/test-pyramid-trophy/)으로 내린다.
