---
name: Metabase
url: https://www.metabase.com
docs: https://www.metabase.com/docs/latest/
repo: https://github.com/metabase/metabase
stars: 50489
domain: data-ml
category: analytics-bi
description: 비개발자도 질문 빌더로 데이터를 조회하고 대시보드를 만드는 BI 도구. 사내 지표 공유와 간단한 셀프서비스 분석에 쓴다.
pricing: oss
tags: [bi, dashboard, self-service, sql, embedding]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Metabase 는 데이터베이스에 연결한 뒤 "질문(Question)" 단위로 데이터를 조회하는 BI 도구다. 쿼리 빌더에서 테이블·필터·요약을 클릭으로 고르면 SQL 없이 표와 차트가 나오고, 필요하면 네이티브 SQL 편집기도 쓸 수 있다. 질문을 대시보드에 모아 공유·구독(이메일/Slack)하고, 앱에 임베딩할 수 있다.

**버전·라이선스(2026-11 기준):** OSS 0.65.4(2026-11-13). 오픈소스판은 **AGPL-3.0**, 저장소의 `enterprise/` 디렉터리와 Enterprise 바이너리는 Metabase 상용 라이선스다. 내부 사용은 OSS 로 충분하지만, 수정본을 네트워크 서비스로 제공하는 경우 AGPL 조건을 검토해야 한다. 서버는 Clojure(JVM) 애플리케이션이다.

## 설치
```bash
docker run -d -p 3000:3000 --name metabase metabase/metabase
# http://localhost:3000 에서 관리자 계정 생성 후 DB 연결
```
JAR 로도 실행할 수 있다(`java -jar metabase.jar`, Java 필요). 운영에서는 내부 메타데이터 저장소를 기본 H2 대신 PostgreSQL·MySQL 로 지정한다(`MB_DB_TYPE`, `MB_DB_CONNECTION_URI` 등 환경 변수).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Question | 저장된 조회 하나. 쿼리 빌더 또는 SQL |
| Dashboard | 질문 카드 배치 + 필터 위젯 |
| Collection | 질문·대시보드를 담는 폴더, 권한 단위 |
| Model | 정리된 데이터셋을 정의해 다른 질문의 출발점으로 사용 |
| Metric | 재사용 가능한 공식 지표 정의 |
| SQL 변수 | `{{variable}}` 로 SQL 질문에 필터 입력 연결 |
| 구독·알림 | 대시보드 정기 발송, 조건 기반 알림 |
| 임베딩 | 공개 링크, 정적(서명) 임베딩, 상용판의 인터랙티브 임베딩 |

## 기본 사용법
SQL 질문에 필터 변수를 연결하는 예:
```sql
SELECT date_trunc('day', created_at) AS day, SUM(amount) AS revenue
FROM orders
WHERE created_at >= {{start_date}}
  [[AND region = {{region}}]]      -- 대괄호: 값이 없으면 조건 생략
GROUP BY 1
ORDER BY 1
```
변수 유형을 Date / Text 로 지정하면 대시보드 필터와 연결할 수 있다.

## 자주 쓰는 패턴
- **Model 로 정리**: 원천 테이블을 바로 노출하지 말고 이름·설명을 정리한 Model 을 만들어 비개발자가 그 위에서 질문하게 한다.
- **마트 테이블 사용**: [dbt](/develop-wiki/data-ml/transform/dbt/) 로 만든 집계 테이블을 연결해 대시보드 질의를 가볍게.
- **읽기 전용 계정**: DB 연결에는 읽기 전용 사용자와 레플리카를 쓴다.
- **환경 변수 설정**: Docker 운영 시 `MB_` 접두 환경 변수로 설정을 코드화.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 을 모르는 구성원까지 데이터를 직접 조회해야 할 때, 빠르게 설치해 쓰는 소규모·중규모 팀 BI.
- 피할 때(대안): 차트 유형·세밀한 권한·Apache-2.0 라이선스가 필요하면 [Apache Superset](/develop-wiki/data-ml/analytics-bi/apache-superset/). Python 로직이 들어간 앱은 [Streamlit](/develop-wiki/data-ml/analytics-bi/streamlit/).

## 공식 문서
- [문서 홈](https://www.metabase.com/docs/latest/) · [Docker 설치](https://www.metabase.com/docs/latest/installation-and-operation/running-metabase-on-docker) · [SQL 변수](https://www.metabase.com/docs/latest/questions/native-editor/sql-parameters)
- [라이선스](https://www.metabase.com/license) · [릴리스](https://github.com/metabase/metabase/releases)
