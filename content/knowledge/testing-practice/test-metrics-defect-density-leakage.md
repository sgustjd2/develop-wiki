---
title: 테스트 지표 - 결함 밀도·결함 누출·DDP/DRE·커버리지 (Test Metrics)
aka: [Defect Density, Defect Leakage, Defect Detection Percentage, DDP, Defect Removal Efficiency, DRE, Test Coverage, 결함 제거 효율]
category: testing-practice
level: intermediate
summary: ISTQB 가 정의한 테스트 지표(결함 밀도, DDP, 커버리지)와 업계 관행으로 쓰이는 지표(DRE, 결함 누출, 재오픈율)를 구분하고, 같은 가상 데이터에서 직접 계산해 정의에 따라 값이 달라지는 모습을 보인다.
tags: [istqb, test-metrics, defect-density, ddp, dre, defect-leakage, coverage, test-management]
related: [testing-practice/seven-testing-principles, testing-practice/test-types-classification, testing-practice/black-box-test-design-techniques, testing-practice/flaky-e2e-tests, testing-practice/test-pyramid-trophy]
sources:
  - https://istqb.org/?sdm_process_download=1&download_id=3345
  - https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTAL-TM_Syllabus_v3.0_zKjKsaN.pdf
  - https://glossary.istqb.org/
  - https://www.ppi-int.com/wp-content/uploads/2021/01/Software-Defect-Removal-Efficiency.pdf
updatedAt: 2026-11-23
---

## 문제

"결함 누출률 5%" 같은 숫자는 정의를 모르면 해석할 수 없다. 분모가 무엇인지, 어느 시점까지 세는지, 어떤 단계가 "누출" 의 기준인지가 조직마다 다르다. 이 노트는 ISTQB 가 정의한 것과 업계 관행으로 쓰이는 것을 갈라 적고, 가상 결함 29건으로 직접 계산해 정의에 따라 값이 어떻게 달라지는지 보인다.

## 핵심 용어와 출처 구분

| 지표 | 정의 | 출처 구분 |
| --- | --- | --- |
| 결함 밀도 (defect density) | 작업 산출물 크기당 결함 수 | ISTQB 용어집(출처 ISO 24765). 크기 단위(KLOC, 기능점수 등)는 정의에 포함되지 않음 |
| 결함 탐지율 DDP (defect detection percentage) | 어떤 테스트 레벨이 찾은 결함 수 ÷ (그 레벨이 찾은 수 + 이후 다른 수단으로 발견된 수) | ISTQB 용어집. CTAL-TM 3.0 은 DDP 를 테스트 효과 지표로 언급하고 상세는 Expert 레벨 문서라고 안내 |
| 이탈 결함 (escaped defect) | 찾았어야 할 테스트 활동이 찾지 못한 결함 | ISTQB 용어집 |
| 요구사항·코드 커버리지 | 요구사항 또는 코드 중 테스트가 다룬 비율 | CTFL 5.3.1 이 커버리지 지표의 예로 나열 |
| 결함 제거 효율 DRE | 출시 전 제거된 결함 ÷ (출시 전 + 출시 후 일정 기간 내 발견된 결함) | **업계 정의**. Capers Jones 의 글(2011) |
| 결함 누출 (defect leakage) | 정의가 일정하지 않음 | **업계 관행**. ISTQB 용어집에 항목 없음 |
| 수정률·재오픈율 | 수정된 결함 비율 / 수정 후 다시 열린 결함 비율 | **업계 관행**. 이 노트가 읽은 ISTQB 문서에는 정의 없음(CTAL-TM 에는 재오픈 결함을 디버깅 품질 평가에 쓴다는 언급만 있음). 결함 상태별 집계는 CTAL-TM 의 결함 지표 예에 있음 |

CTFL 5.3.1 은 지표를 일곱 묶음(프로젝트 진행, 테스트 진행, 제품 품질, 결함, 위험, 커버리지, 비용)으로 나눈다. 결함 지표의 예로 발견·수정된 결함 수와 우선순위, 결함 밀도, DDP 를 든다. 커버리지 지표의 예는 요구사항 커버리지와 코드 커버리지다.

## 정의별 계산

ISTQB 의 DDP 정의는 "레벨 단위" 라는 점이 중요하다. DRE 는 "출시 전/후" 하나의 경계만 쓴다. 누출은 경계를 어디에 두느냐에 따라 달라진다.

