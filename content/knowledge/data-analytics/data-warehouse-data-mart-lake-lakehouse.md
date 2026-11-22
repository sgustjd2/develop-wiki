---
title: 데이터 웨어하우스·데이터 마트·데이터 레이크·레이크하우스
aka: [Data Warehouse, DW, Data Mart, Data Lake, Lakehouse, OLTP, OLAP, Star Schema, Snowflake Schema, Inmon, Kimball]
category: data-analytics
group: platform
level: intermediate
summary: 분석용 저장소의 네 형태(DW·데이터 마트·레이크·레이크하우스)와 OLTP/OLAP, 스타·스노플레이크 스키마, Inmon 대 Kimball 접근을 구분하고, ADsP 의 '데이터 마트'가 DW 의 데이터 마트와 어떻게 이어지는지 밝힌다.
tags: [data-warehouse, data-mart, data-lake, lakehouse, olap, oltp, star-schema, snowflake-schema, inmon, kimball]
related: [data-analytics/etl-elt-cdc-eai-integration, data-analytics/hadoop-hdfs-mapreduce-yarn, data-analytics/spark-rdd-dataframe-vs-mapreduce, data-analytics/nosql-types-cap-base, data-analytics/r-basics-data-mart-apply-dplyr, data-analytics/dikw-data-types-database-basics, data-analytics/data-quality-privacy-deidentification, data-modeling/normalization, data-modeling/transaction-isolation]
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/online-transaction-processing
  - https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/online-analytical-processing
  - https://learn.microsoft.com/en-us/azure/architecture/data-guide/scenarios/data-lake
  - https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/
  - https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/kimball-data-warehouse-bus-architecture/
  - https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf
  - https://en.wikipedia.org/wiki/Data_warehouse
updatedAt: 2026-11-23
---

## 개요

- 업무 시스템(OLTP)은 거래 기록에 맞춰 설계돼 대량 집계·분석에 불리하다. 그래서 분석용으로 따로 모은 저장소가 생겼다.
- 흐름: **데이터 웨어하우스**(정제·구조화, 쓰기 시 스키마) → **데이터 레이크**(원본 그대로, 읽기 시 스키마) → **레이크하우스**(레이크의 개방 포맷 저장소 위에 웨어하우스식 관리 기능). **데이터 마트**는 웨어하우스의 주제별 부분 집합 개념이다.
- 이 용어들은 서로 대체재라기보다 한 조직에서 층으로 공존하는 경우가 많다.

## 시험 범위 대응

- ADsP "데이터분석 > R기초와 데이터 마트" 의 항목명 "데이터 마트", 빅데이터분석기사 2과목 "분석 변수 처리(파생변수 생성)" 와 관련. ADP "데이터 처리 기술 이해"의 ETL·저장 맥락과도 이어진다.
- 공식 출제범위 문서에는 항목 이름만 있고 데이터 마트의 정의·내용 설명은 없다. 수험 교재에서 데이터 마트를 "요약변수·파생변수를 만드는 분석용 데이터 집합"으로 설명한다는 점은 이 노트에서 교재를 읽지 않아 미확인이다.
- 다만 용어 자체는 같다: DW 문헌의 데이터 마트(한 주제·부서용 작은 웨어하우스)와, 분석용 변수를 모아 둔 분석 데이터 마트는 **같은 계열의 말**이다. 둘 다 "전사 저장소에서 목적에 맞게 떼어 정리한 데이터"라는 개념을 공유한다. 분석 데이터 마트의 세부 구성은 [R 기초·데이터 마트](/develop-wiki/knowledge/data-analytics/r-basics-data-mart-apply-dplyr/) 노트가 맡는다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 온라인 트랜잭션 처리 | OLTP | 일상 업무의 거래를 기록하고 조회하는 시스템. 쓰기 위주, 정규화, 강한 일관성(ACID) |
| 온라인 분석 처리 | OLAP | 대량 데이터의 복잡한 계산·추세 분석을 위한 읽기 위주 시스템. 이력 보존, 별/눈송이 스키마 |
| 데이터 웨어하우스 | Data Warehouse | 의사결정 지원을 위해 여러 원천을 통합해 이력으로 쌓은 저장소 |
| 데이터 마트 | Data Mart | 하나의 주제·기능 영역(영업·재무·마케팅 등)을 다루는 더 작은 웨어하우스. 보통 한 부서가 운영 |
| 데이터 레이크 | Data Lake | 대량 데이터를 원본(raw) 형식 그대로 저장하는 저장소. 변환은 필요할 때 적용(스키마 온 리드) |
| 레이크하우스 | Lakehouse | 개방형 직접 접근 포맷(Parquet 등) 저장소 위에 트랜잭션 메타데이터 계층을 얹어 웨어하우스식 기능을 제공하는 구조(Armbrust 외 2021 제안) |
| 차원 모델링 | Dimensional modeling | 팩트(측정값)와 디멘션(설명 맥락)으로 분석 모델을 구성하는 Kimball 방식 |
| 스타 스키마 | Star schema | 팩트 테이블 하나를 여러 디멘션 테이블이 둘러싼 구조 |
| 스노플레이크 스키마 | Snowflake schema | 디멘션을 다시 정규화해 하위 테이블로 쪼갠 스타 스키마의 변형(Kimball 문서는 "snowflaked dimensions" 로 언급만 함) |

