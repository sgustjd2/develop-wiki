---
title: 정규화와 반정규화
aka: [Normalization, Denormalization, 정규형, Normal Form]
category: data-modeling
level: beginner
summary: 같은 사실을 한 곳에만 두도록 테이블을 나누는 정규화와, 읽기 성능을 위해 일부러 중복을 허용하는 반정규화의 기준과 비용.
tags: [rdbms, schema, normal-form, redundancy]
related: [data-modeling/index-design, data-modeling/n-plus-one, data-modeling/sharding-partitioning, architecture/cqrs, performance/caching-strategies]
sources:
  - https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/access/database-normalization-description
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding
updatedAt: 2026-11-18
---

정규화(normalization)는 E. F. Codd 가 관계형 모델을 제안하면서(1970년대) 정리한 설계 규칙이다. 목표는 두 가지다. **중복 제거**, 그리고 어떤 값이 엉뚱한 테이블에 붙어 있는 **어긋난 종속 제거**.

## 문제

한 테이블에 여러 사실을 섞어 두면 갱신 이상(anomaly)이 생긴다.

| 이상 | 예 (`주문(주문ID, 고객ID, 고객주소, 상품명, 단가)`) |
| --- | --- |
| 갱신 이상 | 고객 주소가 바뀌면 그 고객의 주문 행을 전부 고쳐야 하고, 하나라도 빠지면 값이 둘이 된다 |
| 삽입 이상 | 주문이 없는 고객은 주소를 저장할 곳이 없다 |
| 삭제 이상 | 고객의 마지막 주문을 지우면 고객 정보도 사라진다 |

## 해법 — 정규형 단계

| 정규형 | 규칙 (요지) | 위반 신호 |
| --- | --- | --- |
| 1NF | 칸 하나에 값 하나, 반복 그룹 없음, 각 행을 식별하는 키 | `vendor1`, `vendor2`, `vendor3` 같은 번호 붙은 칼럼, 쉼표로 이은 목록 |
| 2NF | 복합 키의 **일부**에만 종속된 칼럼 제거 | `(학생ID, 과목ID)` 키 테이블에 학생 이름이 있음 |
| 3NF | 키가 아닌 칼럼에 종속된 칼럼 제거(이행 종속) | 학생 테이블에 `지도교수`와 `지도교수_연구실`이 함께 있음 |
| BCNF | 모든 결정자가 후보 키 | 3NF 는 만족하지만 키가 아닌 칼럼이 키 일부를 결정 |

실무에서는 보통 **3NF(또는 BCNF)까지** 맞추고, 4NF·5NF(다치 종속·조인 종속)는 특수한 경우에만 따진다.

```sql
-- 3NF 위반: 지도교수 연구실은 학생이 아니라 교수에 종속
CREATE TABLE student (id int PRIMARY KEY, advisor text, advisor_room text);

-- 분리 후
CREATE TABLE faculty (name text PRIMARY KEY, room text);
CREATE TABLE student (id int PRIMARY KEY, advisor text REFERENCES faculty(name));
```

## 반정규화

정규화된 스키마는 쓰기에 강하고 읽기에는 조인이 늘어난다. 반정규화는 **읽기 경로를 위해 의도적으로 중복을 두는 것**이다.

| 기법 | 예 | 일관성 유지 방법 |
| --- | --- | --- |
| 파생 값 저장 | `order.total_amount`, `post.comment_count` | 같은 트랜잭션에서 갱신, 또는 트리거 |
| 칼럼 복제 | 주문에 주문 당시 배송지·상품명 스냅샷 | 사실 "그 시점 값"이므로 갱신 불필요 (이건 중복이 아니라 별개 사실) |
| 미리 조인한 읽기 모델 | 목록 화면용 테이블, 머티리얼라이즈드 뷰 | 배치 갱신, 이벤트로 투영([CQRS](/develop-wiki/knowledge/architecture/cqrs/)) |
| 샤드 안에 같이 두기 | 고객과 주문을 같은 샤드에 | 샤드 키 설계로 해결 |

```sql
-- 파생 값은 쓰기와 같은 트랜잭션에서 맞춘다
BEGIN;
INSERT INTO comment (post_id, body) VALUES ($1, $2);
UPDATE post SET comment_count = comment_count + 1 WHERE id = $1;
COMMIT;
```

## 언제 쓰나

- **정규화**: 기본값. OLTP, 쓰기가 잦은 데이터, 여러 기능이 같은 데이터를 공유할 때.
- **반정규화**: 측정해 보니 특정 읽기 쿼리의 조인·집계가 병목일 때, 분산 저장소라 조인이 비싸거나 불가능할 때, 보고·분석용 읽기 모델.

## 주의 (비용)

- 반정규화는 **쓰기 비용과 불일치 위험**을 산다. 갱신 경로가 하나라도 빠지면 값이 어긋난다. 갱신 책임을 한 곳(리포지토리, 트리거, 이벤트 핸들러)에 모은다.
- "주문 당시 가격"처럼 시점이 다른 값은 중복이 아니다. 정규화 위반으로 오해해 참조로 바꾸면 과거 주문 금액이 바뀌는 버그가 생긴다.
- 인덱스·캐시·머티리얼라이즈드 뷰로 해결되는 문제를 스키마 중복으로 풀지 않는다. 먼저 [인덱스](/develop-wiki/knowledge/data-modeling/index-design/)와 [N+1](/develop-wiki/knowledge/data-modeling/n-plus-one/)부터 본다.
- 과한 정규화도 비용이다. 도시·우편번호까지 모두 테이블로 쪼개면 조인만 늘고 얻는 게 적다. 자주 바뀌는 데이터 위주로 정규화한다.
- JSON 칼럼에 배열을 넣는 것은 1NF 를 벗어난다. 그 안의 값으로 검색·조인·제약을 걸어야 한다면 별도 테이블이 낫다.
