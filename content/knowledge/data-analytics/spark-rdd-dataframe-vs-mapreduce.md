---
title: Spark — RDD·DataFrame·Dataset 과 MapReduce 비교
aka: [Apache Spark, RDD, Resilient Distributed Dataset, DataFrame, Dataset, Lazy Evaluation, DAG, In-memory Computing]
category: data-analytics
group: platform
level: intermediate
summary: Spark 의 RDD·DataFrame·Dataset 을 구분하고 지연 실행·DAG·캐싱이 MapReduce 의 디스크 중심 단계 처리와 어떻게 다른지, RDD 원 논문(NSDI 2012)과 현재 문서의 내용을 나눠 정리한다.
tags: [spark, rdd, dataframe, dataset, mapreduce, lazy-evaluation, dag, in-memory]
related: [data-analytics/hadoop-hdfs-mapreduce-yarn, data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume, data-analytics/data-warehouse-data-mart-lake-lakehouse, data-analytics/etl-elt-cdc-eai-integration, data-analytics/exam-map-adsp-adp-bigdata-analyst]
sources:
  - https://spark.apache.org/docs/latest/rdd-programming-guide.html
  - https://spark.apache.org/docs/latest/sql-programming-guide.html
  - https://spark.apache.org/downloads.html
  - https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf
updatedAt: 2026-11-23
---

## 개요

- Apache Spark 는 클러스터에서 데이터를 병렬 처리하는 엔진이다. 중간 결과를 메모리에 유지할 수 있어 같은 데이터를 반복해서 쓰는 계산(반복 알고리즘, 대화형 분석)에서 디스크 중심 MapReduce 보다 유리하다.
- 구조적 데이터에는 DataFrame/SQL 을, 요소 단위로 직접 제어하려면 RDD 를 쓴다. 어느 쪽을 권장하는지에 대한 공식 문장은 확인하지 않았다.
- 버전: 2026-11-23 확인 시 다운로드 페이지의 최신은 Spark 4.3.0(2026-10-30). 4.2.1·4.1.4 는 이전 라인의 패치 릴리스(다운로드 페이지 기준. 4.0.5 는 spark.apache.org/news 에서만 확인). Spark 4 는 Scala 2.13 으로 빌드되며 2.12 지원은 중단됐다.

## 시험 범위 대응

- ADP 필기 "데이터 처리 기술 이해 > 분산 컴퓨팅 기술"과 관련. 빅데이터분석기사 "빅데이터 플랫폼"과 관련. ADsP 에는 직접 항목 없음. 이 노트의 Spark 내용이 시험에 얼마나 나오는지는 미확인.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 탄력적 분산 데이터셋 | RDD | 클러스터 노드에 분할된 요소의 내결함성 컬렉션. 병렬 연산 대상이며 유도 과정(lineage)을 기억해 유실 파티션을 재계산한다 |
| 데이터프레임 | DataFrame | 이름 붙은 열로 구성된 Dataset. 관계형 테이블·R/Python 데이터프레임과 개념이 같고 더 풍부한 최적화가 붙는다 |
| 데이터셋 | Dataset | 강한 타입과 람다 함수의 이점에 Spark SQL 최적화 실행 엔진을 결합한 분산 컬렉션 (Spark 1.6 도입) |
| 변환 | Transformation | 기존 RDD 로 새 RDD 를 만드는 연산. 지연 실행(lazy) |
| 액션 | Action | 결과를 드라이버로 돌려주거나 출력을 써 변환들을 실제 실행시키는 연산 |
| 셔플 | Shuffle | 여러 파티션의 데이터를 모으는 전체 대 전체 교환. 디스크 I/O·직렬화·네트워크로 비싸다 |
| 좁은/넓은 의존성 | Narrow/Wide dependency | 부모 파티션이 자식 파티션 최대 하나에 쓰이면 좁은 의존성, 여러 자식이 의존하면 넓은 의존성 (논문 용어) |
| 계보 | Lineage | RDD 가 다른 데이터셋에서 어떻게 만들어졌는지의 기록 |

## RDD·DataFrame·Dataset 구분

| 항목 | RDD | DataFrame | Dataset |
| --- | --- | --- | --- |
| 데이터 모습 | 요소의 분산 컬렉션 | 이름 붙은 열(스키마) | 타입 있는 객체 컬렉션 |
| 최적화 | 사용자가 흐름을 직접 지정 | Spark SQL 의 최적화 엔진 사용 | 같은 엔진 사용 |
| 사용 가능 언어 | (RDD 가이드의 언어 목록은 미확인) | Python·Scala·Java·R | **Scala·Java 만** |

- Scala 에서 `DataFrame` 은 `Dataset[Row]` 의 타입 별칭이고, Java 에서는 `Dataset<Row>`, Python 에서는 DataFrame 이 구조적 API 의 중심이다(Dataset 타입 없음).
- SQL·DataFrame·Dataset 중 무엇을 쓰든 같은 실행 엔진을 쓴다고 문서가 설명한다.
- "RDD 는 타입 안전, DataFrame 은 최적화" 식의 표 암기는 언어(Python 은 Dataset 이 없음)와 버전에 따라 달라지므로 위 문서 서술로만 정리했다.

## 지연 실행·DAG·캐싱

