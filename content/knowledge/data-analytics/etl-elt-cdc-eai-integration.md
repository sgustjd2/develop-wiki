---
title: 데이터 연계·통합 기법 — ETL·ELT·CDC·EAI
aka: [ETL, ELT, CDC, Change Data Capture, EAI, Enterprise Application Integration, ESB, Message Broker, 데이터 연계 및 통합]
category: data-analytics
group: platform
level: intermediate
summary: 시스템 사이에서 데이터를 옮기고 합치는 방식을 ETL·ELT(변환 위치), CDC(변경 감지 방식), EAI·메시징(애플리케이션 연계)으로 나눠 정리하고, 언제 무엇을 고르는지와 비용을 비교한다.
tags: [etl, elt, cdc, eai, integration, messaging, data-pipeline, debezium]
related: [data-analytics/data-warehouse-data-mart-lake-lakehouse, data-analytics/hadoop-hdfs-mapreduce-yarn, data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume, data-analytics/big-data-characteristics-value-risks, data-analytics/exam-map-adsp-adp-bigdata-analyst, distributed-systems/change-data-capture, distributed-systems/transactional-outbox, architecture/event-driven]
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/etl
  - https://debezium.io/documentation/reference/stable/connectors/postgresql.html
  - https://www.enterpriseintegrationpatterns.com/patterns/messaging/IntegrationStylesIntro.html
  - https://www.enterpriseintegrationpatterns.com/patterns/messaging/MessageBroker.html
  - https://www.enterpriseintegrationpatterns.com/patterns/messaging/MessageBus.html
updatedAt: 2026-11-23
---

## 개요

- 여러 시스템에 흩어진 데이터를 분석에 쓰려면 **어떤 데이터를(전체/변경분) · 언제(배치/실시간) · 어디서 변환하는가**를 정해야 한다.
- 이 노트는 세 축을 구분한다. (1) 변환 위치: ETL vs ELT. (2) 변경분 감지: CDC. (3) 애플리케이션 사이 연계: EAI·메시징.
- 세 축은 서로 배타적이지 않다. 예: CDC 로 변경분을 뽑아(추출) ELT 로 레이크에 적재한다.

## 시험 범위 대응

- ADP 필기 "데이터 처리 기술 이해 > 데이터 처리 프로세스": ETL, CDC, EAI, 데이터 연계 및 통합 기법 요약, 대용량 비정형 데이터 처리.
- 빅데이터분석기사 1과목 "데이터 수집 및 전환 / 데이터 적재 및 저장"과 관련. ADsP 에는 직접 항목 없음.
- 아래 구분은 공개 1차 문서 기준이다. 수험 교재의 분류표(예: "EAI 4유형")는 공개 1차 출처를 찾지 못해 이 노트에 싣지 않았다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| ETL | Extract, Transform, Load | 여러 원천의 데이터를 별도 변환 엔진에서 가공한 뒤 목적지에 적재하는 통합 과정(Azure Architecture Center 기준) |
| ELT | Extract, Load, Transform | 먼저 적재하고, 변환은 목적지 저장소의 처리 능력으로 수행하는 방식. ETL 과 변환 위치만 다르다 |
| 변경 데이터 캡처 | CDC | 원천 DB 의 변경(삽입·수정·삭제)을 포착해 전달하는 기법의 총칭 |
| 엔터프라이즈 애플리케이션 통합 | EAI | 서로 다른 업무 애플리케이션을 연결하는 통합. 메시징·브로커·버스 같은 패턴으로 구현된다 |
| 메시지 브로커 | Message Broker | 중앙에서 메시지의 목적지를 결정해 보내는 구성. 발신자와 수신처를 분리한다(허브-앤-스포크) |
| 메시지 버스 | Message Bus | 공통 데이터 모델·공통 명령 집합·메시징 인프라로 구성되는 공유 통신 계층 |
| 엔터프라이즈 서비스 버스 | ESB | 버스·브로커 개념을 제품화한 통합 미들웨어를 가리키는 업계 용어. EIP 사이트는 ESB 를 서술하지 않아 이 노트는 정의를 확정하지 않는다 |

## ETL vs ELT

