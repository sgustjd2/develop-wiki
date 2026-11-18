---
name: Apache Flink
url: https://flink.apache.org
docs: https://nightlies.apache.org/flink/flink-docs-stable/
repo: https://github.com/apache/flink
stars: 26480
domain: data-ml
category: processing
description: 상태를 가진 스트림 처리 엔진. 이벤트 시간·정확히 한 번 처리를 보장해 실시간 집계, 이상 탐지, CDC 파이프라인에 쓴다.
pricing: oss
tags: [stream-processing, real-time, stateful, cdc, kafka, sql]
languages: [java, python, sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Apache Flink 는 끝없는 이벤트 스트림을 낮은 지연으로 처리하는 분산 엔진이다. 연산자마다 상태(state)를 두고 주기적 체크포인트로 장애 시 정확히 한 번(exactly-once) 결과를 보장한다. 이벤트 시간과 워터마크로 늦게 도착한 데이터도 윈도 집계에 반영한다. 배치는 "끝이 있는 스트림"으로 같은 엔진에서 처리한다.

**버전(2026-11 기준):** 2.3.0(PyPI `apache-flink` 2026-06-21). 2.x 계열에서 오래된 DataSet API 와 Scala API 가 제거돼 DataStream·Table/SQL API 가 기본이다. 라이선스 Apache-2.0.

[Apache Spark](/develop-wiki/data-ml/processing/apache-spark/) Structured Streaming 은 마이크로배치 중심이고, Flink 는 레코드 단위 처리와 세밀한 상태·타이머 제어가 강점이다.

## 설치
```bash
pip install apache-flink          # PyFlink (로컬 미니 클러스터 포함, JDK 필요)
```
클러스터는 공식 배포판의 `bin/start-cluster.sh`(웹 UI 기본 8081 포트), Kubernetes Operator, 관리형 서비스로 운영한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| DataStream API | 연산자·상태·타이머를 직접 다루는 저수준 API (Java, Python) |
| Table API / Flink SQL | 스트림을 동적 테이블로 보고 SQL 로 질의 |
| 상태(State) | 키별 값·리스트·맵. RocksDB 등 상태 백엔드에 저장 |
| 체크포인트 / 세이브포인트 | 자동 장애 복구 스냅샷 / 수동 버전 업그레이드용 스냅샷 |
| 이벤트 시간·워터마크 | 이벤트 발생 시각 기준 처리, 지연 허용 한계 표시 |
| 윈도 | 텀블링·슬라이딩·세션 윈도 |
| 커넥터 | Kafka, 파일, JDBC, CDC 등 소스·싱크 |

## 기본 사용법
PyFlink Table API 로 스트리밍 집계:

```python
from pyflink.table import EnvironmentSettings, TableEnvironment

t_env = TableEnvironment.create(EnvironmentSettings.in_streaming_mode())

t_env.execute_sql("""
CREATE TABLE clicks (
  user_id STRING, url STRING, ts TIMESTAMP(3),
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH ('connector' = 'datagen', 'rows-per-second' = '5',
        'fields.user_id.length' = '1')
""")

t_env.execute_sql("""
SELECT user_id, window_start, COUNT(*) AS cnt
FROM TABLE(TUMBLE(TABLE clicks, DESCRIPTOR(ts), INTERVAL '10' SECOND))
GROUP BY user_id, window_start, window_end
""").print()
```

## 자주 쓰는 패턴
- **Kafka → 집계 → 싱크**: Kafka 커넥터 테이블을 만들고 `INSERT INTO sink SELECT ...` 로 상시 실행 잡을 띄운다.
- **CDC 파이프라인**: DB 변경 로그(Flink CDC)를 읽어 레이크하우스 테이블이나 검색 인덱스로 동기화.
- **세이브포인트로 배포**: 잡 업그레이드 전 세이브포인트를 찍고 새 버전을 거기서 재시작한다.
- **상태 TTL**: 키가 무한히 늘어나는 조인·집계는 state TTL 로 상태 크기를 제한한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 초~밀리초 지연의 실시간 집계·알림, 이벤트 시간 윈도, 상태가 큰 스트림 조인, CDC 동기화.
- 피할 때(대안): 하루 한 번 배치 ETL 이 주 용도면 [Apache Spark](/develop-wiki/data-ml/processing/apache-spark/)나 SQL 변환 도구([dbt](/develop-wiki/data-ml/transform/dbt/))가 운영이 단순하다. 단일 머신 분석은 [Polars](/develop-wiki/data-ml/processing/polars/).

## 공식 문서
- [문서 홈(stable)](https://nightlies.apache.org/flink/flink-docs-stable/) · [Flink SQL](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/table/sql/overview/) · [PyFlink](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/python/overview/)
- [DataStream API](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/overview/) · [체크포인트](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpoints/)
