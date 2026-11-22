---
title: 빅데이터의 특징·가치·위기 요인 (3V와 변형)
aka: [Big Data characteristics, 3V, 4V, 5V, Volume Velocity Variety, Veracity, Value, 빅데이터 위기 요인, Big Data risks]
category: data-analytics
group: understanding
level: beginner
summary: Laney(2001)의 3V 가 무엇이었는지, 4V·5V 같은 변형은 누가 어떤 맥락에서 붙였는지, McKinsey 가 든 가치 창출 방식과 Cukier·Mayer-Schönberger 가 짚은 위험을 출처별로 구분해 정리한다.
tags: [big-data, 3v, veracity, value, privacy, risk, adsp, adp]
related: [data-analytics/exam-map-adsp-adp-bigdata-analyst, data-analytics/dikw-data-types-database-basics, data-analytics/data-science-skills-strategic-insight, data-analytics/data-quality-privacy-deidentification, data-analytics/hadoop-hdfs-mapreduce-yarn]
sources:
  - https://community.aiim.org/blogs/doug-laney/2012/08/25/deja-vvvu-gartners-original-volume-velocity-variety-definition-of-big-data
  - https://doi.org/10.6028/NIST.SP.1500-1r2
  - https://www.ibm.com/think/topics/big-data
  - https://karriere.mckinsey.de/~/media/mckinsey/business%20functions/mckinsey%20digital/our%20insights/big%20data%20the%20next%20frontier%20for%20innovation/mgi_big_data_exec_summary.pdf
  - https://cs.brown.edu/courses/cs100/lectures/readings/riseOfBigData.pdf
updatedAt: 2026-11-23
---

## 개요

- 빅데이터를 설명하는 "V" 목록은 하나의 표준 정의가 아니다. 가장 오래된 3V 는 데이터 관리 문제를 세 축으로 정리한 2001년 글에서 왔고, 4V·5V 는 이후 업체·연구자가 속성을 덧붙인 것이다.
- 가치 쪽에서는 McKinsey Global Institute(2011) 보고서가 가치 창출 방식을 정리했고, 위험 쪽에서는 Cukier·Mayer-Schönberger 의 Foreign Affairs 글(2013)이 대표적으로 인용된다.
- 한국 수험 교재의 "비즈니스 모델 유형", "위기 요인과 통제 방안" 틀은 공개 1차 출처를 찾지 못했다. 아래에서 확인한 것과 구분해 표시한다.

## 시험 범위 대응

- ADsP 데이터 이해 / ADP 데이터 이해: "데이터의 가치와 미래(빅데이터의 이해, 빅데이터의 가치와 영향, 비즈니스 모델, 위기 요인과 통제 방안, 미래의 빅데이터)".
- 빅데이터분석기사 1과목: "빅데이터 개요 및 활용(특징·가치·데이터 산업의 이해·빅데이터 조직 및 인력)", "빅데이터 기술 및 제도(개인정보 법·제도·개인정보 활용)".

## 핵심 용어

| 용어 | 제안·정의 출처 | 뜻 |
| --- | --- | --- |
| Volume | Laney 2001 | 데이터 양. 전자상거래 채널이 거래당 더 많은 데이터를 쌓는 문제 |
| Velocity | Laney 2001 | 데이터가 생성·사용되는 속도. NIST 는 "데이터 흐름의 속도" |
| Variety | Laney 2001 | 호환되지 않는 형식·구조·의미. NIST 는 "여러 저장소·도메인·유형의 데이터" |
| Variability | NIST SP 1500-1 | 데이터 흐름 속도·형식·의미·품질의 변화가 분석에 미치는 영향 |
| Veracity | IBM, NIST | 데이터의 정확성·신뢰성 |
| Value | IBM, NIST | 데이터에 내재한 경제적·사회적 가치, 조직이 얻는 실제 이익 |
| Validity | NIST SP 1500-1 | 데이터가 의도한 용도에 적합한 정도 |

## 3V — Laney (2001)

