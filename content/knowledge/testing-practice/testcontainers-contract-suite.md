---
title: Testcontainers 로 실제 어댑터에 계약 스위트 돌리기
aka: [Testcontainers, Container-based Integration Test, Contract Suite on Real Database, 컨테이너 통합 테스트]
category: testing-practice
level: intermediate
summary: 테스트 코드에서 컨테이너로 진짜 DB 를 띄워, 페이크와 같은 계약 스위트를 실제 어댑터에도 실행하는 방법과, 컨테이너 수명·격리·대기 전략·CI 요건에서의 비용.
tags: [testing, testcontainers, integration-test, contract-test, docker, database, fake]
related: [testing-practice/fake-contract-tests, testing-practice/test-doubles, testing-practice/fake-vs-mock, testing-practice/test-pyramid-trophy, testing-practice/flaky-e2e-tests, architecture/hexagonal, design-patterns/repository-unit-of-work]
sources:
  - https://node.testcontainers.org/features/containers/
  - https://node.testcontainers.org/features/wait-strategies/
  - https://node.testcontainers.org/modules/postgresql/
  - https://node.testcontainers.org/supported-container-runtimes/
  - https://java.testcontainers.org/test_framework_integration/junit_5/
  - https://martinfowler.com/bliki/ContractTest.html
updatedAt: 2026-11-19
---

공유 스위트로 페이크와 실제 구현의 일치를 확인하는 원리는 [페이크 계약 테스트](/develop-wiki/knowledge/testing-practice/fake-contract-tests/)에 있다. 이 노트는 그 스위트의 **실제 어댑터 쪽을 어떻게 띄우고 정리하는가**, 곧 컨테이너 운영 부분만 다룬다.

## 문제

- 계약 스위트를 실제 DB 어댑터에 돌리려면 DB 가 필요하다. 팀 공용 개발 DB 를 쓰면 데이터가 섞이고, 로컬마다 설치 버전이 달라 "내 컴퓨터에서는 된다"가 생긴다.
- 인메모리 대체 DB(H2, SQLite 등)는 운영 DB 와 SQL 방언·제약·동시성 동작이 다르다. 그 위에서 통과한 계약은 운영 어댑터를 보증하지 않는다.
- 수동으로 `docker run` 하고 포트를 고정하면 병렬 실행·재실행 때 충돌하고, 끝나고 지우는 일을 아무도 책임지지 않는다.

## 해법

테스트 안에서 **컨테이너를 코드로 시작하고 끝낸다**. Testcontainers 는 컨테이너를 만들고, 호스트 포트를 임의의 빈 포트에 매핑하고, 준비될 때까지 기다린 뒤 접속 정보를 돌려준다. 자원 정리는 Ryuk 이라는 별도 정리 컨테이너가 맡는다고 공식 문서가 설명한다.

```ts
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';

let container: StartedPostgreSqlContainer; let pool: pg.Pool; let n = 0;
before(async () => {                       // 파일당 컨테이너 1개를 공유
  container = await new PostgreSqlContainer('postgres:16').start();
  pool = new pg.Pool({ connectionString: container.getConnectionUri() });
});
after(async () => { await pool.end(); await container.stop(); });

orderRepoContract('InMemory', async () => new InMemoryRepo());
orderRepoContract('Postgres(Testcontainers)', async () => {
  const schema = `t${++n}`;               // 테스트마다 새 스키마로 격리
  await pool.query(`CREATE SCHEMA ${schema}`);
  await pool.query(`CREATE TABLE ${schema}.orders (id text primary key, version int not null)`);
  return new PgRepo(pool, schema);
});
```

`orderRepoContract` 는 [페이크 계약 테스트](/develop-wiki/knowledge/testing-practice/fake-contract-tests/)의 공유 스위트다. 위 코드를 `node:test` 로 직접 실행해, 같은 3개 계약(저장 후 조회, 없는 id, 낮은 버전 충돌)이 인메모리와 실제 PostgreSQL 16 컨테이너 양쪽에서 통과하는 것(6개 테스트 모두 통과)을 확인했다. 이 환경에서 컨테이너 기동에는 약 4초가 걸렸다(이미지가 로컬에 있던 경우의 측정이며 환경에 따라 다르다).

### 결정할 것 네 가지

**1. 컨테이너 수명**

| 방식 | 의미 | 비용 |
| --- | --- | --- |
| 테스트마다 | 완전 격리 | 기동 시간이 테스트 수만큼 곱해짐 |
| 파일(클래스)마다 | Java JUnit 5 확장은 `static` 필드 컨테이너를 클래스의 첫 테스트 전에 시작해 마지막 뒤에 멈추고, 인스턴스 필드는 테스트마다 재시작 | 테스트 사이 데이터 격리를 직접 책임 |
| 전체 실행 1개(싱글턴) | JUnit 5 문서가 싱글턴 컨테이너 패턴도 가능하다고 안내 | 가장 빠르지만 격리·병렬 제어가 어려움 |

JUnit 5 확장 문서는 병렬 실행이 지원되지 않고 순차 실행에서만 검증됐다고 밝힌다. 병렬 테스트를 돌릴 때는 확인이 필요하다.

