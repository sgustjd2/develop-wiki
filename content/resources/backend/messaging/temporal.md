---
name: Temporal
url: https://temporal.io
docs: https://docs.temporal.io
repo: https://github.com/temporalio/temporal
stars: 24571
domain: backend
category: messaging
description: 코드로 작성한 워크플로의 실행 상태를 서버가 기록해 장애·재시작 뒤에도 이어서 실행하는 내구성 실행(durable execution) 엔진. 결제·주문·온보딩처럼 길고 여러 단계인 업무 흐름에 쓴다.
pricing: oss
tags: [workflow-engine, durable-execution, orchestration, saga]
languages: [go, java, csharp, php, python, ruby, rust, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Temporal 은 "워크플로를 평범한 함수로 작성하면, 실행 이력을 서버가 이벤트로 저장해 프로세스가 죽어도 같은 지점부터 재개"하는 **내구성 실행** 플랫폼이다. 재시도·타임아웃·타이머(며칠~몇 달 대기)·사람의 승인 대기 같은 것을 큐·크론·상태 테이블을 직접 조합하지 않고 코드로 표현한다. Uber 의 Cadence 에서 갈라져 나왔다.

구성: **Temporal Service**(서버, Go) + 애플리케이션이 실행하는 **Worker**(SDK) + 워크플로를 시작·조회하는 **Client**. 서버는 작업을 Task Queue 에 넣을 뿐 사용자 코드를 실행하지 않는다.

2026-11 기준 서버 **v1.32.2**, TypeScript SDK 1.26.0, Python SDK 1.36.1, Go SDK 1.51.0. 서버·SDK 모두 MIT. 매니지드 서비스 Temporal Cloud(유료)가 있고, 자체 호스팅 시 영속 저장소로 PostgreSQL·MySQL·Cassandra 등을 쓴다.

## 설치
개발용 로컬 서버(Temporal CLI 내장. 옵션 없이 실행하면 서버 종료 시 실행 기록이 사라진다):
```bash
brew install temporal
temporal server start-dev                       # gRPC 7233, Web UI 8233
temporal server start-dev --db-filename temporal.db   # 재시작 후에도 데이터 유지
```
SDK 설치 예:
```bash
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
pip install temporalio
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Workflow | 업무 흐름을 표현하는 **결정적(deterministic)** 함수. 재실행(replay)해도 같은 명령을 내야 한다 |
| Activity | 외부 I/O(API 호출, DB 쓰기)를 하는 일반 함수. 실패하면 재시도 정책에 따라 재실행 |
| Worker | Task Queue 를 폴링해 워크플로·액티비티 코드를 실행하는 프로세스 |
| Task Queue | 서버와 워커를 잇는 이름 있는 큐. 워커 풀 분리·라우팅 단위 |
| Event History | 워크플로 실행 중 일어난 모든 이벤트 기록. 재개·디버깅의 근거 |
| Signal / Query / Update | 실행 중인 워크플로에 데이터 보내기 / 상태 읽기 / 검증 후 변경하고 결과 받기 |
| Timer | `sleep('30 days')` 처럼 서버가 보관하는 내구성 타이머 |
| Child Workflow / Continue-As-New | 하위 워크플로 분리, 이력이 길어지면 새 실행으로 이어가기 |

## 기본 사용법
TypeScript: 액티비티 → 워크플로 → 워커 → 클라이언트.
```ts
// activities.ts
export async function chargeCard(orderId: string): Promise<string> {
  return `receipt-${orderId}`        // 실제로는 결제 API 호출
}

// workflows.ts — 결정적 코드만. I/O 는 액티비티로.
import { proxyActivities, sleep } from '@temporalio/workflow'
import type * as activities from './activities'
const { chargeCard } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 5 },
})
export async function orderWorkflow(orderId: string) {
  const receipt = await chargeCard(orderId)
  await sleep('1 day')               // 서버가 보관하는 타이머
  return receipt
}
```
```ts
// worker.ts
import { NativeConnection, Worker } from '@temporalio/worker'
import * as activities from './activities'
async function run() {
  const connection = await NativeConnection.connect({ address: 'localhost:7233' })
  const worker = await Worker.create({
    connection, taskQueue: 'orders', activities,
    workflowsPath: require.resolve('./workflows'),   // 워크플로는 별도 샌드박스에서 실행
  })
  await worker.run()
}
run()

// client.ts
import { Client, Connection } from '@temporalio/client'
async function start() {
  const client = new Client({ connection: await Connection.connect({ address: 'localhost:7233' }) })
  const handle = await client.workflow.start('orderWorkflow', {
    taskQueue: 'orders', workflowId: 'order-1001', args: ['1001'],
  })
  console.log(await handle.result())
}
start()
```

## 자주 쓰는 패턴
- **Saga(보상 트랜잭션)**: 단계마다 성공한 작업의 취소 함수를 쌓아 두고, 실패 시 역순으로 실행.
- **업무 키를 workflowId 로**: `order-1001` 처럼 지정하면 같은 주문의 중복 실행을 서버가 막는다.
- **사람 승인 대기**: 워크플로가 Signal(또는 Update)을 `condition()` 으로 기다리고, 타이머로 기한을 건다.
- **워크플로 코드 변경**: 실행 중인 워크플로가 있으면 결정성이 깨지지 않게 버전 관리(patching, Worker Versioning)를 쓴다.
- **Schedule**: 크론 대신 Temporal Schedule 로 주기 실행하고 일시정지·백필을 UI 에서 관리.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 서비스를 거치는 장기 실행 프로세스, 실패·재시도·보상 로직이 복잡한 결제·주문·프로비저닝, 대기 시간이 긴 업무 흐름.
- 피할 때(대안): 단순 백그라운드 작업·이메일 발송은 [BullMQ](/develop-wiki/backend/messaging/bullmq/)·[Celery](/develop-wiki/backend/messaging/celery/) 로 충분하다. 데이터 파이프라인 DAG 스케줄링은 Airflow 계열이 맞다. 이벤트를 여러 소비자에게 퍼뜨리는 용도는 [Apache Kafka](/develop-wiki/backend/messaging/apache-kafka/)·[NATS](/develop-wiki/backend/messaging/nats/). 결정성 규칙(워크플로 안에서 시간·난수·I/O 직접 사용 금지)을 팀이 익혀야 한다.

## 공식 문서
- [문서](https://docs.temporal.io) · [SDK 목록](https://docs.temporal.io/develop) · [CLI 설치](https://docs.temporal.io/cli/setup-cli) · [로컬 서버](https://docs.temporal.io/cli/server) · [TypeScript 샘플](https://github.com/temporalio/samples-typescript) · [자체 호스팅 가이드](https://docs.temporal.io/self-hosted-guide)
