---
title: 셀 기반 아키텍처
aka: [Cell-based Architecture, Cellular Architecture, Cell, Deployment Stamps, Scale Unit, Blast Radius, Cell Router]
category: architecture
group: system-style
level: advanced
summary: 서비스 전체를 같은 구성의 독립된 복사본(셀) 여러 개로 나누고 고객을 셀에 배정해, 어느 셀의 장애·배포 실패가 고객 일부에만 미치게 하는 격리 중심의 시스템 스타일.
tags: [cell-based, resilience, blast-radius, multi-tenant, deployment-stamps, fault-isolation, aws]
related: [performance/bulkhead, data-modeling/sharding-partitioning, algorithms/consistent-hashing, architecture/event-driven, performance/load-balancing, engineering-practice/incident-response-postmortem, engineering-practice/ci-cd-pipeline]
sources:
  - https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html
  - https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/cell-routing.html
  - https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/cell-sizing.html
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/deployment-stamp
  - https://slack.engineering/slacks-migration-to-a-cellular-architecture/
updatedAt: 2026-11-19
---

## 문제

서비스 하나를 모든 고객이 공유하면 장애의 **영향 범위(blast radius)** 가 곧 전체 고객이다. 나쁜 배포, 한 고객의 폭주 트래픽, 데이터 손상, 한도(quota) 도달이 모두 전체로 퍼진다. 시스템이 클수록 한 번도 시험해 본 적 없는 규모로 커져 알려지지 않은 한계에 부딪힌다. 복제본을 늘려 가용성을 높여도 **같은 코드와 같은 공유 자원**에 같이 의존하는 한 한꺼번에 무너진다.

## 해법: 같은 모양의 독립 복사본 + 라우터

AWS 의 Well-Architected 백서(2023)는 AZ·리전 같은 장애 격리 경계를 **워크로드 아키텍처 수준**으로 가져오는 방법이라고 소개한다. 핵심 요소는 둘이다.

- **셀(cell)**: 서비스의 **완전한 복사본**(컴퓨트, 데이터 저장소, 큐 등 포함)이다. 고객의 일부(파티션 키로 결정)만 맡는다. 셀끼리 서로 호출하거나 상태를 공유하지 않도록 설계하는 것이 일반 원칙이다(이 노트가 직접 읽은 AWS 백서 절에서는 라우터 쪽 격리와 셀 크기 논의만 확인했다).
- **셀 라우터**: 요청의 파티션 키(고객·테넌트 ID)를 보고 담당 셀로 보낸다. 모든 셀이 공유하는 유일한 지점이다.

Azure 아키텍처 센터의 **Deployment Stamps** 패턴이 같은 구조를 가리킨다. 문서는 같은 구성요소 묶음을 stamp, scale unit, service unit, cell 로 부르며, 각 stamp 가 정해진 수의 테넌트를 맡고 stamp 를 더해 거의 선형으로 확장한다고 설명한다.

```ts
import { hash32 } from './common.ts';

// 라우터: 파티션 키(tenant) → 고정 개수 슬롯 → 셀. 슬롯 표는 데이터이고, 라우터 코드에는 업무 로직이 없다
const SLOTS = 1024;
const cellOfSlot: string[] = Array.from({ length: SLOTS }, (_, s) => `cell-${s % 8}`);   // 처음엔 셀 8개에 균등 배정
const route = (tenant: string) => cellOfSlot[hash32(tenant) % SLOTS];

const tenants = Array.from({ length: 50_000 }, (_, i) => `tenant-${i}`);
const share = new Map<string, number>(); tenants.forEach((t) => share.set(route(t), (share.get(route(t)) ?? 0) + 1));
console.log([...share].map(([c, n]) => `${c}:${(n / tenants.length * 100).toFixed(1)}%`).join(' '));

// 셀 하나가 죽었을 때 영향받는 테넌트 비율 = 그 셀 몫
console.log('cell-3 장애 영향', ((share.get('cell-3') ?? 0) / tenants.length * 100).toFixed(1) + '%');

// 셀 추가: 슬롯 일부만 새 셀로 옮긴다 (슬롯 단위 이관, 나머지 테넌트는 그대로)
for (let s = 0; s < SLOTS; s += 9) cellOfSlot[s] = 'cell-8';
const moved = tenants.filter((t) => route(t) === 'cell-8').length;
console.log('cell-8 로 이관된 테넌트', (moved / tenants.length * 100).toFixed(1) + '%');
```

실행하면 8개 셀이 각각 12.3~12.7% 를 맡고, 셀 하나가 죽으면 영향은 12.6%, 새 셀을 추가하며 슬롯을 옮기면 11.1% 의 테넌트만 이동한다. 테넌트를 고정 크기의 **슬롯**에 먼저 매핑하고 슬롯을 셀에 배정하는 표를 쓰면 셀 추가 시 해시를 다시 계산하지 않고 슬롯 단위로 옮길 수 있다(설계 선택. 해시 계산 방식은 백서도 "암호 해시와 나머지 연산 같은 효율적 매핑"을 예로 든다).

### 라우터 설계 원칙 (AWS 백서)

- 셀들이 공유하는 **유일한 요소**이므로 가능한 한 단순하고 수평 확장 가능해야 한다. **업무 로직을 넣지 않는다.**
- 셀 하나가 응답하지 않아도 다른 셀로 가는 요청은 정상 동작해야 한다(셀 간 요청 격리).
- 클라이언트에는 셀 구조를 숨긴다.
- 파티션 키 → 셀 매핑을 어디에 둘지(DNS, API 게이트웨이, 컴퓨트 + 저장소의 매핑 표)는 선택지가 있고 각각 장단점이 있다.

