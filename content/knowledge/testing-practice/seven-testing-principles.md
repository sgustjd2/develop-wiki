---
title: ISTQB 테스트 7원칙 (Seven Testing Principles)
aka: [Seven Testing Principles, 테스트 7원칙, 살충제 역설, Pesticide Paradox, 무결함 오류, Absence-of-defects fallacy]
category: testing-practice
level: beginner
summary: ISTQB CTFL 4.0.1 이 제시하는 테스트의 일곱 가지 일반 원칙을 원문 기준으로 정리하고, 각 원칙의 근거와 한계, 과거 명칭(살충제 역설)과의 차이를 짚는다.
tags: [istqb, testing-principles, risk-based-testing, pareto, validation, test-strategy]
related: [testing-practice/test-types-classification, testing-practice/test-pyramid-trophy, testing-practice/black-box-test-design-techniques, testing-practice/test-metrics-defect-density-leakage, testing-practice/property-based-testing, testing-practice/tdd]
sources:
  - https://istqb.org/?sdm_process_download=1&download_id=3345
  - https://glossary.istqb.org/
updatedAt: 2026-11-23
---

## 문제

테스트는 "버그를 다 찾는 일" 이라는 기대를 받기 쉽다. 그러면 "테스트를 다 했는데 왜 장애가 났나", "왜 이만큼 시간을 쓰는데도 못 찾나" 같은 오해가 생긴다. ISTQB 는 수십 년간 제안돼 온 일반 지침을 일곱 원칙으로 묶는다. 이 노트는 CTFL 4.0.1 의 1.3절을 기준으로 원칙마다 요지·근거·주의를 적는다. 원문은 영어이며 아래는 필자가 한국어로 다시 쓴 요약이다.

<figure class="fig" role="group" aria-label="ISTQB CTFL 4.0.1 의 테스트 7원칙(1.3). 원칙 5 는 v4.0 에서 "테스트는 닳는다"로 표기된다. 직접 그린 도식."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="결함의 존재를 보인다"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><circle cx="20" cy="24" r="9" class="f-fill-blue"/><text x="20" y="27" class="f-on" text-anchor="middle" font-size="9">1</text><text x="66" y="26" class="f-text" text-anchor="middle" font-size="7.5">결함이 있음을</text><text x="60" y="48" class="f-muted" text-anchor="middle" font-size="6.8">보일 뿐, 없음은 못 보임</text></svg><span>결함의 존재를 보인다</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="완전 테스트 불가능"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><circle cx="20" cy="24" r="9" class="f-fill-blue"/><text x="20" y="27" class="f-on" text-anchor="middle" font-size="9">2</text><text x="66" y="26" class="f-text" text-anchor="middle" font-size="7.5">완전 테스트는</text><text x="60" y="48" class="f-muted" text-anchor="middle" font-size="6.8">불가능</text></svg><span>완전 테스트 불가능</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="조기 테스트"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><circle cx="20" cy="24" r="9" class="f-fill-blue"/><text x="20" y="27" class="f-on" text-anchor="middle" font-size="9">3</text><text x="66" y="26" class="f-text" text-anchor="middle" font-size="7.5">조기 테스트가</text><text x="60" y="48" class="f-muted" text-anchor="middle" font-size="6.8">시간과 비용을 아낌</text></svg><span>조기 테스트</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="결함 집중"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><circle cx="20" cy="24" r="9" class="f-fill-blue"/><text x="20" y="27" class="f-on" text-anchor="middle" font-size="9">4</text><text x="66" y="26" class="f-text" text-anchor="middle" font-size="7.5">결함은</text><text x="60" y="48" class="f-muted" text-anchor="middle" font-size="6.8">한곳에 몰린다</text></svg><span>결함 집중</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="테스트는 닳는다(살충제 역설)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><circle cx="20" cy="24" r="9" class="f-fill-blue"/><text x="20" y="27" class="f-on" text-anchor="middle" font-size="9">5</text><text x="66" y="26" class="f-text" text-anchor="middle" font-size="7.5">테스트는</text><text x="60" y="48" class="f-muted" text-anchor="middle" font-size="6.8">닳는다</text></svg><span>테스트는 닳는다(살충제 역설)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="정황 의존"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><circle cx="20" cy="24" r="9" class="f-fill-blue"/><text x="20" y="27" class="f-on" text-anchor="middle" font-size="9">6</text><text x="66" y="26" class="f-text" text-anchor="middle" font-size="7.5">테스트는</text><text x="60" y="48" class="f-muted" text-anchor="middle" font-size="6.8">정황에 달렸다</text></svg><span>정황 의존</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="무결함 오류(absence-of-defects fallacy)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><circle cx="20" cy="24" r="9" class="f-fill-blue"/><text x="20" y="27" class="f-on" text-anchor="middle" font-size="9">7</text><text x="66" y="26" class="f-text" text-anchor="middle" font-size="7.5">무결함</text><text x="60" y="48" class="f-muted" text-anchor="middle" font-size="6.8">오류</text></svg><span>무결함 오류(absence-of-defects fallacy)</span></div></div><figcaption>ISTQB CTFL 4.0.1 의 테스트 7원칙(1.3). 원칙 5 는 v4.0 에서 "테스트는 닳는다"로 표기된다. 직접 그린 도식.</figcaption></figure>

