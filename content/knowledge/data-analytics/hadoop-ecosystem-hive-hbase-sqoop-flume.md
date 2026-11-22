---
title: 하둡 생태계 도구 — Hive·HBase·Pig·Sqoop·Flume 등
aka: [Hadoop Ecosystem, Hive, HBase, Pig, Sqoop, Flume, Oozie, ZooKeeper, Kafka, Zeppelin, Impala, Apache Attic]
category: data-analytics
group: platform
level: beginner
summary: 하둡 주변 도구 10종이 각각 수집·저장·질의·워크플로·조정·시각화 중 무엇을 맡는지 한 줄로 정리하고, 2026-11 기준 프로젝트 상태(Attic 이동 여부)를 공식 페이지로 확인해 구분한다.
tags: [hadoop, hive, hbase, pig, sqoop, flume, oozie, zookeeper, kafka, zeppelin, impala, attic]
related: [data-analytics/hadoop-hdfs-mapreduce-yarn, data-analytics/spark-rdd-dataframe-vs-mapreduce, data-analytics/nosql-types-cap-base, data-analytics/etl-elt-cdc-eai-integration, data-analytics/data-warehouse-data-mart-lake-lakehouse, data-analytics/exam-map-adsp-adp-bigdata-analyst]
sources:
  - https://attic.apache.org/projects.html
  - https://hive.apache.org/
  - https://hbase.apache.org/
  - https://pig.apache.org/
  - https://sqoop.apache.org/
  - https://flume.apache.org/
  - https://zookeeper.apache.org/
  - https://kafka.apache.org/
  - https://zeppelin.apache.org/
  - https://impala.apache.org/
updatedAt: 2026-11-23
---

## 개요

- 하둡 코어(HDFS·YARN·MapReduce)만으로는 데이터 수집, SQL 질의, 워크플로, 조정 같은 일을 직접 짜야 한다. 이를 맡는 주변 프로젝트를 흔히 "하둡 생태계"라고 부른다.
- 공식 용어가 아니라 관용 표현이다. 어느 도구까지 생태계에 넣는지는 자료마다 다르다(예: Kafka 는 하둡과 별개 프로젝트).
- 이 노트의 상태 값은 2026-11-23 에 각 프로젝트 공식 페이지와 Apache Attic 퇴역 목록을 읽어 확인한 것이다. 수험서의 표(예전 시점)와 다를 수 있다.

## 시험 범위 대응

- ADP 필기 "데이터 처리 기술 이해"의 분산 데이터 저장·분산 컴퓨팅, 빅데이터분석기사 "빅데이터 플랫폼"과 관련한 배경 지식. 공식 출제범위에는 도구 이름 목록이 직접 적혀 있지 않다(관련: 분산 데이터 저장 기술, 분산 컴퓨팅 기술). 시험에서 어떤 도구를 묻는지는 미확인.

## 도구별 한 줄 정리

| 도구 | 하는 일(공식 페이지 서술 기준, 의역) | 분류 | 2026-11 상태 |
| --- | --- | --- | --- |
| Hive | 분산 저장소의 대용량 데이터를 SQL 로 분석하는 분산·내결함성 데이터 웨어하우스 시스템 | 질의 | 활성. 사이트 신규 릴리스 배너 4.2.1 |
| HBase | 구글 Bigtable 을 본뜬 분산·확장형 빅데이터 저장소. 무작위 실시간 읽기·쓰기용 | 저장(NoSQL, 컬럼 패밀리) | 활성으로 보임. 사이트에 최신 릴리스 표기 없음, 문서 버전 1.4~2.6 목록 → 최신 버전 미확인 |
| Pig | Pig Latin 이라는 고수준 언어로 쓴 프로그램을 MapReduce 잡 연속으로 컴파일하는 분석 플랫폼 | 처리·스크립트 | Attic 목록에 없음. 사이트 최신 뉴스 0.18.0, 저작권 표기 2007-2018 → 활동 여부 미확인 |
| Sqoop | 하둡과 관계형 DB 같은 정형 저장소 사이에서 대량 데이터를 옮기는 도구 | 수집(정형) | **퇴역(Attic)** 2021-06. 사이트 상단에 퇴역 안내 |
| Flume | 대량 로그 등 스트리밍 데이터를 수집·집계·이동하는 분산 서비스 | 수집(로그) | Attic 목록에 없음. 최신 1.11.0(2022-10-24), 사이트에 퇴역 고지 없음 |
| Oozie | 하둡 잡을 관리하는 워크플로 스케줄러(Attic 목록 문구, Oozie 공식 페이지는 읽지 않음) | 워크플로 | **퇴역(Attic)** 2025-02 |
| ZooKeeper | 분산 애플리케이션용 조정 서비스. 이름 짓기·동기화·그룹 서비스를 계층 네임스페이스와 복제 서버로 제공 | 조정 | 활성. 사이트 최신 3.9.7 |
| Kafka | 분산 이벤트 스트리밍 플랫폼. 데이터 파이프라인·스트리밍 분석·통합에 사용 | 수집(스트림) | 활성. 릴리스 메뉴 첫 항목 4.4(최신 표기는 아님, 첫 항목) |
| Zeppelin | 웹 기반 노트북. 인터프리터로 Spark·JDBC·Python 등에 연결해 대화형 분석 | 시각화·탐색 | Attic 목록에 없음. 사이트 최신 0.12.1 |
| Impala | 오픈 데이터·테이블 포맷용 네이티브 분석 데이터베이스(사이트 서술) | 질의(SQL) | Attic 목록에 없음. 사이트에 버전 표기 없음. 최상위 프로젝트 여부는 페이지에서 확인 못 함 |

