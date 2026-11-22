---
title: NoSQL 4유형과 CAP·BASE
aka: [NoSQL, Key-Value, Document, Wide-Column, Column Family, Graph, CAP Theorem, BASE, ACID]
category: data-analytics
group: platform
level: intermediate
summary: NoSQL 4유형(키-값·문서·컬럼 패밀리·그래프)과 대표 제품을 구분하고, CAP 정리의 일관성·가용성·분할 내성이 증명 논문에서 갖는 엄밀한 뜻, BASE 와 ACID 의 대비를 정리한다.
tags: [nosql, cap, base, acid, key-value, document-store, wide-column, graph-database, consistency]
related: [distributed-systems/cap-pacelc, distributed-systems/consistency-models, distributed-systems/replication-quorum, data-modeling/transaction-isolation, data-modeling/sharding-partitioning, data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume, data-analytics/dikw-data-types-database-basics, data-analytics/big-data-characteristics-value-risks, data-analytics/exam-map-adsp-adp-bigdata-analyst]
sources:
  - https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf
  - https://people.eecs.berkeley.edu/~brewer/cs262b-2004/PODC-keynote.pdf
  - https://sites.cs.ucsb.edu/~rich/class/cs293b-cloud/papers/brewer-cap.pdf
  - https://redis.io/docs/latest/develop/data-types/
  - https://www.mongodb.com/docs/manual/core/data-modeling-introduction/
  - https://cassandra.apache.org/_/cassandra-basics.html
  - https://neo4j.com/docs/getting-started/get-started-with-neo4j/graph-database/
  - https://hbase.apache.org/
updatedAt: 2026-11-23
---

## 개요

- NoSQL 은 관계형 모델·SQL 이 아닌 데이터 모델을 쓰는 저장소를 넓게 가리키는 말이다. 하나의 표준 정의가 있는 것이 아니라 키-값·문서·컬럼 패밀리·그래프 같은 모델이 묶여 불린다.
- 대량·다양한 데이터를 여러 서버에 나눠 담을 때 일관성과 가용성 사이의 선택이 생기며, 이를 설명하는 틀이 CAP 정리다. BASE 는 가용성을 우선하는 쪽의 설계 성향을 ACID 와 대비해 부른 이름이다.
- CAP 은 "세 개 중 둘을 고른다"는 구호로 자주 쓰이지만, 원 증명의 정의는 훨씬 좁고 엄밀하다. 이 노트는 그 정의를 우선한다.

## 시험 범위 대응

- ADP 필기 "데이터 처리 기술 이해 > 분산 데이터 저장 기술"과 관련(NoSQL·CAP·BASE 가 어느 항목에 속하는지는 공식 범위에 명시가 없어 미확인). 빅데이터분석기사 1과목 "빅데이터 플랫폼"과 관련. ADsP "데이터베이스의 정의와 특징"과 간접 관련.
- 분산 시스템 관점의 자세한 설명은 [CAP 와 PACELC](/develop-wiki/knowledge/distributed-systems/cap-pacelc/), [일관성 모델](/develop-wiki/knowledge/distributed-systems/consistency-models/)에 있어 여기서는 반복하지 않는다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 일관성(CAP 의 C) | Atomic / linearizable consistency | 모든 연산이 한순간에 끝난 것처럼 보이는 전체 순서가 존재한다. 쓰기가 끝난 뒤 시작된 읽기는 그 값이나 더 나중 쓰기의 값을 돌려준다 |
| 가용성(CAP 의 A) | Availability | 실패하지 않은 노드가 받은 모든 요청이 결국 응답을 받는다(응답 시간 상한은 없음) |
| 분할 내성(CAP 의 P) | Partition tolerance | 네트워크가 노드 사이 메시지를 임의로 많이 잃어도 시스템이 요구 성질을 유지해야 한다 |
| ACID | Atomic, Consistent, Isolated, Durable | 트랜잭션의 원자성·일관성·격리성·지속성 |
| BASE | Basically Available, Soft-state, Eventual consistency | 가용성을 우선하고 상태가 한동안 일시적일 수 있으며 결국 일관해지는 설계 성향 |

## NoSQL 4유형

