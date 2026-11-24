---
name: Apache Superset
url: https://superset.apache.org
docs: https://superset.apache.org/docs/intro
repo: https://github.com/apache/superset
stars: 75654
domain: data-ml
category: analytics-bi
description: SQL 데이터베이스에 연결해 차트·대시보드를 만들고 SQL Lab 으로 질의하는 오픈소스 BI 플랫폼. 셀프 호스팅 사내 대시보드에 쓴다.
pricing: oss
tags: [bi, dashboard, visualization, sql, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Apache Superset 은 웹 기반 데이터 탐색·시각화 도구다. SQLAlchemy 를 지원하는 거의 모든 SQL 데이터베이스(PostgreSQL, Trino, BigQuery, Snowflake, ClickHouse, DuckDB 등)에 연결해, 코드 없이 차트를 만들거나 SQL Lab 에서 직접 질의한 결과를 시각화하고 대시보드로 묶는다. 데이터는 원천 DB 에 두고 질의만 보내며, 행 수준 보안과 역할 기반 권한을 제공한다.

**버전(2026-11 기준):** 6.1.0(PyPI 2026-05-13, Git 태그 `6.1.0`). Python(Flask) 백엔드 + React 프론트엔드. 라이선스 Apache-2.0. 관리형은 Preset 등이 있다.

## 설치
공식 Quickstart(Docker Compose):
```bash
git clone https://github.com/apache/superset
cd superset
git checkout tags/6.1.0
docker compose -f docker-compose-image-tag.yml up
```
`http://localhost:8088` 에 `admin` / `admin` 으로 로그인(로컬 체험용 기본 계정). 운영은 공식 Helm 차트로 Kubernetes 에 배포하고 `SECRET_KEY` 등 설정을 바꾼다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Database | 연결 정보(SQLAlchemy URI). 드라이버 패키지가 필요 |
| Dataset | 차트의 원천이 되는 테이블 또는 SQL 질의(가상 데이터셋), 지표·계산 열 정의 |
| Chart | 시각화 하나. Explore 화면에서 차원·지표·필터 선택 |
| Dashboard | 차트를 배치하고 네이티브 필터·교차 필터로 연결 |
| SQL Lab | 브라우저 SQL 편집기. 결과를 데이터셋으로 저장 가능 |
| Semantic layer(지표) | 데이터셋에 저장한 공용 지표 정의 |
| RLS / 역할 | 행 수준 보안 규칙, 권한 묶음 |
| 캐시·비동기 질의 | Redis 캐시, Celery 워커로 긴 질의 처리 |

## 기본 사용법
1. Settings → Database Connections 에서 DB 추가. 예: `postgresql://user:pass@host:5432/shop`, `trino://user@trino:8080/iceberg`.
2. Datasets 에서 테이블을 데이터셋으로 등록하고 지표를 정의:
   ```sql
   -- 데이터셋 지표 예
   SUM(amount)
   COUNT(DISTINCT customer_id)
   ```
3. Charts → 새 차트에서 데이터셋과 차트 유형(시계열, 막대, 피벗 테이블 등)을 고르고 저장.
4. Dashboards 에 차트를 배치하고 날짜·카테고리 네이티브 필터를 추가.

SQL Lab 에서 임시 분석:
```sql
SELECT date_trunc('week', created_at) AS week, region, SUM(amount) AS revenue
FROM orders
GROUP BY 1, 2
ORDER BY 1;
```

## 자주 쓰는 패턴
- **질의층과 분리**: 대용량은 [Trino](/develop-wiki/data-ml/warehouse-lake/trino/)·[ClickHouse](/develop-wiki/backend/database/clickhouse/)·웨어하우스에 맡기고 Superset 은 시각화만.
- **집계 테이블 준비**: [dbt](/develop-wiki/data-ml/transform/dbt/) 로 대시보드용 마트 테이블을 미리 만들어 질의 비용과 지연을 줄인다.
- **설정 코드화**: `superset_config.py` 와 대시보드 내보내기/가져오기(YAML)로 환경 간 이동.
- **임베딩**: 게스트 토큰 기반 임베디드 SDK 로 사내 앱에 대시보드를 넣는다.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 을 아는 분석 팀의 셀프 호스팅 대시보드, 차트 종류·권한 제어가 많이 필요할 때, 라이선스 비용 없이 BI 를 운영할 때.
- 피할 때(대안): 비개발자가 질문 빌더로 빠르게 쓰려면 [Metabase](/develop-wiki/data-ml/analytics-bi/metabase/). Python 로직이 들어간 대화형 앱은 [Streamlit](/develop-wiki/data-ml/analytics-bi/streamlit/). 일회성 분석은 [Jupyter](/develop-wiki/data-ml/analytics-bi/jupyter/).

## 공식 문서
- [소개](https://superset.apache.org/docs/intro) · [Quickstart](https://superset.apache.org/docs/quickstart) · [저장소 docs 폴더](https://github.com/apache/superset/tree/master/docs)
- [릴리스·업데이트 노트](https://github.com/apache/superset/blob/master/UPDATING.md)
