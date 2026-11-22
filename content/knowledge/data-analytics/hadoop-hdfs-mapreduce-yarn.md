---
title: 하둡의 핵심 — HDFS·MapReduce·YARN
aka: [Apache Hadoop, HDFS, MapReduce, YARN, NameNode, DataNode, ResourceManager, 분산 파일 시스템, 분산 컴퓨팅]
category: data-analytics
group: platform
level: intermediate
summary: 하둡을 분산 저장(HDFS)·병렬 처리(MapReduce)·자원 관리(YARN) 세 층으로 나눠 구조와 동작 단계, 블록 크기·복제 수 기본값, 원 논문과의 구분을 정리한다.
tags: [hadoop, hdfs, mapreduce, yarn, distributed-storage, distributed-computing, batch]
related: [data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume, data-analytics/spark-rdd-dataframe-vs-mapreduce, data-analytics/nosql-types-cap-base, data-analytics/etl-elt-cdc-eai-integration, data-analytics/cloud-service-models-nist-iaas-paas-saas, data-analytics/exam-map-adsp-adp-bigdata-analyst, data-modeling/sharding-partitioning, distributed-systems/replication-quorum]
sources:
  - https://hadoop.apache.org/
  - https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html
  - https://hadoop.apache.org/docs/r3.5.0/hadoop-project-dist/hadoop-hdfs/hdfs-default.xml
  - https://hadoop.apache.org/docs/r3.5.0/hadoop-yarn/hadoop-yarn-site/YARN.html
  - https://hadoop.apache.org/docs/r3.5.0/hadoop-mapreduce-client/hadoop-mapreduce-client-core/MapReduceTutorial.html
  - https://research.google/pubs/the-google-file-system/
  - https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/
updatedAt: 2026-11-23
---

## 개요

- Apache Hadoop 은 여러 대의 일반 서버에 데이터를 나눠 저장하고 병렬로 처리하는 오픈 소스 프레임워크다. 공식 사이트가 나누는 모듈은 Common(공통 유틸), **HDFS**(분산 파일 시스템), **YARN**(작업 스케줄링·클러스터 자원 관리), **MapReduce**(YARN 기반 병렬 처리)다.
- 버전: 2026-11-23 확인 시 공식 사이트 릴리스 목록의 최신은 3.5.0(2026-04-02, "3.5 라인 첫 안정 릴리스"로 표기), 3.4 라인 최신 3.4.3(2026-02-24). 이 노트의 YARN·MapReduce·hdfs-default 값은 3.5.0 문서, HDFS 구조 설명은 `stable` 별칭의 문서(페이지에 3.3.5 로 표기)에서 읽었다.
- 핵심 발상: 데이터가 크면 데이터를 한 곳으로 옮기기보다 **저장된 곳 근처에서 계산**한다. 서버 장애는 예외가 아니라 일상으로 보고 복제로 흡수한다.

## 시험 범위 대응

- ADP 필기 "데이터 처리 기술 이해 > 데이터 처리 기술": 분산 데이터 저장 기술(HDFS), 분산 컴퓨팅 기술(MapReduce·YARN). 빅데이터분석기사 1과목 "빅데이터 플랫폼"과 관련. ADsP 에는 직접 항목 없음.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 네임노드 | NameNode | HDFS 의 네임스페이스·파일-블록 매핑을 관리하는 마스터. 사용자 데이터는 지나가지 않는다 |
| 데이터노드 | DataNode | 블록을 저장하고 읽기·쓰기를 처리하며, NameNode 지시로 블록을 만들고 지우고 복제한다 |
| 블록 | Block | 파일을 나눈 단위. 마지막 블록 외에는 같은 크기(가변 길이 블록을 지원하면 채우지 않고 새 블록을 시작할 수 있다는 단서가 설계 문서에 있다) |
| 복제 수 | Replication factor | 블록을 몇 벌 보관하는가. 파일별로 지정·변경 가능 |
| 입력 분할 | Input split | 맵 태스크 하나가 처리하는 입력의 논리 조각 |
| 셔플 | Shuffle | 리듀서가 모든 맵 출력에서 자기 파티션을 가져와 합치는 단계 |
| 리소스 매니저 | ResourceManager | 클러스터 전체 자원을 중재하는 YARN 마스터 (Scheduler + ApplicationsManager) |
| 노드 매니저 | NodeManager | 노드마다 컨테이너를 관리하고 자원 사용을 보고하는 에이전트 |
| 애플리케이션 마스터 | ApplicationMaster | 애플리케이션 하나당 하나. 컨테이너를 요청하고 태스크 진행을 추적한다 |
| 컨테이너 | Container (YARN) | 메모리·CPU·디스크·네트워크를 묶은 자원 단위 (OS 컨테이너 기술과 다른 개념) |

