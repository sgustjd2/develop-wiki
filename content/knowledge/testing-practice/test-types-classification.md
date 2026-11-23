---
title: 테스트 레벨과 유형 분류 (Test Levels and Test Types)
aka: [Test Levels, Test Types, 테스트 레벨, 테스트 유형, 스모크 테스트, 회귀 테스트, 확인 테스트]
category: testing-practice
level: intermediate
summary: 테스트 레벨(단위·통합·시스템·인수)과 유형(기능·비기능·블랙박스·화이트박스·변경 관련)은 서로 다른 축이다. 스모크·새니티·탐색적 같은 이름이 ISTQB 에서 어디에 속하는지와 용어 충돌을 정리한다.
tags: [istqb, test-levels, test-types, smoke-test, regression, exploratory, terminology]
related: [testing-practice/test-pyramid-trophy, testing-practice/test-doubles, testing-practice/contract-testing, testing-practice/flaky-e2e-tests, testing-practice/seven-testing-principles, testing-practice/black-box-test-design-techniques, testing-practice/performance-testing-types-and-metrics]
sources:
  - https://istqb.org/?sdm_process_download=1&download_id=3345
  - https://glossary.istqb.org/
  - https://abseil.io/resources/swe-book/html/ch11.html
  - https://grafana.com/docs/k6/latest/testing-guides/test-types/
updatedAt: 2026-11-23
---

## 문제

"단위 테스트", "기능 테스트", "회귀 테스트", "스모크 테스트", "E2E 테스트" 는 한 목록에 나란히 쓰이지만 같은 종류의 말이 아니다. 어떤 것은 **어디서(범위)**, 어떤 것은 **무엇을(품질 특성)**, 어떤 것은 **왜(변경 후 확인)**, 어떤 것은 **어떻게(설계 방식)** 를 말한다. 축을 섞으면 "단위 테스트는 기능 테스트인가?" 같은 질문이 답이 안 나온다. 이 노트는 ISTQB CTFL 4.0.1 실러버스(2.2절)와 ISTQB 용어집을 기준으로 축을 나눈다. 목록의 개수를 맞추지 않고 출처가 정의한 범위만 쓴다.

## 핵심 용어

| 한국어 | 영어 | ISTQB 에서의 정의(요약) |
| --- | --- | --- |
| 테스트 레벨 | test level | (CTFL 2.2 본문 서술을 합침. 용어집 정의는 "테스트 프로세스의 특정 인스턴스") 함께 조직·관리되는 테스트 활동 묶음. 개발의 한 단계에서 소프트웨어에 대해 수행하는 테스트 프로세스의 인스턴스 |
| 테스트 유형 | test type | 특정 품질 특성을 겨냥한 테스트 활동 묶음. 대부분 모든 레벨에서 수행 가능 |
| 컴포넌트(단위) 테스트 | component (unit) testing | 컴포넌트를 격리해 테스트 |
| 컴포넌트 통합 테스트 | component integration testing | 컴포넌트 사이 인터페이스·상호작용 |
| 시스템 테스트 | system testing | 시스템 또는 제품 전체의 동작과 능력 |
| 시스템 통합 테스트 | system integration testing | 대상 시스템과 다른 시스템·외부 서비스 사이 인터페이스 |
| 인수 테스트 | acceptance testing | 사용자의 비즈니스 요구 충족과 배포 준비 상태를 확인(validation) |
| 확인 테스트 | confirmation testing | 고친 결함 때문에 났던 실패가 다시 안 나는지 확인 |
| 회귀 테스트 | regression testing | 변경이 다른 부분에 부정적 영향을 주지 않았는지 확인 |

## 레벨: 어디에서 보는가

CTFL 4.0.1 은 레벨을 다섯 가지로 설명한다. 통합이 컴포넌트 통합과 시스템 통합 둘로 나뉘어 있다.