- **DRE (Jones)**: 개발 중 찾은 결함을 센 뒤, 고정 기간(90일) 뒤의 고객 보고 결함을 더해 내부 제거 효율을 계산한다. 90건을 내부에서 찾고 고객이 10건 보고하면 90% 다. 벤치마크 단체 ISBSG 는 출시 후 30일을 쓰므로 같은 프로젝트라도 DRE 가 더 높게 나온다고 이 글에 적혀 있다. 즉 DRE 자체도 관측 기간에 의존한다. 같은 글은 DRE 측정이 나쁜 수정(bad-fix)과 기간 밖 발견 등으로 실제로는 까다롭다고 한다.
- **결함 누출**: ISTQB 정의가 없다. 흔히 "다음 단계(UAT·운영)로 새어 나간 결함 비율" 로 쓰지만, 분모가 전체 결함인지 해당 단계 결함인지, 기준이 UAT 인지 운영인지는 조직마다 다르다. 아래 계산에서 두 가지 변형을 모두 계산해 본다. 이 이름의 단일 표준 정의를 필자는 확인하지 못했다.

## 직접 계산

가상 데이터(필자가 만든 예시이며 실제 프로젝트가 아님). 결함 29건, 모듈 크기(KLOC)는 auth 4, cart 10, pay 6, search 20. 발견 단계는 단위, 시스템, UAT, 운영 순이다. Node 로 계산했다.

<figure class="fig" role="group" aria-label="본문의 가상 결함 29건에서 직접 계산한 값. 같은 데이터인데 정의에 따라 누출률이 38% 또는 21% 로 달라진다. 직접 그린 도식."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="결함 밀도(건/KLOC), 예시 데이터"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><rect x="22" y="28.5" width="12" height="37.5" rx="1" class="f-fill-blue"/><text x="28" y="25.5" class="f-text" text-anchor="middle" font-size="5.5">1.5</text><text x="28" y="74" class="f-muted" text-anchor="middle" font-size="5.5">auth</text><rect x="40" y="46" width="12" height="20" rx="1" class="f-fill-blue"/><text x="46" y="43" class="f-text" text-anchor="middle" font-size="5.5">0.8</text><text x="46" y="74" class="f-muted" text-anchor="middle" font-size="5.5">cart</text><rect x="58" y="24.25" width="12" height="41.75" rx="1" class="f-fill-blue"/><text x="64" y="21.25" class="f-text" text-anchor="middle" font-size="5.5">1.67</text><text x="64" y="74" class="f-muted" text-anchor="middle" font-size="5.5">pay</text><rect x="76" y="59.75" width="12" height="6.25" rx="1" class="f-fill-blue"/><text x="82" y="56.75" class="f-text" text-anchor="middle" font-size="5.5">0.25</text><text x="82" y="74" class="f-muted" text-anchor="middle" font-size="5.5">search</text></svg><span>결함 밀도(건/KLOC), 예시 데이터</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="단계별 DDP(%), 예시 데이터"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><rect x="22" y="42.66666666666667" width="12" height="23.333333333333332" rx="1" class="f-fill-amber"/><text x="28" y="39.66666666666667" class="f-text" text-anchor="middle" font-size="5.5">28</text><text x="28" y="74" class="f-muted" text-anchor="middle" font-size="5.5">단위</text><rect x="40" y="26" width="12" height="40" rx="1" class="f-fill-amber"/><text x="46" y="23" class="f-text" text-anchor="middle" font-size="5.5">48</text><text x="46" y="74" class="f-muted" text-anchor="middle" font-size="5.5">시스템</text><rect x="58" y="28.5" width="12" height="37.5" rx="1" class="f-fill-amber"/><text x="64" y="25.5" class="f-text" text-anchor="middle" font-size="5.5">45</text><text x="64" y="74" class="f-muted" text-anchor="middle" font-size="5.5">UAT</text></svg><span>단계별 DDP(%), 예시 데이터</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="DRE · 누출 두 정의(%), 예시 데이터"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><rect x="22" y="26.5" width="12" height="39.5" rx="1" class="f-fill-red"/><text x="28" y="23.5" class="f-text" text-anchor="middle" font-size="5.5">79</text><text x="28" y="74" class="f-muted" text-anchor="middle" font-size="5.5">DRE</text><rect x="40" y="47" width="12" height="19" rx="1" class="f-fill-red"/><text x="46" y="44" class="f-text" text-anchor="middle" font-size="5.5">38</text><text x="46" y="74" class="f-muted" text-anchor="middle" font-size="5.5">UAT+</text><rect x="58" y="55.5" width="12" height="10.5" rx="1" class="f-fill-red"/><text x="64" y="52.5" class="f-text" text-anchor="middle" font-size="5.5">21</text><text x="64" y="74" class="f-muted" text-anchor="middle" font-size="5.5">운영</text></svg><span>DRE · 누출 두 정의(%), 예시 데이터</span></div></div><figcaption>본문의 가상 결함 29건에서 직접 계산한 값. 같은 데이터인데 정의에 따라 누출률이 38% 또는 21% 로 달라진다. 직접 그린 도식.</figcaption></figure>

위 그림의 막대와 같은 값을 표로 적는다.

**결함 밀도** (건/KLOC): auth 6/4 = 1.50, cart 8/10 = 0.80, pay 10/6 = 1.67, search 5/20 = 0.25, 전체 29/40 = 0.725(약 0.73).