## HDFS 구조

- 마스터/슬레이브: NameNode 1 + DataNode 다수. 파일은 블록으로 쪼개져 DataNode 에 분산·복제된다.
- 접근 모델: 쓰기 한 번, 읽기 여러 번(write-once-read-many). 파일 변경은 append·truncate 로 제한되고 파일당 작성자는 한 명이다. 낮은 지연보다 높은 처리량을 우선한다.
- 기본값(hdfs-default.xml, 3.5.0): `dfs.blocksize` = 134217728 바이트(128 MB), `dfs.replication` = 3. 둘 다 생성 시점에 지정하지 않으면 적용되는 기본값이다.
- 복제 위치(복제 수 3 기준): 쓰는 노드(또는 같은 랙 노드)에 1, 다른 랙에 1, 그 다른 랙의 다른 노드에 1. 랙 단위 장애와 대역폭을 함께 고려한다.
- 장애 감지: DataNode 가 주기적으로 하트비트와 블록 리포트를 보낸다. 하트비트가 끊긴 DataNode 는 기본 10분 넘게 응답이 없으면 죽은 것으로 본다(3.3.5 문서 서술).
- 메타데이터: FsImage(전체 네임스페이스·블록 매핑)와 EditLog(변경 기록). 체크포인트는 시간(`dfs.namenode.checkpoint.period`) 또는 트랜잭션 수(`dfs.namenode.checkpoint.txns`) 중 먼저 오는 조건에서 일어난다.
- 수험서의 "보조 네임노드(Secondary NameNode)": 읽은 HDFS 설계 문서(3.3.5)는 이를 언급하지 않고 체크포인트를 NameNode 의 일로 서술한다. 보조 네임노드를 "대기(백업) 네임노드"로 이해하면 오해일 수 있다. 정확한 역할 구분은 미확인.

## MapReduce

데이터 흐름(공식 튜토리얼 기준): 입력 `<k1,v1>` → map → `<k2,v2>` → (combine) → shuffle·sort → reduce → `<k3,v3>` 출력.

| 단계 | 하는 일 |
| --- | --- |
| Map | 입력 분할마다 맵 태스크가 레코드를 중간 키-값 쌍으로 바꾼다. 한 레코드가 0개 이상의 쌍을 낼 수 있다 |
| Combine(선택) | 맵 쪽 로컬 출력을 미리 합쳐 네트워크로 보낼 양을 줄인다 |
| Shuffle | 리듀서가 모든 맵 출력에서 자기 몫의 파티션을 HTTP 로 가져와 병합한다 |
| Sort | 키 기준 정렬·그룹화. 리듀서는 키마다 그 값들의 묶음을 한 번 받는다 |
| Reduce | 키별로 한 번 실행되어 최종 출력을 쓴다. 리듀서 출력은 정렬되지 않는다 |

- 키·값은 `Writable`, 키는 정렬을 위해 `WritableComparable` 이어야 한다. 입력 분할 기본 크기는 파일 크기로 정하되 파일 시스템 블록 크기가 상한 역할을 한다.
- 맵 출력은 로컬 디스크에 쓰고, 리듀서 단계 입력은 셔플로 모인다 — 그래서 반복 계산이 많은 작업은 디스크 입출력 부담이 크다 → [Spark 와의 비교](/develop-wiki/knowledge/data-analytics/spark-rdd-dataframe-vs-mapreduce/).

## 직접 계산

Python 3.15.0 으로 단어 세기를 단계별로 흉내 냈다(하둡을 실행한 것이 아니라 단계 개념을 재현한 것). 공식 튜토리얼의 입력 두 줄(`Hello World Bye World`, `Hello Hadoop Goodbye Hadoop`)을 썼다.

1. map(분할 2개) 후 combine: `[Hello1, World2, Bye1]`, `[Hello1, Hadoop2, Goodbye1]`
2. shuffle(데모용 파티셔너, 리듀서 2개) + 키 정렬: 리듀서 0 입력 `Bye1, Hello1, Hello1, World2`, 리듀서 1 입력 `Goodbye1, Hadoop2`
3. reduce 결과 합치면 Bye 1, Goodbye 1, Hadoop 2, Hello 2, World 2 — 튜토리얼의 출력과 같다.