<figure class="fig" role="group" aria-label="테스트 레벨 5가지(ISTQB CTFL 4.0.1 2.2.1). 직접 그린 도식."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="컴포넌트(단위) 테스트"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">컴포넌트</text><text x="60" y="42" class="f-muted" text-anchor="middle" font-size="7">컴포넌트 단독</text><text x="60" y="56" class="f-muted" text-anchor="middle" font-size="7">개발자 환경</text></svg><span>컴포넌트(단위) 테스트</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="컴포넌트 통합 테스트"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">컴포넌트 통합</text><text x="60" y="42" class="f-muted" text-anchor="middle" font-size="7">컴포넌트 간 인터페이스</text><text x="60" y="56" class="f-muted" text-anchor="middle" font-size="7">통합 전략 의존</text></svg><span>컴포넌트 통합 테스트</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="시스템 테스트"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">시스템</text><text x="60" y="42" class="f-muted" text-anchor="middle" font-size="7">시스템 전체 동작</text><text x="60" y="56" class="f-muted" text-anchor="middle" font-size="7">대표 환경</text></svg><span>시스템 테스트</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="시스템 통합 테스트"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">시스템 통합</text><text x="60" y="42" class="f-muted" text-anchor="middle" font-size="7">외부 시스템·서비스와 인터페이스</text><text x="60" y="56" class="f-muted" text-anchor="middle" font-size="7">운영 유사 환경</text></svg><span>시스템 통합 테스트</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="인수 테스트"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">인수</text><text x="60" y="42" class="f-muted" text-anchor="middle" font-size="7">수용 여부·배포 준비</text><text x="60" y="56" class="f-muted" text-anchor="middle" font-size="7">가능하면 실제 사용자</text></svg><span>인수 테스트</span></div></div><figcaption>테스트 레벨 5가지(ISTQB CTFL 4.0.1 2.2.1). 직접 그린 도식.</figcaption></figure>

위 그림과 같은 순서로 정리한다. 컴포넌트 테스트는 보통 개발자가 개발 환경에서, 지원 도구(테스트 하니스, 단위 테스트 프레임워크)와 함께 한다. 컴포넌트 통합은 상향식·하향식·빅뱅 같은 통합 전략에 크게 의존한다. 시스템 테스트는 명세 대비 전체 동작을 보고 독립 테스트 팀이 맡기도 한다. 시스템 통합은 운영과 비슷한 환경이 바람직하다. 인수 테스트는 이상적으로 실제 사용자가 하며, 사용자 인수(UAT)·운영 인수·계약 인수·규정 인수·알파·베타 형태가 있다.

레벨은 테스트 대상, 목적, 테스트 기반, 발견되는 결함과 실패, 접근법과 책임이라는 속성으로 구분되어 서로 겹치지 않게 한다. 이 허브의 [테스트 피라미드와 트로피](/develop-wiki/knowledge/testing-practice/test-pyramid-trophy/)는 레벨별로 몇 개씩 둘지(비율)를 다루고, 여기서는 레벨의 이름과 경계를 다룬다. CTFL 5.1.6 도 피라미드를 "세분도가 다른 테스트" 모델로만 소개하고 층의 이름과 개수는 모델마다 다르다고 적는다.

## 유형: 무엇을 보는가

CTFL 4.0.1 2.2.2 는 네 가지를 유형으로 다룬다. 기능, 비기능, 블랙박스, 화이트박스다. 확인·회귀는 바로 뒤 2.2.3 에서 따로 설명한다(용어집은 둘 다 "변경 관련 테스트의 한 종류"로 정의한다).