## Inmon 의 웨어하우스 정의

- 널리 인용되는 W. H. Inmon 의 정의에 따르면 웨어하우스의 데이터는 **주제 지향(subject-oriented)·통합(integrated)·시간 가변(time-variant)·비휘발(non-volatile)** 이다. 주제 지향은 개별 업무 프로세스가 아니라 기업의 핵심 주제(고객·상품 등)를 중심으로 조직한다는 뜻이다. 통합은 여러 운영 시스템의 데이터를 일관된 이름·형식으로 합친다는 뜻이다. 시간 가변은 긴 기간(문헌에 따라 최대 약 10년)의 이력을 둔다는 뜻이다. 비휘발은 적재 후에는 법적 요구가 없는 한 바꾸지 않는다는 뜻이다.
- 한계: 이 풀이는 위키백과의 요약(보조 자료)과 널리 퍼진 정의에 근거한다(위키백과는 이 4가지에 데이터 입도(granularity)를 더한 5가지를 나열하며 Inmon 4특성이라고 귀속하지는 않는다. Inmon 정의의 인용은 arXiv 1307.3448 에서 확인됐다). Inmon 의 원전(Building the Data Warehouse)은 읽지 못해 문구가 판본마다 약간 다를 수 있다.

## Inmon 대 Kimball

| 구분(구축 방식 기준) | Inmon(하향식) | Kimball(상향식) |
| --- | --- | --- |
| 출발점 | 정규화된 전사 데이터 모델 | 비즈니스 프로세스별 차원 모델 |
| 중앙 | 상세 데이터를 중앙 웨어하우스에 저장 | 프로세스별 모델을 "버스" 로 연결 |
| 데이터 마트 | 중앙 웨어하우스에서 부서별 마트를 만든다 | 먼저 마트(프로세스별 차원 모델)를 만들고 통합한다 |

- 위 표는 위키백과의 비교 서술과 Kimball Group 의 버스 아키텍처 문서에 근거한 요약이다. Kimball 문서는 버스 아키텍처를 "기술·DB 에 독립적이며 웨어하우스를 점진적으로 만드는 방식"으로 설명하고, 적합 차원(conformed dimensions)을 한 번 관리해 여러 팩트 테이블에서 재사용하며 "버스 매트릭스"가 설계 청사진이라고 한다. 설계는 전사 관점으로 하되 구축은 프로세스 단위로 상향식으로 한다.
- Kimball 문서는 "데이터 마트"라는 말을 쓰지 않는다. 마트 = 프로세스별 차원 모델이라는 대응은 문서 구조에서 읽은 해석이다.
- 어느 쪽이 낫다는 결론은 내리지 않는다. 조직 규모·일정·거버넌스에 따라 달라진다.

## OLTP vs OLAP

Azure Architecture Center 의 서술을 기준으로 정리한다.

| 항목 | OLTP | OLAP |
| --- | --- | --- |
| 목적 | 일상 거래 기록·조회 | 복잡한 계산·추세 분석 |
| 부하 | 쓰기 많음, 읽기 보통 | 읽기 많음, 쓰기 적음(읽기 전용) |
| 정규화 | 높음 | 별·눈송이·큐브 형태(전통 정규화 아님) |
| 스키마 | 쓰기 시 스키마, 강제 | 쓰기 시 스키마, 강제 |
| 트랜잭션·잠금 | 사용(비관/낙관) | 사용하지 않음 |
| 규모 예시 | 소(MB)~대(수 TB) | 수백 GB~수 PB |

- OLAP 은 원천을 정기적으로 복사·정제해 갱신하므로 즉시성보다 전략적 의사결정에 맞는다(같은 문서). 분석을 OLTP 에서 직접 돌리면 자원을 많이 쓰고 다른 트랜잭션을 막을 수 있다.
- 정규화 자체는 [정규화](/develop-wiki/knowledge/data-modeling/normalization/) 노트를 본다. 여기서 "정규화"는 DB 정규화이며, 값 범위를 맞추는 스케일링과는 다른 말이다.

## 데이터 레이크와 레이크하우스