| 유형 | 데이터 모델(공식 문서 서술) | 대표 제품 |
| --- | --- | --- |
| 키-값 | 키로 값을 조회. Redis 는 자신을 "데이터 구조 서버"로 소개하며 문자열·해시·리스트·집합·정렬 집합·스트림 등 자료형을 제공 | Redis |
| 문서 | 문서(BSON)를 컬렉션에 보관. 같은 컬렉션의 문서끼리 필드가 달라도 되고, 함께 접근하는 데이터는 함께 저장(임베딩)하라고 권한다 | MongoDB |
| 컬럼 패밀리(와이드 컬럼) | HBase 는 구글 Bigtable 을 본뜬 분산 저장소. Cassandra 는 파티션 키를 해시해 노드에 분산하는 마스터 없는 구조 | HBase, Cassandra |
| 그래프 | 노드·방향 있는 관계(타입 하나)·속성·레이블의 프로퍼티 그래프 | Neo4j |

- "컬럼 패밀리/와이드 컬럼"이라는 분류명은 관용이다. 읽은 Cassandra 페이지는 이 용어 대신 "분산 비관계형, 파티션 지향"이라고 서술한다.
- 대표 제품은 해당 공식 페이지에서 자기 모델을 확인한 것에 한정했다. 제품이 여러 모델을 함께 지원하는 경우(예: Redis 의 JSON 자료형)가 있어 "한 제품 = 한 유형"은 단순화다.
- 유형별 용도 서술(캐시·카탈로그·소셜 그래프 등)은 필자의 일반 설명이다.

## CAP 정리의 엄밀한 뜻

출처의 계보를 구분한다.

- **Brewer 2000**: PODC 2000 기조연설(2000-07-19)에서 일관성·가용성·분할 내성의 세 성질 중 최대 두 가지만 가질 수 있다는 "CAP Theorem" 으로 제시됐다(Gilbert & Lynch 가 이를 Brewer 의 추측(conjecture)이라 부르며 증명했다). 슬라이드에는 "ACID 대 BASE", "CAP Theorem" 항목이 있다.
- **Gilbert & Lynch 2002**: 위 추측을 비동기 네트워크 모델에서 증명한 논문(ACM SIGACT News). 아래 정의는 이 논문에서 확인했다.

| 성질 | 증명 논문의 정의(의역) |
| --- | --- |
| 일관성 | 원자적(= 선형화 가능). 모든 연산에 대해 각각이 한순간에 완료된 것처럼 보이는 전체 순서가 존재. 단일 노드가 연산을 한 번에 하나씩 처리하는 것과 동등 |
| 가용성 | 실패하지 않은 노드가 받은 모든 요청은 응답을 받아야 한다. 알고리즘은 결국 종료해야 하며 걸리는 시간의 상한은 없다 |
| 분할 내성 | 네트워크는 한 노드에서 다른 노드로 보낸 메시지를 임의로 많이 잃을 수 있다. 분할되면 서로 다른 구성 요소 사이의 메시지가 전부 사라진다 |

- 정리(Theorem 1): 비동기 네트워크 모델에서 메시지가 유실되는 실행까지 포함해, 가용성과 원자적 일관성을 동시에 보장하는 읽기/쓰기 객체는 구현할 수 없다.
- 증명 아이디어: 노드를 두 집합 G1, G2 로 나누고 둘 사이 메시지를 모두 잃게 한다. G1 에 쓰기, 이후 G2 에서 읽기를 보내면 가용성 때문에 G2 는 응답해야 하고, 그 응답은 새 값을 알 수 없어 일관성을 깬다.
- 같은 논문의 각주: 원자적 일관성은 ACID 의 C 와 다르다. DB 일관성은 트랜잭션에 대한 것이고, 원자적 일관성은 단일 요청/응답 열의 성질이며, ACID 의 A(원자성)와 C(일관성)를 모두 포괄한다고 설명한다. 또 Brewer 는 원래 "거의 모든 요청"에 응답을 요구했으나 증명에서는 단순화해 100% 로 둔다.

## 흔한 오해

| 오해 | 정리 |
| --- | --- |
| "C·A·P 중 아무 둘을 골라 제품을 분류한다" | 분할은 네트워크가 만드는 사건이다. 분할이 일어난 동안 일관성과 가용성 중 무엇을 양보하느냐의 문제다 |
| "CA 시스템이 존재한다" | 분할을 포기한다는 말의 뜻이 불분명하다고 Brewer 2012 가 지적한다. 단일 노드는 분할 문제가 없을 뿐이다 |
| CAP 의 C = ACID 의 C | 서로 다른 개념(위 각주) |
| "NoSQL = 일관성 없음" | Cassandra 문서는 기본이 AP 지향이지만 질의별로 일관성 수준을 조정할 수 있다고 한다(tunable). 제품별 설정으로 달라진다 |