- ETL 변환 단계: 필터, 정렬, 집계, 조인, 정제, 중복 제거, 검증 같은 작업을 별도 엔진이 수행한다. 중간에 스테이징 테이블을 쓰는 경우가 많다.
- ELT 는 변환 엔진을 파이프라인에서 빼 구조를 단순하게 하고, 목적지를 키우면 파이프라인도 같이 빨라진다. 단 Azure 문서는 탄력적 컴퓨팅을 가진 현대 DW·레이크하우스일 때 ELT 를 고르라고 하며, 변환을 감당할 만큼 강력해야 한다는 것은 이 서술에서 읽은 필자 정리다.
- Azure 문서가 드는 ELT 의 전형: 원본을 HDFS·Blob·Data Lake 에 파일로 두고 Spark·Hive 등으로 질의·변환한다. 큰 데이터에서 복사 단계를 줄인다.

| 구분 | ETL | ELT |
| --- | --- | --- |
| 변환 위치 | 별도 변환 엔진 | 목적지 저장소 안 |
| 원본 보존(필자 정리) | 보통 변환 후 값만 적재 | 원본을 먼저 적재해 보존하기 쉽다 |
| 어울리는 경우(문서 기준) | 제약 있는 목적지에서 무거운 변환 분리, 복잡한 규칙, 적재 전 검수 요구 | 탄력적인 DW·레이크하우스, 원본 보존, 목적지 기능 활용 |
| 비용 | 변환 엔진 운영 | 목적지 컴퓨팅 비용, 원본 보관으로 인한 거버넌스 부담 |

- 둘은 배치 처리다. 데이터가 생기는 즉시 처리하는 스트리밍은 별도 구조(메시지 브로커 + 스트림 처리기)로 설명된다(같은 문서).

## CDC 방식 비교

CDC 구현은 크게 세 가지로 나뉜다. 표의 "로그 기반" 동작은 Debezium PostgreSQL 커넥터 문서를 읽고 확인했고, 나머지 두 방식의 장단은 필자가 정리한 일반 설명이다(공식 문서의 직접 비교 문장은 못 찾았다).

| 방식 | 변경을 아는 방법 | 삭제 감지 | 원천 부하 | 비고 |
| --- | --- | --- | --- | --- |
| 쿼리(폴링) 기반 | `updated_at` 같은 열로 주기 조회 | 어렵다(행이 사라지면 조회되지 않음) | 조회 쿼리 부하 | 사이 구간의 중간 변경은 놓친다 |
| 트리거 기반 | 원천 테이블 트리거가 변경 테이블에 기록 | 가능 | 쓰기 트랜잭션에 추가 작업 | 스키마·트리거 관리 필요 |
| 로그 기반 | DB 트랜잭션 로그를 읽음 | 가능 | 테이블 조회 없음, 로그 보관·슬롯 관리 필요 | DB 종류별 커넥터 필요 |

- Debezium PostgreSQL 커넥터(문서 stable = 3.7 확인): WAL 을 논리 디코딩으로 읽고, 커밋된 insert·update·delete 를 테이블별 Kafka 토픽의 변경 이벤트로 낸다. 시작할 때 일관된 스냅숏을 뜬 뒤 그 WAL 위치부터 스트리밍해 누락을 막고, 이벤트에 기록된 위치(LSN)로 재시작한다.
- 같은 문서가 밝힌 한계: DDL 변경 이벤트가 없고, `pgoutput` 은 생성 열의 값을 잡지 못한다.
- 운영 함정(복제 슬롯 적체 등)은 [CDC 노트](/develop-wiki/knowledge/distributed-systems/change-data-capture/)가 다룬다. 이중 쓰기 회피는 [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/).

## EAI·메시징

Hohpe & Woolf 의 Enterprise Integration Patterns 사이트는 통합 스타일 4가지를 단순한 것에서 정교한 것 순으로 소개한다.

| 스타일 | 요지(의역) |
| --- | --- |
| 파일 전송 | 각 앱이 공유할 데이터를 파일로 만들어 주고받는다(필자 보충: 보통 배치라 데이터가 늦을 수 있다) |
| 공유 데이터베이스 | 공용 DB 에 데이터를 저장해 공유한다 |
| 원격 프로시저 호출 | 앱이 프로시저를 노출하고 다른 앱이 원격 호출한다. 호출자가 기다리므로 상대 장애·네트워크 단절에 취약하다 |
| 메시징 | 공용 메시징 시스템으로 메시지를 교환한다. 비동기를 지원하지만 EIP 는 이해도가 가장 낮은 스타일이라고 쓴다(필자 보충: 보통 메시징 인프라가 필요하다) |