<figure class="fig" role="group" aria-label="테스트 유형. CTFL 4.0.1 은 앞의 4가지를 유형으로 설명하고(2.2.2), 확인·회귀는 별도 절(2.2.3)로 다룬다. 어느 유형이든 모든 레벨에서 수행할 수 있다. 직접 그린 도식."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="기능(functional)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><rect x="14" y="15" width="40" height="12" rx="6" class="f-fill-blue"/><text x="34" y="24" class="f-on" text-anchor="middle" font-size="6.5">유형</text><text x="60" y="46" class="f-text" text-anchor="middle" font-size="7.5">기능 테스트</text><text x="60" y="60" class="f-muted" text-anchor="middle" font-size="7">무엇을 하는가</text></svg><span>기능(functional)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="비기능(non-functional)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><rect x="14" y="15" width="40" height="12" rx="6" class="f-fill-blue"/><text x="34" y="24" class="f-on" text-anchor="middle" font-size="6.5">유형</text><text x="60" y="46" class="f-text" text-anchor="middle" font-size="7.5">비기능 테스트</text><text x="60" y="60" class="f-muted" text-anchor="middle" font-size="7">얼마나 잘 하는가</text></svg><span>비기능(non-functional)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="블랙박스(black-box)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><rect x="14" y="15" width="40" height="12" rx="6" class="f-fill-blue"/><text x="34" y="24" class="f-on" text-anchor="middle" font-size="6.5">유형</text><text x="60" y="46" class="f-text" text-anchor="middle" font-size="7.5">블랙박스</text><text x="60" y="60" class="f-muted" text-anchor="middle" font-size="7">명세 기반</text></svg><span>블랙박스(black-box)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="화이트박스(white-box)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><rect x="14" y="15" width="40" height="12" rx="6" class="f-fill-blue"/><text x="34" y="24" class="f-on" text-anchor="middle" font-size="6.5">유형</text><text x="60" y="46" class="f-text" text-anchor="middle" font-size="7.5">화이트박스</text><text x="60" y="60" class="f-muted" text-anchor="middle" font-size="7">구조 기반</text></svg><span>화이트박스(white-box)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="확인(confirmation)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><rect x="14" y="15" width="40" height="12" rx="6" class="f-fill-amber"/><text x="34" y="24" class="f-on" text-anchor="middle" font-size="6.5">변경 관련</text><text x="60" y="46" class="f-text" text-anchor="middle" font-size="7.5">확인 테스트</text><text x="60" y="60" class="f-muted" text-anchor="middle" font-size="7">고친 결함이 사라졌나</text></svg><span>확인(confirmation)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="회귀(regression)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><rect x="14" y="15" width="40" height="12" rx="6" class="f-fill-amber"/><text x="34" y="24" class="f-on" text-anchor="middle" font-size="6.5">변경 관련</text><text x="60" y="46" class="f-text" text-anchor="middle" font-size="7.5">회귀 테스트</text><text x="60" y="60" class="f-muted" text-anchor="middle" font-size="7">다른 곳이 깨졌나</text></svg><span>회귀(regression)</span></div></div><figcaption>테스트 유형. CTFL 4.0.1 은 앞의 4가지를 유형으로 설명하고(2.2.2), 확인·회귀는 별도 절(2.2.3)로 다룬다. 어느 유형이든 모든 레벨에서 수행할 수 있다. 직접 그린 도식.</figcaption></figure>

- **기능 테스트**는 컴포넌트·시스템이 "해야 하는 일(what)" 을 평가한다. 기능 완전성·정확성·적절성이 목적이다.
- **비기능 테스트**는 "얼마나 잘(how well)" 동작하는지를 본다. CTFL 은 ISO/IEC 25010 의 분류(성능 효율성, 호환성, 사용성, 신뢰성, 보안, 유지보수성, 이식성, 안전)를 든다. 많은 비기능 테스트는 기능 테스트를 재사용하되 "지정 시간 안에 끝나는가" 같은 제약을 추가해 만든다. 성능 쪽은 [성능 테스트 유형과 지표](/develop-wiki/knowledge/testing-practice/performance-testing-types-and-metrics/)에서 이어간다.
- **블랙박스**는 구조와 무관하게 명세에서 테스트를 도출하고, **화이트박스**는 구현·내부 구조(코드, 아키텍처, 워크플로, 데이터 흐름)에서 도출한다. 설계 기법은 [블랙박스 테스트 설계 기법](/develop-wiki/knowledge/testing-practice/black-box-test-design-techniques/)에 있다.
- 네 유형 모두 모든 레벨에 적용할 수 있고, 레벨마다 초점이 다를 뿐이다. 따라서 "단위 테스트"(레벨)는 기능 테스트일 수도, 화이트박스 테스트일 수도 있다.

### 확인 테스트와 회귀 테스트

- 확인 테스트는 고친 결함이 정말 고쳐졌는지 본다. 실패했던 테스트를 다시 돌리거나, 수정 범위에 맞는 새 테스트를 추가한다. 시간·비용이 빠듯하면 실패를 재현하던 단계만 다시 밟는 수준으로 줄이기도 한다(CTFL).
- 회귀 테스트는 변경(수정 포함)이 같은 컴포넌트, 다른 컴포넌트, 연결된 시스템, 환경에 원치 않는 영향을 주지 않았는지 본다. 범위를 정하려면 영향 분석을 먼저 하라고 권한다. 반복 실행되고 누적되므로 자동화 후보이며 CI 에 넣는 것이 좋은 관행이라고 적는다.
- 두 가지 모두 변경이 일어난 모든 레벨에서 필요하다.

