---
title: 블랙박스 테스트 설계 기법 (동등 분할·경계값·결정 테이블·상태 전이)
aka: [Black-box Test Techniques, Equivalence Partitioning, Boundary Value Analysis, Decision Table Testing, State Transition Testing, 화이트박스, 구문 커버리지, 분기 커버리지]
category: testing-practice
level: intermediate
summary: ISTQB CTFL 4.0.1 4장의 네 블랙박스 기법과 두 화이트박스 기법을 작은 예제로 직접 열거해, 테스트 값·결정 테이블 열 수·상태 전이 커버리지가 어떻게 나오는지 확인한다.
tags: [istqb, test-design, equivalence-partitioning, boundary-value-analysis, decision-table, state-transition, coverage, white-box]
related: [testing-practice/test-types-classification, testing-practice/seven-testing-principles, testing-practice/property-based-testing, testing-practice/tdd, testing-practice/test-pyramid-trophy, testing-practice/test-metrics-defect-density-leakage]
sources:
  - https://istqb.org/?sdm_process_download=1&download_id=3345
  - https://glossary.istqb.org/
updatedAt: 2026-11-23
---

## 문제

입력이 조금만 복잡해져도 가능한 테스트는 사실상 무한하다([테스트 7원칙](/develop-wiki/knowledge/testing-practice/seven-testing-principles/)의 2번). 그래서 "어떤 값으로, 몇 개를" 정하는 체계적 방법이 필요하다. CTFL 4.0.1 은 테스트 기법을 블랙박스(명세 기반), 화이트박스(구조 기반), 경험 기반으로 나누고, 블랙박스로 동등 분할·경계값 분석·결정 테이블·상태 전이 네 가지를 다룬다. 이 노트는 네 기법을 작은 예제에서 직접 열거해 숫자로 확인한다.

## 핵심 용어

| 한국어 | 영어 | 정의(CTFL 4.0.1 기준 요약) |
| --- | --- | --- |
| 동등 분할 | equivalence partitioning (EP) | 같은 방식으로 처리되리라 기대되는 값들을 분할로 묶고 분할마다 대표값으로 테스트 |
| 경계값 분석 | boundary value analysis (BVA) | 정렬된 분할의 최솟값·최댓값(경계)을 테스트. 2값·3값 두 방식 |
| 결정 테이블 | decision table | 조건 조합과 그에 따른 동작을 표로 정리. 열이 하나의 결정 규칙 |
| 상태 전이 | state transition | 상태·이벤트·가드 조건·동작으로 시스템 동작을 모델링 |
| 커버리지 항목 | coverage item | 기법이 정하는 측정 단위(분할, 경계값, 열, 상태·전이 등) |
| 구문/분기 커버리지 | statement / branch coverage | 실행된 구문 수 / 분기 수를 전체로 나눈 비율 |

## 동등 분할과 경계값

예제: 가입 시 나이 18~65 허용(정수). 분할은 셋이다: 17 이하(거부), 18~65(허용), 66 이상(거부). 분할은 겹치지 않고 비어 있지 않아야 한다. 유효·무효 분할의 정의는 팀마다 다를 수 있다고 CTFL 이 단서를 단다.

- **EP 100% 커버리지** = 모든 분할(무효 포함)을 최소 한 번 실행. 위 예는 값 3개(예: 10, 40, 70)면 된다. 입력이 여러 개면 가장 단순한 기준이 "각 선택(each choice)" 이며 조합은 고려하지 않는다.
- **2값 BVA**: 경계값과 인접 분할의 가장 가까운 이웃. 여기서는 17, 18, 65, 66 (4개).
- **3값 BVA**: 경계값과 양쪽 이웃. 16, 17, 18, 19, 64, 65, 66, 67 (8개). 일부 항목은 경계값이 아니다.