- 같은 페이지는 "어느 하나가 항상 최선은 아니며 실제 시스템은 스타일을 섞는다"고 한다. 사이트의 패턴 카탈로그는 메시징 스타일을 전제한다.
- 메시지 브로커: 중앙 브로커가 메시지를 받아 목적지를 정해 전달(허브-앤-스포크). 병목과 거대화 위험이 있으며, 무상태 브로커 다중 배치나 계층형 브로커로 완화한다고 서술한다.
- 메시지 버스: 공통 데이터 모델 + 공통 명령 집합 + 메시징 인프라. 어댑터가 각 시스템 형식을 버스 형식으로 바꾼다. 앱을 추가·제거해도 다른 앱이 흔들리지 않게 하려는 목적이다.
- "API 연계"(REST 등 호출 기반)는 위 분류에서 원격 호출 스타일에 해당한다. 수험 교재의 "연계 방식" 표와 일대일 대응하는지는 미확인.

## 대용량 비정형 데이터와의 관계

- 비정형(로그·문서·이미지)은 스키마 있는 테이블로 바로 변환하기 어려워 원본을 먼저 분산 저장소에 두는 ELT 형태가 흔하다 → [Hadoop/HDFS](/develop-wiki/knowledge/data-analytics/hadoop-hdfs-mapreduce-yarn/), [생태계 도구(Sqoop·Flume)](/develop-wiki/knowledge/data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume/).
- 변환 후 적재처는 [웨어하우스·레이크·레이크하우스](/develop-wiki/knowledge/data-analytics/data-warehouse-data-mart-lake-lakehouse/).

## 직접 계산

Python 3.15.0 으로 장난감 테이블을 돌려 폴링 방식의 한계를 확인했다(코드 직접 작성, 결정적 결과).

- 설정: id=1 을 두 번 수정(a→a2→a3), id=3 삽입, id=2 삭제. 마지막 폴링 시각 이후 `updated_at > 1` 조건으로 조회.
- 폴링 결과: `{1: a3, 3: c}`. 삭제된 id=2 와 id=1 의 중간 값 a2 는 보이지 않는다.
- 로그 흉내 결과: update(1,a2), update(1,a3), insert(3), delete(2) 네 이벤트가 모두 남는다.
- 이는 개념 시연이며 실제 DB·Debezium 을 실행한 것이 아니다.

## 언제 쓰나 / 주의

| 상황 | 선택 |
| --- | --- |
| 야간 배치로 정제된 DW 를 채움, 변환 규칙이 복잡 | ETL |
| 레이크·클라우드 DW 에 원본을 쌓고 SQL/Spark 로 변환 | ELT |
| 원천 DB 부하 없이 거의 실시간 동기화, 삭제 반영 필요 | 로그 기반 CDC |
| 업무 시스템끼리 느슨하게 연결 | 메시징(브로커/버스) |

- ELT 는 "변환이 사라진다"가 아니라 "변환 위치가 이동한다"이다. 목적지 컴퓨팅 비용과 원본 보관 정책(개인정보 포함)을 같이 설계한다.
- 로그 기반 CDC 는 로그 보관과 커넥터 운영 부담이 있다. 스키마 변경(DDL) 전파는 별도 설계가 필요할 수 있다(위 한계 참고).
- 브로커 중앙 집중은 병목·단일 장애점이 될 수 있다. 중복 전달에 대비해 소비자를 멱등하게 만든다 → [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/).
- 이벤트 기반 설계 전반은 [이벤트 기반 아키텍처](/develop-wiki/knowledge/architecture/event-driven/).

## 검증 범위

- 읽은 것: Azure Architecture Center ETL 문서(2025-09 갱신본)의 ETL/ELT 절, Debezium PostgreSQL 커넥터 문서 앞부분(전체 약 32만 자 중 처음 10만 자)과 문서 버전 표기, EIP 사이트의 통합 스타일·Message Broker·Message Bus 페이지.
- 미확인: 쿼리·트리거 방식의 장단은 필자의 일반 서술이며 출처 문장으로 확인하지 못했다. ESB 의 표준 정의, EAI 토폴로지 분류(포인트-투-포인트·허브-스포크·메시지 버스·하이브리드 등 수험서 구분)의 공개 1차 출처. Hohpe & Woolf 책 본문(웹 사이트 패턴 페이지만 읽음).
- 실행: 위 폴링 시연 외에 Debezium·Kafka·ETL 도구는 실행하지 않았다.
