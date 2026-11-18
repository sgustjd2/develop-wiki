---
name: BullMQ
url: https://bullmq.io
docs: https://docs.bullmq.io
repo: https://github.com/taskforcesh/bullmq
stars: 9611
domain: backend
category: messaging
description: Redis(또는 Valkey·Dragonfly)나 PostgreSQL 에 큐를 저장하는 백그라운드 작업 큐 라이브러리. 지연·반복·우선순위·재시도·부모-자식 작업이 필요한 Node.js 서비스에 주로 쓴다.
pricing: oss
tags: [job-queue, background-jobs, redis, valkey, scheduler]
languages: [typescript, python, elixir, rust, csharp, php]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
BullMQ 는 Redis 를 저장소로 쓰는 작업 큐 라이브러리다. 별도 브로커 서버 없이 애플리케이션이 `Queue` 로 작업을 넣고 `Worker` 가 꺼내 처리한다. 원자성이 필요한 동작은 Redis Lua 스크립트로 구현돼 있어 여러 워커가 동시에 붙어도 작업이 한 번만 할당된다. Bull 의 후속 프로젝트이며 TypeScript 로 작성됐다.

모든 SDK 가 같은 데이터 모델을 써서 TypeScript(Node.js·Bun) 프로듀서와 Python 워커처럼 언어를 섞을 수 있다. 공식 SDK: TypeScript, Python, Elixir, Rust, .NET, PHP(PHP 는 작업 추가만 가능한 Queue 클라이언트).

저장소: Redis 6.2 이상(호환 서버 Valkey·Dragonfly 포함)이 기본이고, PostgreSQL 13 이상 백엔드(`createPostgresBackend`)도 제공한다. 2026-11 기준 npm `bullmq` **6.7.7**. MIT 라이선스. 추가 기능을 담은 유료 BullMQ Pro 가 별도로 있다.

## 설치
```bash
npm install bullmq
docker run -d --name redis -p 6379:6379 redis:latest   # 또는 valkey/valkey 이미지
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Queue | 작업을 추가·조회·관리하는 객체. 이름으로 구분 |
| Worker | 큐에서 작업을 가져와 처리 함수 실행. `concurrency` 로 동시 처리 수 지정 |
| Job | 이름 + 데이터(JSON) + 옵션(delay, priority, attempts, backoff, jobId) |
| 상태 | wait → active → completed / failed, 그 외 delayed, prioritized, waiting-children |
| QueueEvents | 모든 워커의 완료·실패·진행 이벤트를 한 곳에서 구독 |
| Job Scheduler | 크론·주기(`every`)로 작업을 만들어 내는 스케줄러(5.16+, 예전 repeatable job 대체) |
| Flow | `FlowProducer` 로 만든 부모-자식 작업 트리. 자식이 모두 끝나야 부모 실행 |
| Stalled job | 워커가 죽어 잠금이 끊긴 작업. 자동으로 다시 대기열로 |

## 기본 사용법
```ts
import { Queue, Worker } from 'bullmq'

const connection = { host: 'localhost', port: 6379 }
const emails = new Queue('emails', { connection })

await emails.add('welcome', { to: 'a@example.com' }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 1000,              // 완료 작업은 최근 1000개만 보관
})

const worker = new Worker('emails', async (job) => {
  console.log(job.name, job.data)      // 실제 발송 로직
  return { sent: true }
}, { connection, concurrency: 20 })

worker.on('failed', (job, err) => console.error(job?.id, err.message))
```
주기 작업과 PostgreSQL 백엔드:
```ts
await emails.upsertJobScheduler('daily-digest', { pattern: '0 9 * * *' }, { name: 'digest' })

import { createPostgresBackend } from 'bullmq'   // npm install pg 필요
const pgQueue = new Queue('emails', { connection: 'postgres://app@localhost:5432/app' }, createPostgresBackend)
```

## 자주 쓰는 패턴
- **중복 방지**: `jobId` 를 업무 키로 지정하거나 deduplication 옵션으로 같은 작업이 두 번 들어가지 않게 한다.
- **재시도 + 지수 백오프**: `attempts`·`backoff` 로 외부 API 일시 오류를 흡수하고, 최종 실패 작업은 `failed` 상태로 남겨 대시보드에서 재시도.
- **속도 제한**: Worker 의 `limiter`(예: 초당 N 건)로 외부 API 레이트 리밋을 지킨다.
- **샌드박스 프로세서**: CPU 를 많이 쓰는 작업은 처리 함수를 별도 파일로 분리해 자식 프로세스에서 실행, 이벤트 루프 차단 방지.
- **정상 종료**: 배포 시 `await worker.close()` 로 진행 중 작업을 마치고 내려간다.
- **Redis 설정**: 직접 ioredis 인스턴스를 넘길 때 Worker 용은 `maxRetriesPerRequest: null`, Redis 는 `maxmemory-policy noeviction` 으로 작업 키가 축출되지 않게 한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Node.js 웹 서비스의 이메일·이미지 처리·웹훅 같은 백그라운드 작업, 이미 [Redis](/develop-wiki/backend/database/redis/)(또는 Valkey)나 [PostgreSQL](/develop-wiki/backend/database/postgresql/)을 운영 중이라 브로커를 따로 두기 싫을 때.
- 피할 때(대안): Python 중심 팀은 [Celery](/develop-wiki/backend/messaging/celery/)가 생태계가 넓다. 여러 서비스에 이벤트를 퍼뜨리거나 재생해야 하면 [Apache Kafka](/develop-wiki/backend/messaging/apache-kafka/)·[NATS](/develop-wiki/backend/messaging/nats/). 며칠씩 걸리는 다단계 흐름과 보상 로직은 [Temporal](/develop-wiki/backend/messaging/temporal/).

## 공식 문서
- [문서](https://docs.bullmq.io) · [Quick Start](https://docs.bullmq.io/quick-start) · [Connections](https://docs.bullmq.io/guide/connections) · [PostgreSQL 백엔드](https://docs.bullmq.io/guide/postgresql) · [Job Schedulers](https://docs.bullmq.io/guide/job-schedulers) · [Flows](https://docs.bullmq.io/guide/flows) · [API 레퍼런스](https://docs.bullmq.io/api/)