<figure class="fig" role="group" aria-label="블랙박스 기법 3가지의 예(본문 예제와 같은 수치). 조건 표기 T/F/-(무관)는 CTFL 4.0.1 4.2.3 표기를 따랐다. 직접 그린 도식."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="경계값 분석(나이 18~65 허용)"><line x1="8" y1="44" x2="112" y2="44" class="f-line"/><rect x="8" y="38" width="13" height="12" rx="0" class="f-fill-gray"/><rect x="21" y="38" width="76.375" height="12" rx="0" class="f-fill-blue"/><rect x="97.375" y="38" width="14.625" height="12" rx="0" class="f-fill-gray"/><text x="14.5" y="47" class="f-text" text-anchor="middle" font-size="6">거부</text><text x="59.1875" y="47" class="f-on" text-anchor="middle" font-size="7">허용</text><text x="104.6875" y="47" class="f-text" text-anchor="middle" font-size="6">거부</text><line x1="19.375" y1="32" x2="19.375" y2="38" class="f-line"/><line x1="21" y1="32" x2="21" y2="38" class="f-line"/><line x1="97.375" y1="32" x2="97.375" y2="38" class="f-line"/><line x1="99" y1="32" x2="99" y2="38" class="f-line"/><text x="16.1875" y="30" class="f-text" text-anchor="end" font-size="6.5">17|18</text><text x="102.1875" y="30" class="f-text" text-anchor="start" font-size="6.5">65|66</text><text x="60" y="64" class="f-muted" text-anchor="middle" font-size="6.5">2값 BVA: 17 18 | 65 66</text><text x="60" y="74" class="f-muted" text-anchor="middle" font-size="6">(3값은 16 19 64 67 추가)</text></svg><span>경계값 분석(나이 18~65 허용)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="결정 테이블(할인 규칙)"><text x="30" y="18" class="f-text" text-anchor="end" font-size="6.5">회원</text><text x="30" y="32" class="f-text" text-anchor="end" font-size="6.5">100 이상</text><text x="30" y="46" class="f-text" text-anchor="end" font-size="6.5">쿠폰</text><text x="30" y="60" class="f-text" text-anchor="end" font-size="6.5">할인</text><line x1="34" y1="8" x2="34" y2="66" class="f-line"/><text x="46" y="10" class="f-muted" text-anchor="middle" font-size="5.5">R1</text><text x="46" y="18" class="f-muted" text-anchor="middle" font-size="6.5">T</text><text x="46" y="32" class="f-muted" text-anchor="middle" font-size="6.5">T</text><text x="46" y="46" class="f-muted" text-anchor="middle" font-size="6.5">-</text><text x="46" y="60" class="f-text" text-anchor="middle" font-size="6.5">10%</text><text x="63" y="10" class="f-muted" text-anchor="middle" font-size="5.5">R2</text><text x="63" y="18" class="f-muted" text-anchor="middle" font-size="6.5">T</text><text x="63" y="32" class="f-muted" text-anchor="middle" font-size="6.5">F</text><text x="63" y="46" class="f-muted" text-anchor="middle" font-size="6.5">-</text><text x="63" y="60" class="f-text" text-anchor="middle" font-size="6.5">5%</text><text x="80" y="10" class="f-muted" text-anchor="middle" font-size="5.5">R3</text><text x="80" y="18" class="f-muted" text-anchor="middle" font-size="6.5">F</text><text x="80" y="32" class="f-muted" text-anchor="middle" font-size="6.5">-</text><text x="80" y="46" class="f-muted" text-anchor="middle" font-size="6.5">T</text><text x="80" y="60" class="f-text" text-anchor="middle" font-size="6.5">5%</text><text x="97" y="10" class="f-muted" text-anchor="middle" font-size="5.5">R4</text><text x="97" y="18" class="f-muted" text-anchor="middle" font-size="6.5">F</text><text x="97" y="32" class="f-muted" text-anchor="middle" font-size="6.5">-</text><text x="97" y="46" class="f-muted" text-anchor="middle" font-size="6.5">F</text><text x="97" y="60" class="f-text" text-anchor="middle" font-size="6.5">0%</text><line x1="10" y1="64" x2="112" y2="64" class="f-line"/><text x="60" y="74" class="f-muted" text-anchor="middle" font-size="6.5">8 조합 → 4 규칙</text></svg><span>결정 테이블(할인 규칙)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="상태 전이(주문 상태)"><rect x="4" y="14" width="26" height="14" rx="4" class="f-fill-gray"/><text x="17" y="24" class="f-text" text-anchor="middle" font-size="6.5">생성</text><rect x="47" y="14" width="26" height="14" rx="4" class="f-fill-gray"/><text x="60" y="24" class="f-text" text-anchor="middle" font-size="6.5">결제</text><rect x="90" y="14" width="26" height="14" rx="4" class="f-fill-gray"/><text x="103" y="24" class="f-text" text-anchor="middle" font-size="6.5">배송</text><rect x="47" y="50" width="26" height="14" rx="4" class="f-fill-gray"/><text x="60" y="60" class="f-text" text-anchor="middle" font-size="6.5">취소</text><rect x="90" y="50" width="26" height="14" rx="4" class="f-fill-gray"/><text x="103" y="60" class="f-text" text-anchor="middle" font-size="6.5">도착</text><line x1="30" y1="21" x2="47" y2="21" class="f-line"/><circle cx="47" cy="21" r="1.8" class="f-dark"/><line x1="73" y1="21" x2="90" y2="21" class="f-line"/><circle cx="90" cy="21" r="1.8" class="f-dark"/><line x1="60" y1="28" x2="60" y2="50" class="f-line"/><circle cx="60" cy="50" r="1.8" class="f-dark"/><line x1="30" y1="28" x2="47" y2="50" class="f-line"/><circle cx="47" cy="50" r="1.8" class="f-dark"/><line x1="103" y1="28" x2="103" y2="50" class="f-line"/><circle cx="103" cy="50" r="1.8" class="f-dark"/><text x="38" y="17" class="f-muted" text-anchor="middle" font-size="5">결제</text><text x="82" y="17" class="f-muted" text-anchor="middle" font-size="5">발송</text><text x="112" y="43" class="f-muted" text-anchor="end" font-size="5">도착</text><text x="63" y="40" class="f-muted" text-anchor="start" font-size="5">취소</text><text x="60" y="74" class="f-muted" text-anchor="middle" font-size="6.5">유효 5 / 무효 15 / 20칸</text></svg><span>상태 전이(주문 상태)</span></div></div><figcaption>블랙박스 기법 3가지의 예(본문 예제와 같은 수치). 조건 표기 T/F/-(무관)는 CTFL 4.0.1 4.2.3 표기를 따랐다. 직접 그린 도식.</figcaption></figure>

