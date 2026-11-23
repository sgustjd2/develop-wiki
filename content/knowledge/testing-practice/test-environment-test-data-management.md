---
title: 테스트 환경과 테스트 데이터 관리
aka: [Test Environment, Test Data Management, TDM, Hermetic Test, 테스트 환경, 테스트 데이터]
category: testing-practice
level: intermediate
summary: 테스트 환경을 격리성과 운영 충실도의 균형으로 고르는 법, 환경 구성의 기준선·재현성, 테스트 데이터(손수 작성·복사·샘플·합성)의 장단점과 개인정보 주의를 ISTQB·Google 자료 범위로 정리한다.
tags: [test-environment, test-data, hermetic, staging, testcontainers, data-masking, synthetic-data, configuration-management]
related: [testing-practice/testcontainers-contract-suite, testing-practice/test-process-stages, testing-practice/test-documentation-types, testing-practice/flaky-e2e-tests, testing-practice/test-doubles, testing-practice/test-pyramid-trophy, data-analytics/data-quality-privacy-deidentification]
sources:
  - https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
  - https://abseil.io/resources/swe-book/html/ch14.html
  - https://java.testcontainers.org/
updatedAt: 2026-11-23
---

## 문제

같은 테스트가 내 노트북에서는 통과하고 CI 에서는 실패한다. 스테이징 DB 에 누가 데이터를 지워서 아침 테스트가 깨진다. 운영 데이터를 복사해 쓰다가 개인정보가 개발자 노트북에 남는다. 세 문제의 뿌리는 같다. 테스트가 돌아가는 **환경**과 그 안의 **데이터**를 설계 대상으로 보지 않은 것이다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 테스트 환경 | test environment | 테스트를 실행하는 하드웨어·소프트웨어·네트워크·설정의 집합(필자 요약, 용어집 원문 미확인). ISTQB 는 "환경 항목"으로 스텁, 드라이버, 시뮬레이터, 서비스 가상화를 예로 든다 |
| 테스트 데이터 | test data | 테스트를 실행하는 데 필요한 입력과 시스템 상태. ISTQB 는 구현 단계 산출물로 분류한다 |
| 밀폐성 | hermeticity | 테스트 대상 시스템(SUT)이 다른 트래픽과 격리된 정도(Google) |
| 충실도 | fidelity | SUT 가 운영 환경과 닮은 정도(Google) |
| 시드 데이터 | seeded data | 테스트 시작 전에 SUT 에 미리 넣어 두는 데이터(Google) |
| 구성 관리 | configuration management | 테스트웨어와 환경 같은 구성 항목을 식별·버전 관리·추적하는 규율(CTFL 5.4) |

## 환경 스펙트럼

아래 그림은 필자가 단순화한 도식이다. Google 의 *Software Engineering at Google* 14장은 큰 테스트의 SUT 를 단일 프로세스, 단일 머신, 다중 머신, 공유 스테이징, 운영 같은 범위로 설명한다. 그림은 그 구분을 한 줄로 늘어놓은 것이다. 이름·단계 수는 조직마다 다르다.