**DDP**(ISTQB 정의, 레벨별): 단위 8/29 = 27.6%, 시스템 10/21 = 47.6%, UAT 5/11 = 45.5%. 단계별 발견 수는 단위 8, 시스템 10, UAT 5, 운영 6 이다. 단위 레벨의 분모는 이후 모든 발견(21)을 포함해 29가 된다.

**DRE**: 출시 전 23건 ÷ 29건 = 79.3% (운영 발견 6건을 출시 후로 보았다).

**누출(두 변형)**: UAT 이후 발견 / 전체 = 11/29 = 37.9%, 운영 발견 / 전체 = 6/29 = 20.7%. 같은 데이터인데 20.7% 와 37.9% 두 값이 나온다. DRE 의 보수는 20.7% 이다(1 - 79.3%).

**수정률** 27/29 = 93.1%, **재오픈율** 3/29 = 10.3%.

읽는 법:

- pay 가 가장 밀도가 높다. 결함 집중([7원칙](/develop-wiki/knowledge/testing-practice/seven-testing-principles/)의 4번)을 의심할 단서지만 모듈 크기(KLOC)가 작아 밀도가 커 보일 수도 있으므로 복잡도·변경 빈도 같은 다른 정보와 함께 본다.
- search 는 밀도가 낮다. 결함이 적은 것인지, 테스트가 적은 것인지는 이 숫자만으로는 알 수 없다.
- DDP 가 단계마다 낮으면 그 단계가 못 잡은 것이 많다는 단서이지만, 결함이 이미 앞 단계에서 대부분 제거되었다면 뒤 단계 DDP 는 낮을 수 있다(필자 해석). 값 자체의 기준선은 조직 데이터로 정한다.

## 지표 오남용 주의 (필자 서술)

아래는 출처가 아니라 필자의 정리다. 측정이 목표가 되면 측정이 왜곡되기 쉽다는 일반 경고(흔히 굿하트의 법칙으로 알려짐)가 테스트 지표에도 적용된다.

- 개인·팀 평가에 결함 수를 쓰면 결함 등록 자체를 피하거나(누락), 쪼개서 늘리거나(건수 부풀리기), 재오픈 대신 새 결함으로 등록하게 된다.
- 커버리지 목표를 높게 걸면 단언(assert) 없는 테스트로 숫자만 채우는 일이 생긴다. CTAL-TM 도 단위·통합이 구조 커버리지 100% 여도 상위 레벨에 결함·품질 위험이 남는다고 경고한다.
- 지표는 추세와 기준선 대비로 보고, 단일 숫자로 합격·불합격을 정하지 않는다. CTFL 5.3.1 은 지표가 진행·품질·효과를 모니터링하고 통제하기 위한 것이라고 목적을 적는다.
- 정의가 다른 조직·도구의 숫자를 비교하지 않는다. 지표에는 이름과 함께 정의(분모, 기간, 단계 경계)를 문서로 붙인다.
- 불안정한 테스트([불안정한 E2E 테스트](/develop-wiki/knowledge/testing-practice/flaky-e2e-tests/))는 실패 수·재오픈율 지표를 흐린다.

## 언제 쓰나

- 테스트 종료 보고(CTFL 5.3.2)에 진행·결함·커버리지 지표를 넣을 때.
- 릴리스 후 회고에서 어느 단계가 못 잡았는지 DDP·누출로 점검할 때.
- 프로세스 개선의 기준선을 만들 때(DRE 같은 지표는 관측 기간을 고정해야 한다).

## 주의

- 위 계산의 데이터는 가상이다. 값의 크기에 의미를 두지 않는다. 의미는 "정의가 값을 바꾼다" 는 데 있다.
- Jones 의 DRE 수치(평균·최고 효율 등)는 그 글의 자체 집계이며 일반화하지 않는다. 이 노트는 그 수치를 인용하지 않았다.
- 커버리지의 뜻은 도구마다 다를 수 있다([블랙박스 테스트 설계 기법](/develop-wiki/knowledge/testing-practice/black-box-test-design-techniques/)의 분기 커버리지 주의 참조).

## 검증 범위

- 읽은 것: ISTQB CTFL 4.0.1 5.3.1~5.3.2, ISTQB CTAL-TM v3.0 의 지표·결함 지표 절, ISTQB 용어집(defect density, DDP, escaped defect), Capers Jones "Software Defect Removal Efficiency"(2011, PDF 전체).
- 못 읽은 것: ISTQB Expert 레벨 "Improving the Test Process"(DDP 상세), Kan 의 *Metrics and Models in Software Quality Engineering*, IEEE 1044 등 결함 분류 표준, ISO/IEC/IEEE 29119(유료, 열람하지 않음).
- 미확인: 결함 누출·재오픈율·수정률의 표준 정의(업계 관행으로만 표시), 굿하트의 법칙의 원 출처(일반 상식 서술).