위 그림은 순서대로 경계값 수직선(18 아래·65 위가 거부 영역), 결정 테이블, 상태 전이다.

### 직접 실행: 어떤 값이 구현 결함을 잡나

정답 구현과 네 가지 변이(경계 연산자 틀림)를 만들어 테스트 값 집합별로 잡히는지 세었다(Node 로 직접 실행).

```ts
const ok = (a: number) => a >= 18 && a <= 65;
// 변이: a > 18 / a < 65 / a >= 18 && a === 65 / a >= 17
```

| 테스트 값 집합 | 잡은 변이 |
| --- | --- |
| EP 대표값 (10, 40, 70) | 1/4 (`a===65` 변이만 40 에서 우연히 잡힘) |
| 2값 BVA (17, 18, 65, 66) | 4/4 |
| 3값 BVA (16, 17, 18, 19, 64, 65, 66, 67) | 4/4 |

EP 는 대표값을 어디서 고르느냐에 따라 결과가 크게 달라진다. 경계 오류에 약하다는 것이 BVA 를 따로 두는 이유다(CTFL: 개발자가 경계값에서 오류를 내기 쉽다). 2값으로 충분해 보이지만 CTFL 의 예처럼 `x <= 10` 을 `x == 10` 으로 잘못 구현한 경우는 다르다.

| 집합 | `x<=10` vs `x==10` 탐지 |
| --- | --- |
| 2값 (10, 11) | 못 잡음 (둘 다 10 은 참, 11 은 거짓) |
| 3값 (9, 10, 11) | 잡음 (9 에서 결과가 다름) |

3값이 더 엄격하지만 테스트가 늘어난다. 위험이 높은 경계에서만 3값을 쓰는 것이 현실적이다(필자 제안).

## 결정 테이블

예제 규칙(필자가 만든 가상 규칙): 회원이고 주문 100 이상이면 10% 할인, 회원이고 100 미만이면 5%, 비회원은 쿠폰이 있으면 5%, 없으면 0%.

조건 3개(회원, 100 이상, 쿠폰)의 전체 조합은 2^3 = 8열이다. CTFL 표기로 T(참)·F(거짓)·-(결과에 무관)·N/A(불가능)를 쓴다. 같은 동작을 내는 열 중 한 조건만 다른 쌍을 반복해 병합하면(코드로 열거) 4개 규칙이 남는다.

| 조건 / 규칙 | R1 | R2 | R3 | R4 |
| --- | --- | --- | --- | --- |
| 회원 | T | T | F | F |
| 100 이상 | T | F | - | - |
| 쿠폰 | - | - | T | F |
| 할인 | 10% | 5% | 5% | 0% |

- 커버리지 항목은 실현 가능한 열이므로, 최소화 표라면 4개 테스트로 100%다. 전체 표라면 8개다.
- CTFL: 조건이 늘면 규칙 수가 지수로 늘어 시간이 많이 들 수 있으므로 최소화하거나 위험 기반으로 줄인다. 최소화 알고리즘은 실러버스 범위 밖이다.
- 결정 테이블은 요구사항의 빈틈·모순도 드러낸다. 위 R3 과 R4 에서 "비회원이 100 이상이면?" 은 규칙에 영향이 없음을 명시적으로 확인해야 한다.

## 상태 전이

예제: 주문 상태 5개(생성·결제·배송·도착·취소), 이벤트 4개(결제, 발송, 도착, 취소). 유효 전이는 생성→결제, 생성→취소, 결제→발송(배송), 결제→취소, 배송→도착 5개이고, 상태 표 20칸 중 15칸은 무효 조합(빈 칸)이다.