파티셔너(키를 리듀서에 배정하는 규칙)는 데모용 임의 함수다. 하둡 기본 파티셔너의 동작은 이 노트에서 확인하지 않았다.

## YARN

- 하둡 2 이후 자원 관리와 작업 스케줄링·모니터링을 분리한 구조. 클러스터 전체를 맡는 **ResourceManager**, 애플리케이션마다 하나의 **ApplicationMaster**.
- ResourceManager 는 둘로 나뉜다. **Scheduler** 는 용량·큐 제약에 따라 자원을 나누며 상태 감시나 재시작은 하지 않는다(Capacity·Fair 스케줄러 등 플러그인). **ApplicationsManager** 는 제출을 받고 ApplicationMaster 용 첫 컨테이너를 띄우며 실패 시 재시작한다.
- NodeManager 는 노드의 컨테이너와 자원 사용을 관리해 RM 에 보고한다. ApplicationMaster 는 Scheduler 에 컨테이너를 요청하고 NodeManager 와 태스크를 실행·감시한다. 한 애플리케이션은 단일 잡이거나 잡의 DAG 일 수 있다.
- 결과: MapReduce 외 엔진(예: Spark)도 같은 클러스터 자원을 YARN 으로 나눠 쓸 수 있다는 것이 구조상 장점이다(YARN 문서는 "프레임워크별 ApplicationMaster"라고 서술).

## 원 논문과 하둡 구분

| 구분 | 출처 | 내용 |
| --- | --- | --- |
| GFS 논문 | Ghemawat, Gobioff, Leung, SOSP 2003 | 대규모 데이터 응용을 위한 분산 파일 시스템 설계. 값싼 장비에서 장애를 견디며 높은 총 처리량 제공 |
| MapReduce 논문 | Dean, Ghemawat, OSDI 2004 | map·reduce 함수로 쓰고, 런타임이 분할·스케줄·장애 복구·통신을 맡는 프로그래밍 모델과 구현 |
| Apache Hadoop | 위 공식 문서 | 오픈 소스 구현체. 수치(128 MB, 3 등)는 하둡의 기본값이며 논문의 값이 아니다 |

- 하둡이 논문을 어디까지 따랐는지, GFS 의 청크 크기 등 논문 세부 수치는 이 노트에서 확인하지 않았다(논문 초록 수준만 읽음).

## 언제 쓰나 / 주의

- 쓰기 좋음: 큰 파일을 순차로 읽는 배치 분석, 값싼 저장소에 대용량 원본 보관(레이크 기반).
- 어려움: 작은 파일 대량(NameNode 메타데이터 부담은 일반론이며 본문에서 확인하지 않음), 낮은 지연 임의 접근(HDFS 는 처리량 지향), 반복·대화형 계산(디스크 중심 MapReduce).
- 클라우드 객체 저장소(S3·ADLS·GCS)가 HDFS 를 대체하기 시작했다는 것이 Lakehouse 논문(Armbrust 외 2021)의 서술이다 → [Spark](/develop-wiki/knowledge/data-analytics/spark-rdd-dataframe-vs-mapreduce/), [클라우드 모델](/develop-wiki/knowledge/data-analytics/cloud-service-models-nist-iaas-paas-saas/). 이 추세 서술의 근거는 별도 읽은 Lakehouse 논문(CIDR 2021)의 역사 서술에 한정된다 → [레이크하우스](/develop-wiki/knowledge/data-analytics/data-warehouse-data-mart-lake-lakehouse/).
- 주변 도구(Hive·HBase 등)는 [생태계 노트](/develop-wiki/knowledge/data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume/).
- 복제와 분산 개념 일반은 [복제·쿼럼](/develop-wiki/knowledge/distributed-systems/replication-quorum/).

## 검증 범위

- 읽은 것: hadoop.apache.org 메인(릴리스 목록·모듈 설명), HDFS Design(stable 별칭 = 3.3.5), hdfs-default.xml(3.5.0, 전체 중 처음 10만 자 안의 blocksize·replication), YARN 문서(3.5.0), MapReduce 튜토리얼(3.5.0), GFS·MapReduce 논문의 Google Research 초록 페이지.
- 미확인: GFS·MapReduce 논문 본문, 3.5.0 의 HDFS Design 문서 내용 변화(3.3.5 서술을 그대로 인용), 보조 네임노드·HA 구성, 기본 파티셔너, Ozone 등 관련 프로젝트.
- 실행: 단어 세기 흉내(Python)만 실행. 하둡 클러스터는 실행하지 않았다.