**2. 테스트 간 격리**: 컨테이너를 공유하면 데이터가 남는다.
- 테스트마다 새 스키마(위 코드) 또는 새 데이터베이스를 만든다.
- 트랜잭션을 열고 끝에 롤백한다. 단, 실제 어댑터가 트랜잭션 경계를 테스트하는 계약에는 맞지 않는다.
- PostgreSQL 모듈의 `snapshot()`/`restoreSnapshot()` 으로 상태를 되돌린다. 공식 문서는 호출 전에 열린 연결을 모두 닫아야 하고, 컨테이너의 데이터베이스 이름을 `postgres` 로 쓰면 안 된다고 경고한다.
- 위 방법은 계약 대상 어댑터의 요구(연결 풀, 다중 연결 동시성)와 충돌하지 않는지 따져 고른다.

**3. 준비 대기**: 컨테이너가 "시작됨"과 "받을 준비 됨"은 다르다. Node 문서의 기본 동작은 이미지나 설정에 헬스체크가 있으면 그것을 기다리고, 없으면 매핑된 포트가 열릴 때까지 최대 60초 기다린다. 로그 메시지, HTTP 응답, 셸 명령, 일회성 종료 같은 전략을 고르거나 조합할 수 있고 `withStartupTimeout` 으로 한도를 둔다. 포트가 열려도 DB 가 아직 연결을 안 받을 수 있으므로, 단순 포트 대기에 기대지 말고 DB 모듈이 쓰는 대기 방식이나 직접 정한 대기(로그·헬스체크)를 확인한다. `PostgreSqlContainer` 의 기본 대기 방식은 이 노트에서 확인하지 못했다.

**4. 이미지 고정**: `postgres:latest` 를 쓰면 계약이 어느 날 갑자기 깨진다. 운영과 같은 **메이저 버전 태그**를 쓰고 업그레이드는 운영 업그레이드와 함께 한다.

### 실행 환경

- Docker 호환 소켓이 필요하다. Docker 외에 Podman·Colima·Rancher Desktop 이 지원 목록에 있고, 각각 소켓 설정이 다르다. 접속은 `DOCKER_HOST` 로 한다.
- 일부 구성(macOS 의 rootless Podman)에서는 Ryuk 이 문제를 일으켜 `TESTCONTAINERS_RYUK_DISABLED=true` 로 끄라고 문서가 안내한다. 끄면 정리를 직접 책임져야 한다.
- 컨테이너 재사용(reuse)은 같은 설정의 실행 중 컨테이너를 다시 쓰게 해 로컬 반복을 빠르게 한다. 문서가 전역 설정으로 끄고 켤 수 있다고 안내한다. CI 에서는 깨끗한 환경이 목적이므로 쓰지 않는 편이 단순하다(이 판단은 설계 권고).

## 언제 쓰나

- 포트-어댑터 구조에서 **영속성·메시지 브로커 어댑터가 실제 제품과 같은 동작**을 하는지 검증해야 할 때. 특히 유니크 제약, 정렬, 낙관적 잠금, 트랜잭션 격리처럼 방언에 의존하는 동작.
- 페이크가 빠른 단위 테스트의 기반이고, 그 페이크를 신뢰할 근거가 필요할 때.

## 주의·비용

- **느리다.** 컨테이너 기동과 이미지 내려받기가 있다. 단위 테스트 단계에 섞지 말고 통합 단계로 분리한다. [테스트 피라미드](/develop-wiki/knowledge/testing-practice/test-pyramid-trophy/).
- CI 에 컨테이너 런타임과 이미지 레지스트리 접근이 필요하다. 사내망·격리 환경에서는 미러가 필요하다. 러너의 CPU·메모리가 작으면 기동이 불안정(flaky)해진다. [불안정한 E2E](/develop-wiki/knowledge/testing-practice/flaky-e2e-tests/)에서 다룬 원인과 대응이 같이 적용된다.
- 컨테이너 DB 는 운영과 **같은 제품이어도 같은 환경은 아니다**. 확장·설정·권한·네트워크 지연이 다르다. 성능·부하는 이 계약의 범위가 아니다.
- 고정 호스트 포트는 피하라는 것이 공식 문서의 안내다. 병렬·재실행 시 충돌한다.
- 계약 스위트가 부실하면 컨테이너를 띄워도 신뢰만 늘고 보증은 늘지 않는다. 스위트에 실패 방식과 경계 조건을 넣는다.
- 외부 SaaS(결제 등)는 컨테이너로 대체할 수 없다. 그쪽은 [계약 테스트](/develop-wiki/knowledge/testing-practice/contract-testing/) 방식을 따른다.

> 출처 확인 범위: Testcontainers for Node.js 의 컨테이너·대기 전략·PostgreSQL 모듈·지원 런타임 페이지와, Java JUnit 5 통합 페이지를 읽었다. 미확인: Ryuk 의 내부 동작 문서(Java 문서 페이지에서는 언급이 없었음), Java 쪽 대기 전략·재사용 세부, CI 서비스별 설정(GitHub Actions·GitLab 등)의 공식 안내. 본문 코드는 Node 24, `testcontainers`·`@testcontainers/postgresql`·`pg` 패키지로 직접 실행해 확인했다. "CI 에서 재사용 금지", "이미지 메이저 버전 고정"은 설계 권고다.