- 원본은 META Group 의 연구 노트 "3D Data Management: Controlling Data Volume, Velocity, and Variety"(2001-02-06)다. 저자 Doug Laney 가 2012년 블로그에 전문을 다시 올렸고, 그 사본으로 확인했다(META Group 원본 문서 자체는 읽지 못함).
- 2001년 노트 자체는 'big data' 라는 말 없이 e-commerce 확산으로 데이터 관리가 어려워진 세 방향을 다뤘다. 2012년 블로그에서 Laney 는 이 3V 를 빅데이터 정의의 틀("Gartner's Original Volume-Velocity-Variety Definition of Big Data")로 제시하고, 널리 쓰이게 됐다고 쓴다.
- 같은 블로그에서 Laney 는 veracity·value·variability 같은 용어가 중요하지만 빅데이터를 **정의하는** 속성으로 보지 않는다고 쓴다.
- 대응 방안도 축마다 다르게 제시한다: 양 → 계층 저장·표본·중복 제거, 속도 → 운영 데이터 저장소·캐시, 다양성 → 프로파일링·변환·메타데이터 관리.

## 4V·5V 변형

| 변형 | 확인된 사실 | 상태 |
| --- | --- | --- |
| 3V + Veracity(4V) | IBM 이 4V 를 쓴다고 2차 자료에서 설명(IBM 인포그래픽, 약 2013년으로 보이나 원본은 못 읽음) | 원본 미확인 |
| 5V(+Value) | IBM 현재 웹 페이지가 volume·velocity·variety·veracity·value 5가지를 나열한다. 누가 처음 만들었는지는 페이지에 없음 | 제안자 미확인 |
| 5V 의 학술 문헌 | Demchenko 등 연구진의 후속 문헌이 5V(volume·velocity·variety·value·veracity)를 쓴다고 검색 결과에서 확인. 2013 CTS 논문 본문에 5V 가 있는지는 못 읽음 | 최초 제안 미확정 |
| NIST 4V | volume·variety·velocity·variability 를 핵심 특성으로 두고, 빅데이터를 이 특성의 하나 이상이 "확장 가능한 구조"를 요구하는 대규모 데이터셋으로 서술한다. veracity·value·validity 는 별도 용어로 정의 | 확인 |
| 6V·7V 등 | 더 늘린 목록은 확인한 1차 출처가 없다 | 미확인 |

- 교재가 5V 나 7V 를 쓸 때는 "누가 정의했는가"를 같이 묻지 말고, 각 V 가 **데이터의 속성**(양·속도·형태)인지 **활용 관점**(가치·진실성)인지로 구분하면 이해가 쉽다. 이 구분은 필자 정리다.
- McKinsey(2011)는 숫자 기준 정의를 피한다. 전형적 데이터베이스 소프트웨어가 수집·저장·관리·분석하기 어려운 크기의 데이터셋으로 정의하고, 기술이 발전하면 기준이 올라간다고 명시한다.

## 가치와 영향 (McKinsey 2011)

보고서가 든 가치 창출 방식 다섯 가지는 다음과 같다.

| 방식 | 취지 |
| --- | --- |
| 투명성 확보 | 부서·조직 간 데이터를 접근 가능하게 해 탐색·처리 시간을 줄임 |
| 실험 | 성과 변동 원인을 분석하고 통제 실험으로 성과를 올림 |
| 세분화 | 고객·집단을 세분해 맞춤 제공 |
| 의사결정 대체·지원 | 알고리즘으로 위험 판별·재고·가격 조정 등을 자동화·보강 |
| 새로운 사업모델·제품·서비스 | 사용 데이터로 차세대 제품 개선, 위치 기반 서비스 등 |

- 같은 보고서는 미국에서 깊은 분석 인력 14만~19만 명과 데이터를 해석할 관리자·분석가 150만 명이 부족할 것으로 전망했다(2011년 전망이며 현재 수치 아님).
- 한국 교재의 "비즈니스 모델 유형" 분류(예: 데이터 제공·분석·활용 방식별 구분)는 공개 1차 출처를 찾지 못했다. 위 표는 그 분류가 아니다.

## 위기 요인 (Cukier·Mayer-Schönberger 2013)

*Foreign Affairs* 92(3), 28–40 의 글에서 읽은 우려는 다음과 같다. 원문 문장이 아닌 요약이다.