- 변환(map, filter, flatMap, union, reduceByKey, join 등)은 기록만 하고 계산하지 않는다. 액션(reduce, collect, count, first, take, saveAsTextFile 등)이 호출될 때 실행된다.
- 전체 계산을 한꺼번에 볼 수 있어 불필요한 중간 결과 생성을 피할 수 있다(문서 예: 매핑 결과가 reduce 로만 쓰이면 중간 데이터셋을 만들지 않음).
- 논문: 액션이 실행되면 스케줄러가 RDD 계보를 보고 **단계(stage)의 DAG** 를 만든다. 좁은 의존성 변환은 한 단계 안에서 파이프라인으로 처리하고, 단계의 경계는 넓은 의존성이 요구하는 셔플(또는 이미 계산된 파티션)이다.
- 기본적으로 액션마다 RDD 를 다시 계산할 수 있다. `persist()`/`cache()` 로 파티션을 메모리·디스크에 둘 수 있고 기본 저장 수준은 `MEMORY_ONLY`. 오래된 파티션은 LRU 방식으로 쫓겨나며 `unpersist()` 로 직접 해제한다.
- 셔플을 일으키는 연산 예: `repartition`, `coalesce`, `groupByKey`, `reduceByKey`, `join`, `cogroup`.

## MapReduce 와의 비교

| 관점 | Hadoop MapReduce | Spark |
| --- | --- | --- |
| 프로그래밍 단위 | map·reduce 두 함수(필요 시 combine) | 변환·액션의 연쇄(다단계 DAG) |
| 단계 사이 | 맵 출력을 로컬에 쓰고 셔플로 리듀서가 가져옴 | 캐시하면 메모리에 보관해 재사용 가능 |
| 반복·대화형 | 반복마다 새 잡 | 데이터 재사용을 겨냥한 설계 |
| 내결함성 | 태스크 재실행(프레임워크가 처리) | 계보로 유실 파티션만 재계산 |
| 자원 관리 | YARN | YARN 등 외부 클러스터 매니저(여기서는 세부 미확인) |

- 논문(NSDI 2012) 기준의 동기: MapReduce 같은 기존 프레임워크는 분산 메모리를 활용하는 추상화가 없어, 중간 결과를 여러 계산에서 재사용하는 반복 알고리즘(PageRank, K-means, 로지스틱 회귀)과 대화형 데이터 마이닝에 비효율적이다.
- 논문이 보고한 수치: 반복 응용에서 하둡보다 최대 20배 빠름, 실제 분석 리포트 40배 가속, 1 TB 데이터 대화형 스캔 5~7초 지연. **2012 년 논문의 실험 결과**이며 현재 버전·하드웨어의 성능을 대표하지 않는다.
- 논문이 밝힌 한계: RDD 는 같은 연산을 데이터셋 전체에 적용하는 배치 응용에 맞고, 공유 상태에 대한 비동기·세밀한 갱신(웹 앱 저장소, 증분 크롤러 등)에는 맞지 않는다. 그런 용도는 DB 같은 시스템이 낫다고 한다.
- 메모리가 부족하면 RDD 는 파티션을 디스크에 두어 기존 데이터 병렬 시스템과 비슷한 성능으로 점진 저하된다(스캔형 연산 한정, 논문 서술).
- "Spark 가 항상 10~100배 빠르다" 같은 일반화는 위 논문 수치로 뒷받침되지 않는다. 작업 특성(반복 여부, 메모리 여유)에 달렸다.

## 직접 계산

없음. Spark 는 설치돼 있지 않아 코드를 실행하지 않았다. 아래는 문서의 구조를 따른 PySpark 스타일 예시로, 지연 실행의 위치를 보이려는 설명용이다(실행 안 함).

```python
lines = sc.textFile("data.txt")                 # 기본 RDD, 아직 읽지 않음
lengths = lines.map(lambda s: len(s))           # 변환(지연)
total = lengths.reduce(lambda a, b: a + b)      # 액션 → 여기서 실행
```

## 언제 쓰나 / 주의

- 반복 계산(머신러닝), 대화형 분석, SQL·DataFrame 기반 대용량 변환(ELT)에 쓴다 → [ETL·ELT](/develop-wiki/knowledge/data-analytics/etl-elt-cdc-eai-integration/).
- 저장 계층은 HDFS·객체 저장소 등을 따로 둔다 → [Hadoop](/develop-wiki/knowledge/data-analytics/hadoop-hdfs-mapreduce-yarn/), [레이크하우스](/develop-wiki/knowledge/data-analytics/data-warehouse-data-mart-lake-lakehouse/).
- 셔플이 많은 잡은 비싸다. 넓은 의존성 연산 수를 줄이고 캐시는 재사용되는 데이터에만 쓴다.
- 캐시한 데이터가 메모리를 넘으면 쫓겨나 재계산된다. 메모리 크기를 가정하고 설계하지 않는다.
- 실시간 저지연 서비스 저장소로는 맞지 않는다(위 논문 한계).

## 검증 범위

- 읽은 것: RDD 프로그래밍 가이드(latest), SQL 가이드(latest, Dataset·DataFrame 절), 다운로드 페이지, Zaharia 외 NSDI 2012 논문 본문(PDF 텍스트 추출: 초록, §2.4, 의존성·스케줄러 절, 서문의 성능 수치).
- 미확인: 논문 표의 개별 벤치마크 값, Spark 4.x 의 Catalyst·Tungsten 최적화 내부, 구조적 스트리밍, Spark 의 YARN 외 배포 방식, 최신 문서의 RDD 권장 여부 문장. RDD·SQL 가이드의 "latest" 는 팩트체크에서 둘 다 "Spark 4.3.0 Documentation" 으로 확인됐다.
- 실행: 없음.