### 셀 크기 (AWS 백서)

서로 반대로 당기는 힘 세 가지를 균형 잡는다: 가장 큰 워크로드를 담을 만큼 크게, **전체 규모로 시험·운영할 수 있을 만큼 작게**, 규모의 경제를 얻을 만큼 크게. 최대 크기를 정해 두고(테넌트 수, 초당 트랜잭션 수, 데이터량) 모든 설치에서 **같은 크기**를 유지하며, 한도에 닿기 전에 새 셀을 만든다.

| | 작은 셀 | 큰 셀 |
| --- | --- | --- |
| 셀 장애·드레인 영향 | 작다 | 크다 |
| 알려지지 않은 한계에 닿을 확률 | 낮다 | 높다 |
| 셀 개수·운영 부담 | 많다 | 적다 |
| 한 고객의 워크로드를 셀에 넣기 | 쪼개야 할 수 있다 | 쉽다 |
| 자원 이용률 | 낮다 | 높다 |

## 사례: Slack 의 AZ 단위 셀

Slack 은 2021년 6월 30일 us-east-1 의 한 AZ 에서 간헐적 네트워크 링크 장애가 났을 때, 서비스가 여러 AZ 에 퍼져 있었는데도 사용자 오류를 겪었다. 컴포넌트마다 어느 백엔드가 건강한지에 대한 판단이 달랐던 **gray failure** 였다. 이후 **AZ 하나를 셀로** 삼아 각 서비스가 자기 AZ 의 트래픽만 받고 자기 AZ 안의 업스트림만 호출하도록 사일로화했다. 엣지 Envoy 로드 밸런서가 AZ 별 가중치로 트래픽을 보내고, 운영자가 가중치를 0 으로 내려 **AZ 를 드레인**할 수 있다. 설계 목표는 5분 안에 대부분의 트래픽 제거, 사용자 오류 없음, 1% 단위 점진 이동이다(글은 이를 목표로 서술하며 측정 결과로 확정하지는 않는다). 사일로화할 수 없는 서비스는 후속 글로 미룬다고 한다.

## 비교

| | 셀 기반 | 벌크헤드 | 샤딩 | 단순 복제(액티브-액티브) |
| --- | --- | --- | --- | --- |
| 나누는 단위 | **전체 스택**의 복사본 | 한 서비스 내 자원(스레드, 풀) | 데이터 저장소 | 인스턴스 |
| 장애 격리 | 고객 일부 단위로 전체 격리 | 의존성별 | 데이터 일부 | 거의 없음(같은 코드·자원) |
| 배포 | 셀 단위 점진 배포 가능 | - | - | 보통 전체 |

벌크헤드는 칸막이의 안쪽 아이디어이고, 셀 기반은 이를 시스템 전체 규모로 확장한 것이다 → [벌크헤드](/develop-wiki/knowledge/performance/bulkhead/). 데이터를 나눈다는 점은 [샤딩](/develop-wiki/knowledge/data-modeling/sharding-partitioning/)과 닮았지만, 셀은 **데이터와 컴퓨트를 함께** 나누고 셀 사이 공유를 막는 점이 다르다.

## 언제 쓰나

- 가용성 요구가 높아 **전체 장애는 절대 안 되는** 서비스(결제, 인증, 메시징).
- **멀티 테넌트**에서 고객 간 영향 차단과 큰 고객 격리가 필요할 때.
- 모든 고객에게 한꺼번에 배포하는 위험을 줄이고 셀 하나에 먼저 내보내는 **점진 배포**를 하고 싶을 때(Azure 문서는 stamp 별 업데이트 주기 분리도 언급).
- 규모가 커서 단일 인스턴스가 한도(연결 수, 계정 quota)에 닿기 시작할 때.

## 주의 (비용)

- **비용이 곱셈이 된다.** 셀마다 전체 스택을 복제하니 고정비가 늘고, 작은 셀일수록 이용률이 떨어진다. Azure 문서도 비용이 상당히 늘어난다고 경고하며, 작고 단순한 서비스에는 맞지 않다고 한다.
- **운영 복잡도**: 셀이 수십~수백 개면 배포·모니터링·설정 정합성을 자동화해야 한다. Azure 문서는 stamp 를 최소 2개로 시작하고(하나뿐이면 단일 인스턴스 가정이 코드에 굳는다), 코드형 인프라와 설정 드리프트 점검을 권한다.
- **라우터가 공유 의존성**이다. 라우터가 죽으면 전 셀이 영향을 받으므로 단순하게 유지하고 별도로 고가용성을 확보한다(Azure 문서는 중앙 라우팅 서비스 설계가 복잡할 수 있다고 한다).
- **셀 간 이동이 어렵다.** 테넌트를 다른 셀로 옮기려면 데이터 이관 로직이 필요하다. 한 테넌트가 셀 하나보다 크면 곤란하다.
- **고객 횡단 기능**(전체 검색, 통계, 관리자 화면)은 셀 간 집계를 별도로 설계해야 한다. 이를 위해 공유 컴포넌트를 두면 그것이 새로운 장애 전파 경로가 된다.
- 셀이 **리전 장애는 막아 주지 않는다.** Azure 문서는 stamp 가 리전 간 중복이 아니므로 해당 리전이 죽으면 그 stamp 의 테넌트가 접근 불가이며, 복구 절차를 따로 계획하라고 한다.
- 도입 비용을 줄이려면 먼저 [벌크헤드](/develop-wiki/knowledge/performance/bulkhead/)나 샤딩, 가용 영역 분산으로 충분한지 따져 본다.