| 위험 | 글의 서술 |
| --- | --- |
| 사생활 | 데이터가 늘수록 사적 정보가 유출될 가능성이 커지고, 현재 기술·법으로 막기 어려울 수 있다 |
| 행위 전 불이익 | 범죄·중퇴 같은 사건을 예측해 사전 조치를 하면, 조치가 도움이어도 낙인·불이익으로 읽힐 수 있다. 행위 전에 불이익이 가는 구조가 자유의지와 충돌한다 |
| 데이터에 대한 과신 | 정부·조직이 수치에 지나치게 의미를 부여해 오판한 사례(글은 베트남전의 수치 집착을 든다) |
| 권력 비대칭 | 국가와 개인 사이 정보 격차가 커져 감시 사회로 갈 수 있다 |
| 시장 지배 | 대규모 데이터 보유 기업의 독과점을 기존 반독점 틀로 다루기 어렵다 |

- 글에서 나온 "사생활 침해·책임 원칙 훼손·데이터 오용" 대응: 사생활=사생활, 책임 원칙 훼손=행위 전 불이익(행위가 아니라 예측에 책임을 묻는 문제), 오용=데이터 과신. 이 대응은 필자가 붙인 해석이며, 한국 교재 표현의 직접 근거가 아니다.
- 같은 저자들의 책(2013)은 "데이터의 독재(dictatorship of data)" 같은 표현으로 과신 문제를 다룬다는 2차 서술을 검색에서 봤을 뿐, 책 본문은 읽지 못했다. 교재가 정리하는 통제 방안의 1차 출처도 미확인이다.
- 한국 법의 개인정보 처리 규정은 [데이터 품질·비식별화](/develop-wiki/knowledge/data-analytics/data-quality-privacy-deidentification/) 노트에서 조문 단위로 본다.

## 헷갈리는 구분

| 쌍 | 차이 |
| --- | --- |
| 3V vs 빅데이터의 정의 | 3V 는 2001년 노트의 세 축이며, Laney(2012)는 이를 빅데이터 정의의 원형으로 본다. 뒤에 붙은 다른 V 들은 정의 요소가 아니라는 것이 그의 서술이다. NIST 등 다른 기관은 다른 V 목록을 쓴다 |
| Variety vs Variability | 다양성은 서로 다른 형식·출처, 변동성은 같은 데이터셋의 속도·구조·의미·품질이 시간에 따라 바뀌는 것(NIST) |
| Veracity vs Validity | 진실성은 값이 정확한가, 타당성은 그 값이 이 용도에 쓰기 적합한가(NIST). 정확해도 부적합할 수 있다 |
| Value | 데이터의 속성이 아니라 활용 결과로 생기는 성질이라는 점이 앞의 V 들과 다르다 |

## 언제 쓰나 / 주의

- 프로젝트 초기에 "우리 문제는 어느 축이 병목인가"를 점검하는 체크리스트로 3V 를 쓸 수 있다. 축별 대응 기술은 [분산 저장·처리](/develop-wiki/knowledge/data-analytics/hadoop-hdfs-mapreduce-yarn/) 노트로 이어진다.
- V 의 개수에 정답이 없다. 보고서에서는 "누구의 V 목록인가"를 밝힌다.
- 가치 수치(2011년 전망 등)는 시기가 지난 추정이다. 최신 시장 규모로 인용하지 않는다.

## 검증 범위

- 읽은 것: Laney 의 2012 블로그 글, NIST SP 1500-1r2 의 V 정의·빅데이터 정의 절, IBM 빅데이터 개요 페이지, MGI(2011) 요약본 PDF(정의 상자, 가치 창출 5방식, 인력 전망), Foreign Affairs 2013 글 PDF(Brown CS 강의 자료 사본).
- 못 읽은 것: Laney 2001 노트의 META Group 원본(블로그 사본은 읽음), IBM 4V 인포그래픽, Demchenko 등 논문 본문, Mayer-Schönberger & Cukier 책, Beyer & Laney(2012) 정의 문서.
- 미확인: 4V·5V 최초 제안자 확정, 한국 교재 비즈니스 모델 유형·통제 방안 틀의 1차 출처.
- 직접 계산·실행: 없음.