<figure class="fig" role="group" aria-label="직접 그린 도식. 환경 구분은 Software Engineering at Google 14장의 SUT 범위 구분을 필자가 단순화한 것이며, 조직마다 이름과 단계가 다르다."><div class="fig-grid" style="display:block"><div class="fig-item"><svg viewBox="0 0 420 118" role="img" aria-label="테스트 환경 스펙트럼: 단일 프로세스, 단일 머신, 다중 머신, 공유 스테이징, 운영" style="max-width:100%"><rect x="6" y="28" width="76" height="54" rx="4" class="f-card"/><text x="44" y="44" class="f-text" text-anchor="middle" font-size="8">단일 프로세스</text><text x="44" y="58" class="f-muted" text-anchor="middle" font-size="6.4">메모리 DB·페이크</text><text x="44" y="72" class="f-muted" text-anchor="middle" font-size="6.4">빠름·격리 높음</text><line x1="82" y1="55" x2="90" y2="55" class="f-outline"/><path d="M90 55 l-5 -3 m0 0 M90 55 l-5 -3" class="f-outline"/><rect x="90" y="28" width="76" height="54" rx="4" class="f-card"/><text x="128" y="44" class="f-text" text-anchor="middle" font-size="8">단일 머신</text><text x="128" y="58" class="f-muted" text-anchor="middle" font-size="6.4">컨테이너 의존성</text><text x="128" y="72" class="f-muted" text-anchor="middle" font-size="6.4">실제 DB·브로커</text><line x1="166" y1="55" x2="174" y2="55" class="f-outline"/><path d="M174 55 l-5 -3 m0 0 M174 55 l-5 -3" class="f-outline"/><rect x="174" y="28" width="76" height="54" rx="4" class="f-card"/><text x="212" y="44" class="f-text" text-anchor="middle" font-size="8">다중 머신</text><text x="212" y="58" class="f-muted" text-anchor="middle" font-size="6.4">여러 서비스 구성</text><text x="212" y="72" class="f-muted" text-anchor="middle" font-size="6.4">배포 구성 근접</text><line x1="250" y1="55" x2="258" y2="55" class="f-outline"/><path d="M258 55 l-5 -3 m0 0 M258 55 l-5 -3" class="f-outline"/><rect x="258" y="28" width="76" height="54" rx="4" class="f-card"/><text x="296" y="44" class="f-text" text-anchor="middle" font-size="8">공유 스테이징</text><text x="296" y="58" class="f-muted" text-anchor="middle" font-size="6.4">여러 팀이 공유</text><text x="296" y="72" class="f-muted" text-anchor="middle" font-size="6.4">충돌·오염 위험</text><line x1="334" y1="55" x2="342" y2="55" class="f-outline"/><path d="M342 55 l-5 -3 m0 0 M342 55 l-5 -3" class="f-outline"/><rect x="342" y="28" width="76" height="54" rx="4" class="f-fill-amber"/><text x="380" y="44" class="f-text" text-anchor="middle" font-size="8">운영</text><text x="380" y="58" class="f-muted" text-anchor="middle" font-size="6.4">실제 사용자·데이터</text><text x="380" y="72" class="f-muted" text-anchor="middle" font-size="6.4">테스트 위험 최대</text><text x="6" y="14" class="f-muted" text-anchor="start" font-size="7">격리·재현성 높음, 격리·재현성 높음</text><text x="414" y="14" class="f-muted" text-anchor="end" font-size="7">운영 충실도 높음, 충돌·위험 큼</text><line x1="6" y1="96" x2="414" y2="96" class="f-outline"/><path d="M414 96 l-5 -3 m0 0 M414 96 l-5 -3" class="f-outline"/><text x="210" y="109" class="f-muted" text-anchor="middle" font-size="7">충실도(운영과 닮은 정도)는 오른쪽으로 갈수록 커지고, 격리와 재현성은 왼쪽이 유리하다</text></svg></div></div><figcaption>직접 그린 도식. 환경 구분은 Software Engineering at Google 14장의 SUT 범위 구분을 필자가 단순화한 것이며, 조직마다 이름과 단계가 다르다.</figcaption></figure>

글로 요약하면 왼쪽(단일 프로세스, 메모리 DB 나 페이크)은 빠르고 격리가 좋아 재현하기 쉽다. 오른쪽으로 갈수록 운영과 닮지만 느리고, 다른 팀·다른 테스트와 부딪힌다. Google 은 밀폐성과 충실도가 서로 **충돌하는 경향**이 있다고 설명한다.

| 환경 | 얻는 것 | 잃는 것 (Google 14장·CTFL 요지) |
| --- | --- | --- |
| 메모리 DB, 페이크, 축소된 SUT | 속도, 격리 | 실제 서비스와의 차이. 소비자가 만든 목은 실제와 어긋날 수 있어, 제공자가 페이크를 함께 제공하면 위험이 줄어든다 |
| 단일/다중 머신 SUT | 구성 전체를 한 번에 확인 | 준비·유지 비용 증가 |
| 공유 스테이징 | 운영과 가까운 통합 | 여러 팀이 쓰므로 충돌·불안정. 큰 테스트는 비결정적이고 flaky 하기 쉬움 |
| 운영 | 충실도 최고, 환경 오버헤드 없음 | 위험 최대: 테스트 데이터가 실사용자에게 노출될 수 있다(Google 은 Webdriver Torso 사건을 예로 든다) |

CTFL 도 비슷한 방향을 말한다. 시스템 테스트의 일부 비기능 특성은 완전한 시스템과 대표적인 테스트 환경에서 테스트하는 것이 낫고(2.2), 시스템 통합 테스트는 운영 환경과 유사한 환경이 필요하다. 반면 작은 수준에서는 서브시스템의 시뮬레이션도 가능하다. 즉 **테스트 수준과 목적에 따라 다른 환경을 고른다.** 모든 테스트를 스테이징에서 돌리지 않는다. [테스트 피라미드](/develop-wiki/knowledge/testing-practice/test-pyramid-trophy/)가 말하는 "아래에서 많이, 위에서 조금"은 환경 비용에서도 같다.