- 레이크는 정형·반정형·비정형 데이터를 원본 형식으로 보관하고 필요할 때 변환한다(Azure 문서). 장점: 원본 보존, 자유로운 탐색. 위험: 메타데이터·거버넌스가 부족하면 찾을 수 없는 "데이터 늪(data swamp)" 이 된다.
- Azure 문서는 레이크를 raw(bronze)·cleansed(silver)·curated(gold) 계층으로 나누는 메달리언 구조를 소개한다. 이는 한 벤더 문서의 설계 예이며 표준 용어는 아니다.
- Armbrust 외(CIDR 2021)의 서술: 1세대(운영 DB → 웨어하우스 ETL) → 2세대(레이크에 원본을 쌓고 일부만 웨어하우스로 ETL) → 오늘의 레이크+웨어하우스 2계층. 이 2계층이 신뢰성(두 시스템 정합), 데이터 낡음, 고급 분석 지원 한계, 총소유비용 문제를 낳는다고 본다.
- 제안(레이크하우스): 객체 저장소에 Parquet 같은 표준 파일 포맷으로 데이터를 두고, 어느 객체가 테이블 버전에 속하는지 정의하는 **트랜잭션 메타데이터 계층**을 얹어 ACID 와 버전 관리를 제공한다. Delta Lake·Apache Iceberg 를 그런 시스템으로 든다.
- 논문은 "웨어하우스 구조가 앞으로 쇠퇴할 것"이라는 **주장(argument)** 이다. Databricks 소속 저자들의 관점이며 업계 합의된 사실은 아니다.

| 구분 | 웨어하우스 | 레이크 | 레이크하우스 |
| --- | --- | --- | --- |
| 스키마 | 쓰기 시 | 읽기 시 | 메타데이터 계층으로 관리 |
| 데이터 | 정제·구조화 | 원본(정형~비정형) | 레이크와 동일 저장소 |
| 약점 | 비용·비정형 한계 | 품질·거버넌스 | 메타데이터 계층 의존, 논문 제안 단계의 주장 포함 |

- 마지막 열의 약점은 필자의 정리이며 논문이 나열한 한계가 아닐 수 있다.

## 직접 계산

Python 3.15.0 의 `sqlite3` 로 장난감 스타 스키마(디멘션 2, 팩트 1)를 만들어 집계했다. 값은 직접 지은 것이다.

- 월·상품 범주별 (월, 범주, 수량 합, 금액 합): (2026-01, kitchen, 2, 16.0), (2026-01, stationery, 10, 10.0), (2026-02, kitchen, 1, 8.0), (2026-02, stationery, 8, 14.0)
- 월별 금액 합: 2026-01 = 26.0, 2026-02 = 22.0 (5개 팩트 행의 합과 일치)
- 요점: 분석 질의가 팩트에서 디멘션으로의 조인 + group by 로 표현된다.

## 언제 쓰나 / 주의

- 정형 데이터로 일관된 보고·BI 가 중심이면 웨어하우스(또는 마트). 원본을 먼저 모으고 탐색·머신러닝이 필요하면 레이크. 두 요구가 겹치고 중복 복사를 줄이고 싶으면 레이크하우스를 검토한다.
- 적재 방식은 [ETL·ELT](/develop-wiki/knowledge/data-analytics/etl-elt-cdc-eai-integration/). 저장 기반은 [HDFS](/develop-wiki/knowledge/data-analytics/hadoop-hdfs-mapreduce-yarn/)·객체 저장소, 처리 엔진은 [Spark](/develop-wiki/knowledge/data-analytics/spark-rdd-dataframe-vs-mapreduce/).
- 레이크는 소형 파일 누적, 사본 중복, 보관·삭제 정책(개인정보·감사)을 의식하지 않으면 비용과 위험이 커진다 → [데이터 품질·개인정보](/develop-wiki/knowledge/data-analytics/data-quality-privacy-deidentification/).
- 같은 말의 다른 뜻 주의: "데이터 마트" = (1) DW 의 주제별 저장소, (2) 분석용 파생·요약 변수 집합(수험 맥락). "정규화" = DB 정규화 / 값 스케일링 / 모델 규제.

## 검증 범위

- 읽은 것: Azure Architecture Center 의 OLTP·OLAP·데이터 레이크 문서, Kimball Group 의 차원 모델링 기법 목록·버스 아키텍처 페이지, Armbrust 외 CIDR 2021 논문 앞부분(초록·서론·핵심 아이디어 절, PDF 텍스트 추출), 위키백과 Data warehouse(보조).
- 미확인: Inmon 정의의 원전 문구(Building the Data Warehouse, 1992), 스노플레이크 스키마의 Kimball 정의와 장단(목록 언급만 확인), 레이크하우스 논문의 성능(TPC-DS) 실험 상세, 수험 교재의 데이터 마트 설명, 데이터 웨어하우스 팩트 유형별 세부.
- 실행: sqlite3 장난감 스키마 집계만 실행. 실제 DW·레이크 제품은 실행하지 않았다.