## 원칙

원문 표기는 영어 제목 그대로 병기한다. 괄호의 인명·연도는 CTFL 이 각 원칙에 붙인 참고 문헌 표기이며, 필자가 해당 문헌 자체를 읽은 것은 아니다.

| # | 원문 제목 | 한 줄 요지 |
| --- | --- | --- |
| 1 | Testing shows the presence, not the absence of defects | 테스트는 결함이 있음을 보일 수 있으나 없음을 증명하지 못한다 |
| 2 | Exhaustive testing is impossible | 사소한 경우를 빼면 모든 것을 테스트할 수 없다 |
| 3 | Early testing saves time and money | 일찍 제거한 결함은 이후 산출물로 번지지 않는다 |
| 4 | Defects cluster together | 소수 컴포넌트에 결함·운영 실패가 몰린다 |
| 5 | Tests wear out | 같은 테스트를 반복하면 새 결함 탐지력이 떨어진다 |
| 6 | Testing is context dependent | 모든 상황에 통하는 단일 접근은 없다 |
| 7 | Absence-of-defects fallacy | 결함을 모두 고쳐도 시스템이 성공한다는 보장은 없다 |

### 1. 결함의 존재를 보일 뿐이다

결함이 하나도 안 나왔다고 정확하다는 증명이 되지 않는다. 테스트는 결함이 남아 있을 확률을 낮출 뿐이다. 그래서 테스트 보고서는 "버그 0건" 이 아니라 "이만큼 확인했고 남은 위험은 이렇다" 로 쓰는 편이 정직하다. 이 허브의 [속성 기반 테스트](/develop-wiki/knowledge/testing-practice/property-based-testing/)처럼 입력을 넓게 뿌려도 같은 한계가 있다.

### 2. 완전 테스트는 불가능하다

입력 조합은 사실상 무한하다(용어집은 exhaustive testing 을 모든 입력값·사전 조건 조합을 포함하는 접근으로 정의). 원문은 대신 테스트 기법(4장), 테스트 케이스 우선순위(5.1.5), 위험 기반 테스트(5.2)로 노력을 집중하라고 한다. 기법은 [블랙박스 테스트 설계 기법](/develop-wiki/knowledge/testing-practice/black-box-test-design-techniques/)에서 실제로 케이스 수를 세어 본다.

### 3. 조기 테스트가 시간과 비용을 아낀다

초기에 제거한 결함은 이후 단계의 파생 결함을 만들지 않으므로 품질 비용이 줄어든다는 논리다. 원문은 정적 테스트(3장)와 동적 테스트(4장)를 가능한 한 일찍 시작하라고 한다. 주의: "조기일수록 싸다" 의 정량적 배수는 이 원칙의 내용이 아니며, 원문은 배수를 제시하지 않는다. 숫자를 인용하려면 원 출처를 따로 확인해야 한다.

### 4. 결함은 몰린다

소수 컴포넌트에 대부분의 발견 결함, 또는 대부분의 운영 실패가 있다. 원문은 이것을 파레토 원리의 예로 보고, 예측한 군집과 실제 관찰한 군집을 위험 기반 테스트의 입력으로 쓰라고 한다. 결함 밀도 지표와 연결되며 [테스트 지표 노트](/develop-wiki/knowledge/testing-practice/test-metrics-defect-density-leakage/)에서 모듈별 밀도를 직접 계산한다. 주의: 과거 군집이 미래 군집을 보장하지 않는다. 리팩터링으로 사라지기도 하고, 결함이 적게 나온 모듈은 테스트가 적었을 뿐일 수도 있다(필자 주).