## 컨테이너 기반 환경

Testcontainers(Java 문서)는 JUnit 계열 테스트에서 "일회용" 데이터베이스, Selenium 브라우저, Docker 로 돌릴 수 있는 무엇이든 가볍게 띄우는 라이브러리다. 테스트마다 깨끗하고 알려진 상태에서 시작하게 하며, 데이터 접근 테스트·애플리케이션 통합 테스트·UI 인수 테스트(컨테이너 브라우저, 테스트별 새 브라우저, 영상 녹화 옵션)를 용도로 든다. 요건은 Docker 환경이다. 위 스펙트럼에서 **단일 머신**의 밀폐성과 실제 DB 충실도를 함께 얻는 수단이라는 게 필자의 위치 매김이다. 실제 설정(수명, 대기 전략, 격리 방식)은 [Testcontainers 로 계약 스위트 돌리기](/develop-wiki/knowledge/testing-practice/testcontainers-contract-suite/)에서 직접 실행한 결과와 함께 다룬다. 그 노트가 보인 것처럼 컨테이너는 CI 에 Docker 가 있어야 하고 기동 시간이 든다.

## 환경의 재현성

CTFL 5.4 는 테스트 환경 같은 복합 구성 항목에 대해 구성 관리가 **구성 요소, 관계, 버전**을 기록한다고 적는다. 시험 승인된 구성 항목은 기준선(baseline)이 되고 정식 변경 통제로만 바꿀 수 있다. 이전 기준선으로 되돌려 **이전 테스트 결과를 재현**할 수 있다. 실무 규칙으로 옮기면(필자 정리):
- 환경을 코드로 선언한다(컨테이너 이미지 태그 고정, 의존 서비스 버전 고정). "최신" 태그는 어제와 오늘의 환경이 달라지는 원인이다.
- 결함 보고서에 환경 식별을 남긴다(CTFL 결함 보고서 항목: 테스트 대상과 환경). [결함 보고서 작성](/develop-wiki/knowledge/testing-practice/effective-bug-report-writing/) 참고.
- 환경 준비를 진입 기준에 넣는다. CTFL 은 진입 기준의 예로 환경·테스트 데이터·도구의 가용성을 든다(5.1.3). 환경 인도가 늦으면 일정 조정이 통제 지시의 예다(5.3).
- 테스트 완료 시 환경을 합의된 상태로 종료한다(1.4.1). 공유 환경이라면 이것이 다음 사용자의 시작 상태다.

활동 안의 위치: 환경 요구는 **설계**에서 정의하고, **구현**에서 구축·검증하며, **완료**에서 정리한다([테스트 프로세스 활동](/develop-wiki/knowledge/testing-practice/test-process-stages/)).

## 테스트 데이터

CTFL 은 설계 단계가 데이터 요구를 정의하고 구현 단계가 테스트 데이터를 만든다고 구분한다. Google 14장은 큰 테스트의 데이터를 두 갈래로 본다. 시작 전에 넣는 **시드 데이터**와 실행 중 보내는 테스트 트래픽이다. 시드는 SUT 가 시작할 때 필요한 도메인 데이터, 현실적인 기준 데이터(예: 소셜 그래프), 그리고 트리거·검사가 돌게 하려면 **시딩 API 를 거쳐야** 하는 경우를 포함한다고 설명한다.

데이터의 출처는 세 가지로 구분된다(Google).

| 출처 | 장점 | 단점 |
| --- | --- | --- |
| 손수 작성 (handcrafted) | 통제하기 쉽다 | 범위가 좁고 작성자 편향 |
| 복사 (copied, 운영 등에서) | 현실적 | 개인정보·양·최신성 문제(아래 참고. 이 줄의 단점은 필자 추가) |
| 샘플링 (sampled) | 최소한의 복사로 높은 커버리지를 노린다 | 샘플 설계가 필요 |

필자 정리로 **합성(synthetic)** 데이터는 생성 규칙에서 만든 데이터를 뜻한다. 위 분류에 직접 대응하는 항목은 Google 의 세 구분에 없고, 손수 작성의 자동화 쪽에 가깝다. 마스킹·익명화 같은 가공 방식의 정의는 이 노트에서 1차 출처로 확인하지 못했다.

### 직접 실행한 예: 시드 고정 합성 데이터

