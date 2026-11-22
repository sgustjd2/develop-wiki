---
title: DIKW 피라미드·데이터 유형·데이터베이스 기초
aka: [DIKW hierarchy, Data-Information-Knowledge-Wisdom, 정형·반정형·비정형 데이터, structured semi-structured unstructured data, 데이터베이스, database, 정성·정량 데이터]
category: data-analytics
group: understanding
level: beginner
summary: 데이터-정보-지식-지혜(DIKW) 계층의 출처와 정의, NIST 기준의 정형·반정형·비정형 데이터 구분, 데이터베이스 정의와 한국 수험 교재가 쓰는 특징 표현을 출처별로 구분해 정리한다.
tags: [dikw, data-types, structured-data, unstructured-data, database, adsp, adp]
related: [data-analytics/exam-map-adsp-adp-bigdata-analyst, data-analytics/big-data-characteristics-value-risks, data-analytics/sampling-methods-measurement-scales, data-analytics/nosql-types-cap-base, data-analytics/data-warehouse-data-mart-lake-lakehouse, data-modeling/normalization]
sources:
  - https://isko.org/cyclo/dikw
  - https://research.bangor.ac.uk/portal/en/researchoutputs/the-wisdom-hierarchy-representations-of-the-dikw-hierarchy(2d52f33e-9490-4704-aaa5-97bde02abb54).html
  - https://doi.org/10.6028/NIST.SP.1500-1r2
  - https://csrc.nist.gov/glossary/term/database
  - https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf
updatedAt: 2026-11-23
---

## 개요

- "데이터 → 정보 → 지식 → 지혜" 계층(DIKW)은 데이터를 어떻게 가공해야 쓸모가 생기는지 설명하는 개념 모형이다. 측정 가능한 이론이 아니라 설명용 틀이다.
- 데이터는 구조 유무에 따라 정형·반정형·비정형으로 나뉜다. 저장소(관계형 DB, 문서 저장소, 객체 저장소)를 고르는 기준이 된다.
- 데이터베이스는 데이터를 구조를 갖춰 저장하고 여러 응용이 함께 쓰게 하는 체계다. 한국 수험 교재는 특징을 4가지 표현으로 외우게 하는데, 이 표현의 1차 출처는 확인하지 못했다.

## 시험 범위 대응

- ADsP 데이터 이해 / ADP 데이터 이해: "데이터의 이해(데이터와 정보, 데이터베이스의 정의와 특징, 데이터베이스 활용)".
- 빅데이터분석기사 1과목: "데이터 수집 및 전환(유형 및 속성 파악)", 실기 "정형·반정형·비정형 읽기".

## 핵심 용어

| 용어 | 영어 | 정의 |
| --- | --- | --- |
| 데이터 | data | Ackoff(1989)는 대상·사건의 속성을 나타내는 기호로 본다. 관찰·측정에서 나온다(ISKO 요약 기준). |
| 정보 | information | 데이터를 가공해 "누가·무엇을·어디서·언제·얼마나"에 답하게 한 것. 데이터와의 차이는 구조가 아니라 쓰임이다(ISKO 요약 기준). |
| 지식 | knowledge | "어떻게 하는가"를 아는 것. 정보를 지시(행동 방법)로 바꿔 시스템을 통제하게 한다(ISKO 요약 기준). |
| 이해 | understanding | Ackoff 원안에 있는 단계. 이후 많은 DIKW 도식은 이 단계를 뺀다. |
| 지혜 | wisdom | 판단을 통해 가치를 더하는 단계. 사람의 판단과 연결된다. |
| 정형 데이터 | structured data | 미리 정해진 데이터 모델이 있거나 정해진 방식으로 조직된 데이터(NIST SP 1500-1). |
| 반정형 데이터 | semi-structured data | XML·JSON처럼 전체 구조는 있으나 개별 요소는 비정형인 데이터(NIST SP 1500-1). |
| 비정형 데이터 | unstructured data | 미리 정해진 데이터 모델이 없거나 정해진 방식으로 조직되지 않은 데이터. 텍스트·이미지·영상 등(NIST SP 1500-1). |
| 데이터베이스 | database | 정보나 데이터의 저장소. 반드시 관계형일 필요는 없다(NISTIR 7693 정의, NIST 용어집 인용). |

## DIKW 계층

- 출처 계보: ISKO 백과사전은 Cleveland(1982), Zeleny(1987), Adler(1986), Ackoff(1989)를 계보로 든다. Ackoff 논문(*Journal of Applied Systems Analysis* 16, 3–9)은 1988 학회 연설에서 나왔다. 원문은 직접 읽지 못했다.
- Rowley(2007, *Journal of Information Science* 33(2), 163–180)는 교재들이 DIKW 를 어떻게 서술하는지 조사했다. 초록 기준 결론은 이 계층이 "당연하게 받아들여지는" 모형이라는 것, 각 층을 아래층으로 정의하지만 층 사이의 변환 과정 서술은 합의가 약하다는 것, 지혜는 거의 다뤄지지 않는다는 것이다.
- 직접 만든 예(출처 문장 아님):

| 층 | 예 |
| --- | --- |
| 데이터 | 센서 값 `36.1`, `38.9`, `39.4` |
| 정보 | 오전 9시 이후 체온이 38℃ 를 넘었다 |
| 지식 | 이 증상 패턴이면 감염 의심 기준에 해당한다 |
| 지혜 | 이 환자에게 지금 검사를 권할지 판단한다 |