### 5. 테스트는 닳는다 (예전 명칭: 살충제 역설)

CTFL 4.0.1 의 제목은 "Tests wear out" 이다. 같은 테스트를 많이 반복하면 새 결함을 찾는 데 점점 덜 효과적이다. 극복하려면 기존 테스트·테스트 데이터를 고치거나 새 테스트를 써야 한다. 다만 원문은 곧바로 단서를 단다. 자동화된 회귀 테스트처럼 같은 테스트의 반복이 오히려 유익한 경우가 있다.

- 이 원칙을 흔히 "살충제 역설(pesticide paradox)" 이라 부른다. 필자가 읽은 4.0.1 본문에는 그 표현이 쓰이지 않는다. 구판 실러버스 표기를 이번에 직접 읽지는 않았으므로 "예전 명칭" 이라는 설명은 널리 쓰이는 관행이며 확인한 사실이 아님을 밝힌다(미확인).
- 회귀 스위트는 "닳는" 것이 아니라 다른 목적(이미 알려진 기능이 깨지지 않았는지)을 위한 것이다. 둘을 구분해야 "자동화 스위트를 계속 늘리기만 한다" 와 "계속 같은 시나리오만 돌려 새 결함을 못 찾는다" 를 함께 피할 수 있다.

### 6. 정황에 의존한다

안전 필수 시스템, 전자상거래 사이트, 사내 도구는 테스트 방식이 달라야 한다. 원문은 켄 카너(Kaner 2011)를 인용할 뿐 구체 규칙을 주지 않는다. 이 원칙은 다른 여섯 원칙을 면책 조항처럼 쓰는 데에도 오용된다. "context dependent 라서 우리는 안 한다" 가 아니라, 어떤 정황이 어떤 선택을 낳았는지 적어야 한다(필자 주).

### 7. 무결함 오류

모든 명세 요구를 철저히 테스트하고 발견된 결함을 모두 고쳐도, 사용자의 필요나 사업 목표를 만족하지 못하거나 경쟁 제품보다 열등한 시스템이 나올 수 있다. 원문은 검증(verification)뿐 아니라 유효성 확인(validation)도 수행하라고 한다. 인수 테스트와 [테스트 유형 분류](/develop-wiki/knowledge/testing-practice/test-types-classification/)의 validation 관점이 이 원칙과 이어진다.

## 헷갈리는 구분

- 원칙 1 과 2 는 한계를 말한다("완전할 수 없다"). 원칙 3·4 는 한계 안에서 어디에 힘을 쓸지(일찍, 몰린 곳에) 말한다. 5·6 은 테스트 스위트를 어떻게 운영할지, 7 은 테스트의 목표 자체를 묻는다. 이 묶음 방식은 필자의 정리이며 원문 구조가 아니다.
- 원칙 4 의 "결함 군집" 과 지표 노트의 "결함 밀도" 는 이웃 개념이다. 군집은 현상, 밀도는 측정 방식이다.

## 언제 쓰나

- 테스트 범위를 이해관계자에게 설명할 때(원칙 1, 2, 7).
- 테스트 우선순위와 위험 기반 계획을 정할 때(2, 4).
- 오래된 테스트 스위트를 점검할 때(5): 마지막으로 새 결함을 찾은 게 언제인가?

## 주의

- 원칙은 법칙이 아니라 경험적 지침이다. 원문도 "과거에 제안된 일반 지침" 이라고 적는다. 인용된 근거(1970~2011 문헌)의 실증 강도는 이 노트에서 평가하지 않았다.
- 원칙을 외우는 것이 목적이 되지 않게 한다. 자격시험 대비라면 영어 원문 제목을 정확히 알아야 하지만(예: 5번 제목의 개정), 실무에서는 근거가 되는 논리를 쓴다.

## 검증 범위

- 읽은 것: ISTQB CTFL v4.0.1 1.3절 원문(2024-09-15 판), ISTQB 용어집의 exhaustive testing 항목.
- 못 읽은 것: 각 원칙이 인용하는 원 문헌(Buxton, Manna, Boehm, Enders, Beizer, Kaner), 이전 판 CTFL 의 원칙 표기. ISO/IEC/IEEE 29119 은 열람하지 않았다.
- 미확인: "살충제 역설" 이 이전 판의 공식 제목이라는 점(통념 서술).