## 스모크·새니티·탐색적: 어디에 속하나

<figure class="fig" role="group" aria-label="같은 이름이 어느 칸에 속하는지(ISTQB 기준). 레벨·유형·기법은 서로 다른 축이다. 직접 그린 도식."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="ISTQB: 레벨"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">단위 테스트</text><rect x="20" y="36" width="80" height="13" rx="6" class="f-fill-blue"/><text x="60" y="45.5" class="f-on" text-anchor="middle" font-size="6.5">레벨(=컴포넌트)</text></svg><span>ISTQB: 레벨</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="ISTQB: 유형"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">기능 테스트</text><rect x="20" y="36" width="80" height="13" rx="6" class="f-fill-blue"/><text x="60" y="45.5" class="f-on" text-anchor="middle" font-size="6.5">유형</text></svg><span>ISTQB: 유형</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="ISTQB: 변경 관련"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">회귀 테스트</text><rect x="20" y="36" width="80" height="13" rx="6" class="f-fill-amber"/><text x="60" y="45.5" class="f-on" text-anchor="middle" font-size="6.5">변경 관련 테스트</text></svg><span>ISTQB: 변경 관련</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="ISTQB: 기법(접근)"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">탐색적 테스트</text><rect x="20" y="36" width="80" height="13" rx="6" class="f-fill-red"/><text x="60" y="45.5" class="f-on" text-anchor="middle" font-size="6.5">접근·경험 기반 기법</text></svg><span>ISTQB: 기법(접근)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="용어집에만 정의"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">스모크</text><rect x="20" y="36" width="80" height="13" rx="6" class="f-fill-gray"/><text x="60" y="45.5" class="f-text" text-anchor="middle" font-size="6.5">용어집: 유형</text></svg><span>용어집에만 정의</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="용어집에 없음"><rect x="6" y="8" width="108" height="64" rx="6" class="f-card"/><text x="60" y="26" class="f-text" text-anchor="middle" font-size="9">새니티</text><text x="60" y="44" class="f-muted" text-anchor="middle" font-size="7">ISTQB 용어집에</text><text x="60" y="56" class="f-muted" text-anchor="middle" font-size="7">항목 없음</text></svg><span>용어집에 없음</span></div></div><figcaption>같은 이름이 어느 칸에 속하는지(ISTQB 기준). 레벨·유형·기법은 서로 다른 축이다. 직접 그린 도식.</figcaption></figure>

- **탐색적 테스트**: 용어집은 "테스트 접근(approach)" 으로, CTFL 4.4.2 는 경험 기반 테스트 기법으로 다룬다. 테스트 설계·실행·평가를 동시에 하며 대상을 학습한다. 명세가 부족하거나 시간이 촉박할 때, 정형 기법의 보완으로 쓸모 있다고 한다. 시간 상자와 차터, 디브리핑으로 구조화하는 세션 기반 방식도 있다.
- **스모크 테스트**: 용어집은 "테스트 대상이 계획된 테스트를 받을 준비가 됐다는 충분한 확신을 얻기 위한 테스트 유형(test type)" 으로 정의한다. 용어집의 "사용처" 표시는 Foundation 이 아니라 Advanced Agile Tester v2.0 과 AI Testing v2.0 이다. CTFL 4.0.1 본문에서는 진입 기준의 예("모든 스모크 테스트 통과")와 애자일 테스팅 사분면 Q4(기술 지향, 제품 비평 — 스모크와 비기능 테스트)에 한 번씩 나올 뿐 정의는 없다. 즉 ISTQB 의 스모크는 "배포·빌드가 본격 테스트를 받을 만한가" 문턱을 확인하는 얕은 테스트이며, 이 문장은 용어집 정의를 풀어 쓴 것이다.
- **새니티 테스트**: 현재 ISTQB 용어집(API 로 받은 1228개 항목)의 어떤 용어·정의에도 "sanity" 가 나오지 않고 CTFL 4.0.1 본문에도 없다. 그래서 ISTQB 기준의 정의는 **없다**. 어떤 조직·교재는 "수정 직후 좁은 범위만 빠르게 확인" 으로 스모크와 구분하지만, 그 구분은 ISTQB 정의가 아니고 이 노트가 읽은 1차 출처에서도 확인하지 못했다(미확인). 팀에서 쓸 때는 약속된 정의를 문서로 남기는 편이 안전하다.