아래는 직접 작성해 Node 로 실행한 예다. 같은 시드는 같은 데이터를 주고, 시드를 바꾸면 달라지는 것을 확인했다(출력: 같은 시드 동일 true, 다른 시드 동일 false).

```ts
function rng(seed: number) {              // mulberry32 계열의 간단한 의사난수
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
type User = { id: string; email: string; plan: 'free' | 'pro' };
export function makeUsers(n: number, seed = 1): User[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => ({ id: `u${i + 1}`, email: `user${i + 1}@example.test`, plan: r() < 0.3 ? 'pro' : 'free' }));
}
```

시드 42 의 5명은 `free,free,free,free,pro`, 시드 43 은 `free,pro,free,pro,pro` 였다. 실패한 테스트의 시드를 로그에 남기면 같은 데이터를 다시 만들 수 있다(필자 제안). 이메일은 예약 도메인 `example.test` 로 두어 실제 주소로 나가지 않게 한다.

### 개인정보

운영 데이터를 복사해 쓰는 순간 개인정보 문제가 생긴다. 이름 한 글자만 남기는 단순 마스킹(예: `h***@corp.example`)은 도메인·길이·다른 열과 합쳐 식별될 수 있으므로 **비식별을 보장하지 않는다**(직접 실행한 예의 출력 `h***@corp.example` 에서 도메인이 그대로다). 가명처리·익명처리의 법적·기술적 구분과 k-익명성 등은 [데이터 품질과 개인정보 비식별화](/develop-wiki/knowledge/data-analytics/data-quality-privacy-deidentification/)에서 정리했다. 이 노트의 원칙은 필자 정리다: 가능하면 합성 데이터로 시작하고, 복사가 필요하면 비식별 처리 기준·보관 기한·접근 권한을 먼저 정한다.

## 언제 쓰나

- 단위·컴포넌트 테스트: 인메모리·페이크로 밀폐. [테스트 더블](/develop-wiki/knowledge/testing-practice/test-doubles/) 참고.
- 어댑터(DB, 큐) 통합 테스트: 컨테이너로 실제 의존성. 테스트마다 격리.
- 시스템·E2E: 운영과 닮은 환경이 필요한 소수. 데이터는 시딩 API 로, 테스트가 쓴 데이터는 직접 정리.
- 성능·비기능: CTFL 은 일부 비기능 특성에서 대표 환경이 낫다고 한다. 환경 스펙을 결과에 같이 기록한다.

## 주의 / 비용

- 환경이 늘면 관리 비용이 는다. Google 은 큰 테스트가 느리고 비밀폐적이며 환경·데이터 준비가 단위 테스트보다 훨씬 복잡하다고 정리한다. 책임 소재가 불분명해지기 쉽다.
- 공유 환경의 불안정은 [불안정 E2E 테스트](/develop-wiki/knowledge/testing-practice/flaky-e2e-tests/)로 이어진다. 테스트가 쓴 데이터는 다른 테스트가 읽지 않도록 이름 공간(테스트별 스키마·접두사)으로 분리한다.
- 운영에서 테스트하면 실제 사용자와 상태에 영향을 줄 수 있다. 운영은 테스트 환경이 아니라 관측 대상으로 두는 팀이 많다(필자의 관행 서술, 출처 미확인).
- 환경 유지 비용(클라우드 인스턴스, 라이선스)과 정리 책임(종료 시 삭제)을 계획에 넣는다. 구체적 절감 수치는 출처를 확인하지 못해 쓰지 않았다.

## 검증 범위

- **직접 읽음**: ISTQB CTFL 4.0.1 PDF(1.4.1, 1.4.3, 2.1.4, 2.2, 5.1.3, 5.3, 5.4), Software Engineering at Google 14장(웹 요약 경로로 읽음, 원문 페이지를 직접 전부 대조하지는 않았다), Testcontainers for Java 소개 페이지.
- **직접 실행**: 시드 고정 합성 데이터 예(Node 24). 출력은 본문에 인용.
- **못 읽음/미확인**: ISTQB 용어집의 test environment·test data 정의 원문, ISO/IEC/IEEE 29119 의 환경·데이터 준비 문서(유료, 미열람), 데이터 마스킹·합성 데이터의 1차 정의, Google Testing Blog 의 hermetic 글 본문(본문 추출 실패). 초안의 TDM 정의와 도구 블로그 인용은 근거가 약해 쓰지 않았다.
- 그림은 필자가 단순화한 도식이고, 단계 수·이름은 조직마다 다르다.