- Brewer 2012("CAP Twelve Years Later", IEEE Computer): "2 of 3" 표현은 오해를 부른다. 분할은 드물어 평상시에는 C 와 A 를 둘 다 줄 이유가 적고, 분할 중·복구 후의 전략이 설계 대상이라고 정리한다. 이 논문은 NoSQL 운동을 가용성 우선·일관성 차선의 선택지를 만드는 흐름으로도 서술한다.
- 분할이 없는 평상시의 지연 대 일관성 트레이드오프까지 다루는 확장은 [PACELC](/develop-wiki/knowledge/distributed-systems/cap-pacelc/).

## BASE 와 ACID

- BASE 는 Brewer 2000 슬라이드에서 "Basically Available, Soft-state, Eventual consistency"로 펼쳐지고, ACID 의 강한 일관성·격리와 대비되는 "약한 일관성, 오래된 데이터 허용, 가용성 중심"으로 서술된다(슬라이드 텍스트 추출 기준).
- Pritchett, "BASE: An Acid Alternative"(ACM Queue 6(3), 2008, queue.acm.org/detail.cfm?id=1394128)는 파티션된 DB 에서 일관성을 일부 양보해 확장성을 얻는 방안을 논한다. 이 노트는 본문에 접근하지 못했다(서버가 자동 접근을 차단). 검색 결과의 초록·발췌 수준에서만 확인했으므로 세부 주장은 옮기지 않았다.

| 관점 | ACID | BASE |
| --- | --- | --- |
| 초점 | 트랜잭션 끝마다 일관성 | 부분 장애에도 서비스 지속 |
| 일관성 | 강함 | 결국 일관(그 사이 오래된 값 가능) |
| 대표 환경 | 단일 DB·관계형 | 분산·복제 저장소 |
| 사용자 영향 | 애플리케이션 단순 | 애플리케이션이 불일치·중복을 다뤄야 함 |

- 마지막 행은 필자의 일반 서술이다. 중복·불일치를 다루는 설계는 [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/), 격리 수준은 [트랜잭션 격리](/develop-wiki/knowledge/data-modeling/transaction-isolation/).

## 언제 쓰나 / 주의

- 데이터 모델이 관계형으로 맞지 않거나(문서·그래프), 수평 확장·가용성이 최우선일 때 NoSQL 을 고려한다.
- 다중 행 트랜잭션·복잡한 조인·임의 질의가 핵심이면 관계형이 낫다. 복제본이 많을수록 읽기 일관성 수준 설정이 중요하다 → [복제·쿼럼](/develop-wiki/knowledge/distributed-systems/replication-quorum/).
- 제품을 "CP/AP"로 한 단어로 분류하는 말은 설정·연산에 따라 달라지므로 주의한다. 같은 제품도 질의별 수준이 다를 수 있다.
- 분산 방식은 [샤딩·파티셔닝](/develop-wiki/knowledge/data-modeling/sharding-partitioning/), 하둡 생태계의 HBase 는 [생태계 노트](/develop-wiki/knowledge/data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume/).

## 검증 범위

- 읽은 것: Gilbert & Lynch(2002) 6쪽 본문(§1~3 정의·Theorem 1·각주), Brewer PODC 2000 슬라이드 텍스트(ACID/BASE·CAP 항목), Brewer 2012 본문 앞부분(도입·"Why 2 of 3 is misleading"), Redis 자료형 페이지, MongoDB 데이터 모델링 소개, Cassandra 기초 페이지, Neo4j 그래프 DB 페이지, HBase 메인 페이지.
- 미확인: Pritchett 2008 본문(접근 차단), Brewer 슬라이드의 CAP 도식 세부, Gilbert-Lynch 부분 동기 모델·확장 결과, 제품별 CAP 위치, "컬럼 패밀리" 분류의 1차 출처, ADP 공식 범위에서 NoSQL 항목 위치.
- 실행: 없음(개념 정리).