## 용어 충돌 표

| 말 | 이 노트의 근거에서 | 충돌하는 쓰임 |
| --- | --- | --- |
| 단위 테스트 | CTFL: component testing 의 다른 이름(레벨) | Software Engineering at Google 은 범위(scope)로 "narrow(unit)", 크기(size)로 "small" 을 따로 둔다. 좁은 범위 테스트가 대개 작지만 항상은 아니라고 한다 |
| 통합 테스트 | CTFL: 컴포넌트 통합 / 시스템 통합 두 레벨 | Google: 몇몇 컴포넌트 사이의 "medium scope". 서버+DB 같은 예 |
| 기능 테스트 | CTFL: 유형(무엇을 하는가) | Google: 큰 범위 테스트(end-to-end, system)의 다른 이름으로 언급 |
| 스모크 | 용어집: 유형. CTFL: 진입 기준 예, 사분면 Q4 | k6 문서: 낮은 부하로 스크립트와 시스템이 최소 부하를 처리하는지 확인하는 부하 테스트 종류 |
| 회귀 | 용어집·CTFL: 변경 관련 테스트 | "회귀 테스트 = 전체 자동화 스위트" 같은 구어는 정의가 아니다(필자 정리) |
| 탐색적 | 용어집: 접근. CTFL: 경험 기반 기법 | 유형으로 나열하는 목록이 흔하나 ISTQB 의 유형 목록에는 없다 |
| 새니티 | ISTQB 용어집에 없음 | 출처마다 다름(미확인) |

Google 의 size(small·medium·large)는 "무엇이 필요한가(프로세스·네트워크·디스크 접근 허용 범위)" 를 뜻해 ISTQB 레벨과 직교한다. 크기는 실행 속도와 불안정성(flaky)에 직결되므로 [불안정한 E2E 테스트](/develop-wiki/knowledge/testing-practice/flaky-e2e-tests/) 논의와 연결된다.

## 언제 쓰나

- 테스트 계획서·결함 보고서에 "어떤 레벨의 어떤 유형" 이라고 두 축으로 적으면 범위와 목적이 분명해진다.
- CI 에서 단계를 나눌 때: 빠른 스모크로 빌드 적합성 → 컴포넌트·통합 → 회귀 → 비기능 순서처럼, 레벨(범위)과 유형(목적)을 따로 선택해 조합한다(필자 제안).
- 팀 안에서 스모크·새니티 같은 모호어는 CI 잡 이름과 함께 정의를 한 줄씩 합의한다.

## 주의

- 분류는 소통 도구다. 분류가 완벽해지기를 기다리느라 테스트를 미루지 않는다.
- ISTQB 는 하나의 해석일 뿐이다. 다른 표준이나 책은 다르게 정의한다. 외부 문서를 읽을 때 같은 단어를 같은 뜻으로 읽지 않는다.
- ISTQB 가 레벨별 책임자(개발자·독립 팀·사용자)를 말해도 이는 전형적 사례이지 규칙이 아니다.

## 검증 범위

- 읽은 것: ISTQB CTFL v4.0.1 실러버스 2.2·4.1·4.4·5.1.6·5.1.7 원문, ISTQB 용어집(공식 사이트가 쓰는 공개 API 로 항목을 내려받아 정의 확인), Software Engineering at Google 11장(공개 웹판), k6 공식 문서(테스트 유형).
- 못 읽은 것: ISO/IEC/IEEE 29119 표준 원문(유료이며 열람하지 않았다. ISTQB 문서가 인용하는 범위에서만 언급). ISTQB Advanced Agile Tester·AI Testing 실러버스의 스모크 서술(용어집의 사용처 표시만 확인).
- 미확인: 새니티 테스트의 어떤 공신력 있는 정의. 인스타그램 게시물의 목록은 근거로 쓰지 않았다.