- 한계: 층 사이 경계가 모호하고, "정보에서 지식으로" 가는 절차를 계층 자체가 알려 주지 않는다. 시험에서 층별 구분을 묻더라도 교재마다 예시가 다르다.

## 정형·반정형·비정형

| 구분 | 예 | 주로 쓰는 저장소 |
| --- | --- | --- |
| 정형 | 테이블의 행·열, CSV 의 고정 컬럼 | 관계형 DB |
| 반정형 | JSON, XML, 로그(키-값) | 문서형 NoSQL, 데이터 레이크 |
| 비정형 | 자유 텍스트, 이미지, 음성, 영상 | 객체 저장소, 레이크, 파일 시스템 |

- NIST 는 비정형 데이터의 양과 비중이 늘고, 관계형 DB 가 텍스트·바이너리 객체를 담을 수는 있어도 직접 분석·색인·처리 능력은 제한적이라고 설명한다. 그래서 저장 플랫폼 선택과 데이터 유형이 연결된다.
- 반정형은 "구조가 없다"가 아니라 "구조가 데이터 안에 태그·키로 들어 있다"에 가깝다. 같은 JSON 도 필드가 고정이면 정형처럼 다루기 쉽다.
- 저장소별 특징은 [NoSQL 유형](/develop-wiki/knowledge/data-analytics/nosql-types-cap-base/), [DW·레이크](/develop-wiki/knowledge/data-analytics/data-warehouse-data-mart-lake-lakehouse/) 노트로 이어진다.

## 질적 데이터 vs 양적 데이터

- 수험 교재는 데이터를 질적(정성: 범주·서술)과 양적(정량: 수치)으로도 나눈다. 이 두 단어의 공개 1차 출처는 확인하지 못했다(수험 교재 틀).
- 통계에서 쓰는 척도(명목·순서·구간·비율)와 같은 층위가 아니다. 척도 구분은 [표본추출·척도](/develop-wiki/knowledge/data-analytics/sampling-methods-measurement-scales/) 노트를 본다. "질적=범주형, 양적=수치형"으로 단순 대응시키면 순서 척도 등에서 어긋날 수 있다.

## 데이터베이스

- Codd(1970)의 논문 제목이 "큰 공유 데이터 뱅크를 위한 관계 모형"이다. 초록은 사용자와 응용 프로그램이 내부 표현 변화에 영향받지 않아야 한다는 목표(데이터 독립성)와, 중복·일관성 문제를 관계 연산으로 다루는 모형을 제시한다.
- 수험 교재가 쓰는 데이터베이스 특징 4가지 표현은 아래와 같다. 교재 표현이며 1차 출처는 미확인이다. 뜻은 일반 DBMS 설명과 대응시켜 이해한다.

| 교재 표현 | 풀어 쓰면 | 대응하는 일반 개념(필자 정리) |
| --- | --- | --- |
| 공용 데이터(shared) | 여러 사용자·응용이 함께 쓴다 | 다중 사용자, 접근 제어 |
| 통합 데이터(integrated) | 중복을 최소화해 하나로 관리 | 정규화, 중복 제거 → [정규화](/develop-wiki/knowledge/data-modeling/normalization/) |
| 저장 데이터(stored) | 컴퓨터가 접근 가능한 매체에 저장 | 영속성 |
| 변화 데이터(operational) | 삽입·삭제·수정으로 항상 최신 유지 | 트랜잭션 처리 |

- "정규화"는 여기서 DB 설계의 중복 제거를 뜻한다. 데이터 스케일링(min-max)·규제와 다른 말이다.

## 헷갈리는 구분

| 쌍 | 차이 |
| --- | --- |
| 데이터 vs 정보 | 같은 값이라도 질문에 답하도록 가공·맥락을 붙이면 정보. 차이는 구조가 아니라 쓰임(ISKO 요약). |
| 반정형 vs 비정형 | 반정형은 요소를 식별하는 태그·키가 있다. 비정형은 내용 해석에 별도 처리(텍스트·이미지 분석)가 필요하다. |
| DB vs DBMS | DB 는 저장된 데이터, DBMS 는 이를 관리하는 소프트웨어. 위 NIST 정의는 DB 쪽이다. |

## 언제 쓰나 / 주의

- 요구 사항을 데이터 → 정보 → 지식 중 어디까지 만들 것인지 구분해 보고서 수준을 맞출 때 DIKW 를 쓴다.
- 데이터 유형 구분은 수집·저장 방식과 전처리 도구를 고르는 출발점이다.
- DIKW 는 경험적으로 검증된 인과 모형이 아니다. "정보가 쌓이면 지식이 된다"는 식의 자동 해석은 근거가 없다. 단계 이름은 시험·교재마다 약간 다르게 설명된다.
- 한국 교재의 DB 특징 4가지는 암기용 요약일 뿐, ISO 등 표준 정의와 1:1 이 아니다.

## 검증 범위

- 읽은 것: ISKO 백과사전 DIKW 항목(Ackoff 정의 요약), Rowley(2007) 서지·초록(Bangor 저장소 페이지), NIST SP 1500-1r2 용어·데이터 유형 절, NIST CSRC 용어집 "database", Codd(1970) 초록.
- 읽지 못한 것: Ackoff(1989) 원문, Rowley(2007) 본문(유료), Zeleny·Cleveland 원문. Ackoff 정의는 ISKO 요약을 거친 2차 서술이다.
- 미확인: 질적·양적 데이터 구분과 DB 특징 4가지 표현의 1차 출처. Elmasri·Navathe, Date 교재의 DB 정의는 읽지 못했다.
- 직접 계산·실행: 없음.