| 커버리지 기준 | 정의 | 위 예에서 필요한 것 |
| --- | --- | --- |
| 모든 상태 | 모든 상태를 한 번씩 | `결제→발송→도착` 한 경로는 4/5 상태. `취소` 경로를 더해 5/5 |
| 유효 전이(0-switch) | 유효 전이를 모두 | 경로 세 개(결제·발송·도착 / 취소 / 결제·취소)로 5/5 |
| 모든 전이 | 유효 전이 + 무효 전이 시도 | 유효 5개 + 무효 15개 시도(무효는 결함 마스킹을 피하려고 테스트마다 1건) |

- 위 표의 수치는 코드로 열거해 확인한 것이다. 유효 전이 100% 면 모든 상태 100% 가 보장되며, 모든 전이 100% 는 둘을 모두 보장한다. CTFL 은 안전·미션 크리티컬 소프트웨어에서는 모든 전이를 최소 요건으로 삼으라고 한다.
- 상태 표는 상태 다이어그램과 달리 무효 전이를 빈 칸으로 드러낸다.

## 화이트박스: 구문과 분기

CTFL 4.3 은 구문 테스트·커버리지와 분기 테스트·커버리지를 다룬다. 분기 커버리지는 구문 커버리지를 포함한다(100% 분기면 100% 구문, 역은 불성립). 100% 구문이어도 데이터 의존 결함(예: 특정 값에서만 0 으로 나누기)이나 결정 로직 전부를 확인했다는 뜻은 아니다. 화이트박스는 구현 전체를 보므로 명세가 모호해도 결함을 찾을 수 있지만, 구현되지 않은 요구(누락 결함)는 못 찾을 수 있다.

직접 실행 주의: Node 24 내장 커버리지(`node --test --experimental-test-coverage`)로 `if (n > 0) { s += 1 }` 에 참 경로 테스트 하나만 돌리면 줄·분기 모두 100% 로 보고됐다. 이 도구의 분기는 실제로 들어가 본 블록 단위라서, 거짓 쪽(암묵적 else)은 세지 않는 것으로 보인다. CTFL 의 분기(제어 흐름 그래프의 모든 전이)와 정의가 다를 수 있으니 도구의 "branch %" 를 ISTQB 의 분기 커버리지와 같다고 가정하지 않는다(도구 문서까지 확인하지는 않았다).

## 기법 선택과 이웃 개념

- 경험 기반(오류 추측, 탐색적, 체크리스트)은 블랙박스·화이트박스가 놓치는 결함을 보완한다(CTFL). [테스트 레벨과 유형 분류](/develop-wiki/knowledge/testing-practice/test-types-classification/)의 탐색적 테스트 참조.
- 유스케이스 테스트: CTFL 4.0.1 의 4.2 에는 포함되지 않았다. 유스케이스를 다루는 기법은 4.5 의 협업 기반 접근(인수 기준, ATDD)과 다른 자료에 있을 수 있으나 이 노트는 다루지 않았다.
- [속성 기반 테스트](/develop-wiki/knowledge/testing-practice/property-based-testing/)는 대표값을 사람이 고르는 대신 규칙을 정하고 값을 생성하는 접근이라 EP/BVA 와 상호 보완 관계다. [TDD](/develop-wiki/knowledge/testing-practice/tdd/)에서 쓰는 예제 값도 이 기법으로 고를 수 있다.

## 언제 쓰나

- 입력 범위 검증(EP·BVA), 비즈니스 규칙(결정 테이블), 워크플로·상태 기계(상태 전이)처럼 명세가 있는 곳.
- 커버리지 수치를 요구받아 "어떻게 근거를 세울지" 가 필요할 때. 기법의 커버리지 항목이 근거가 된다.

## 주의

- 모델이 틀리면 100% 커버리지도 소용없다. 분할·규칙이 실제 구현과 다르면(명세 오해) 놓친다.
- 결정 테이블은 조건 수가 늘면 폭발한다. 무조건 전수가 아니라 위험으로 줄인다.
- 커버리지 100% 는 결함이 없다는 뜻이 아니다. [7원칙](/develop-wiki/knowledge/testing-practice/seven-testing-principles/) 1·7번.
- 예제 규칙·상태는 필자가 가정한 것이며 실제 시스템의 규칙이 아니다.

## 검증 범위

- 읽은 것: ISTQB CTFL v4.0.1 4.1~4.4 원문, ISTQB 용어집의 기법·커버리지 정의. 계산은 Node 24 로 직접 실행(변이 탐지, 결정 테이블 병합, 상태 표 열거, 내장 커버리지).
- 못 읽은 것: ISO/IEC/IEEE 29119-4(유료, 열람하지 않음), 인용된 원 문헌(Myers, Craig, Koomen, Ammann 등).
- 미확인: Node 내장 커버리지의 분기 정의에 대한 공식 문서.