- Attic: Apache 소프트웨어 재단에서 활동이 멈춘 프로젝트를 보관하는 곳. 퇴역 후에는 새 릴리스가 없고 기존 소스·릴리스만 남는다고 이해하면 된다(이 노트는 Attic 정책 문서를 읽지 않았다).
- Attic 목록(총 108개, 읽은 시점)에서 하둡 관련 퇴역 예: Sqoop(2021-06), Oozie(2025-02), Chukwa(2020-05), Falcon(2019-06), Giraph(2023-09), Hama(2020-04), Sentry(2020-12), Crunch(2020-06). Attic 목록에 없다는 것은 "퇴역이 아니다"일 뿐 "활발하다"를 뜻하지 않는다.

## 헷갈리는 구분

| 쌍 | 차이 |
| --- | --- |
| Hive vs HBase | Hive 는 SQL 로 대량 분석(주로 배치), HBase 는 키 기반 무작위 읽기·쓰기 저장소 |
| Hive vs Impala | 둘 다 SQL 질의 계층. 실행 방식 차이의 세부는 이 노트에서 미확인 |
| Sqoop vs Flume | Sqoop 은 관계형 DB 와의 일괄 이동, Flume 은 로그 같은 지속 생성 데이터의 수집 |
| Flume vs Kafka | Flume 은 수집·전달 에이전트, Kafka 는 이벤트를 보관하며 여러 소비자가 읽는 스트리밍 플랫폼 |
| Pig vs Hive | Pig 는 절차적 스크립트 언어, Hive 는 SQL. 둘 다 원래 하둡 위에서 변환을 쉽게 쓰려는 도구(Pig 는 MapReduce 로 컴파일) |
| ZooKeeper | 데이터 처리가 아니라 분산 시스템의 조정(락·설정·리더 선출 등)을 맡는다. ZooKeeper 사이트는 Kafka·Hadoop·HBase 등이 신뢰해 쓰는 조정 커널이라고 소개한다(Kafka 4.0 부터는 ZooKeeper 없이 동작한다) |

- "Zeppelin 은 시각화 도구"라고 외우기 쉽지만 공식 서술은 대화형 분석용 노트북이며 시각화는 그 기능 중 하나다.

## 데이터가 흐르는 순서(개념도)

- 수집: Sqoop(DB), Flume(로그), Kafka(스트림) → 저장: HDFS·HBase → 처리·질의: MapReduce·Pig·Hive·Impala(그리고 [Spark](/develop-wiki/knowledge/data-analytics/spark-rdd-dataframe-vs-mapreduce/)) → 탐색: Zeppelin. 조정·스케줄은 ZooKeeper·Oozie.
- 위 흐름은 이해를 위한 필자의 정리이며 공식 아키텍처 그림이 아니다.

## 언제 쓰나 / 주의

- 새 프로젝트에서 도구를 고를 때는 **프로젝트 상태를 먼저 본다.** Sqoop·Oozie 처럼 퇴역한 도구는 신규 도입 대상이 아니다. 대체 후보(예: 클라우드 관리형 서비스)는 이 노트에서 검토하지 않았다.
- 시험 대비 용도라면 도구 역할의 한 줄 요약이 핵심이고 상태는 현업 판단용일 것이다(필자 추정, 출제 방식은 미확인).
- 도구가 많을수록 운영 복잡도가 커진다. 배치·스트리밍 중 필요한 최소 구성을 고른다.
- 연계·수집 방식의 개념은 [ETL·ELT·CDC·EAI](/develop-wiki/knowledge/data-analytics/etl-elt-cdc-eai-integration/), 코어는 [HDFS·MapReduce·YARN](/develop-wiki/knowledge/data-analytics/hadoop-hdfs-mapreduce-yarn/), HBase 의 데이터 모델은 [NoSQL 유형](/develop-wiki/knowledge/data-analytics/nosql-types-cap-base/).

## 검증 범위

- 읽은 것: attic.apache.org/projects.html(퇴역 목록), 각 프로젝트 공식 첫 페이지(Hive, HBase, Pig, Sqoop, Flume, ZooKeeper, Kafka, Zeppelin, Impala). 페이지는 요약 도구를 거쳐 읽었고 날짜가 직접 보이지 않는 항목은 "표기 없음"으로 적었다. Hive 릴리스 날짜는 링크 주소만으로 추정되어 적지 않았다.
- 미확인: Oozie·Pig·Impala 의 현재 개발 활동, HBase 최신 버전, Impala 의 ASF 내 지위, 도구별 대체재, 수험서에서 요구하는 도구 목록. projects.apache.org 의 프로젝트 목록 페이지는 동적 로딩이라 읽지 못했다.
- 실행: 없음(설치·실행하지 않음).
