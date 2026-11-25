---
name: RabbitMQ
url: https://www.rabbitmq.com
docs: https://www.rabbitmq.com/docs
repo: https://github.com/rabbitmq/rabbitmq-server
stars: 13983
domain: backend
category: messaging
description: exchange 와 queue 로 메시지를 라우팅하는 범용 메시지 브로커. AMQP 0-9-1·AMQP 1.0·MQTT·STOMP 를 지원하며 작업 큐, 라우팅이 복잡한 비동기 통신에 쓴다.
pricing: oss
tags: [message-broker, amqp, queue, mqtt, streams]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
RabbitMQ 는 Erlang 으로 작성된 메시지 브로커다. 프로듀서는 **exchange** 에 메시지를 보내고, exchange 는 바인딩 규칙(라우팅 키·패턴·헤더)에 따라 **queue** 로 나눠 넣는다. 소비자가 메시지를 확인(ack)하면 큐에서 지워지는 "전달 후 삭제" 모델이라 작업 분배·재시도·라우팅이 쉽다. Kafka 처럼 재생 가능한 로그가 필요하면 **Streams** 큐 타입을 쓴다.

2026-11 기준 최신은 **4.4.1**(2026-11-16). 4.x 의 큰 변화:
- 4.0: 클래식 큐 미러링 제거(복제가 필요하면 quorum queue 또는 stream), AMQP 1.0 이 항상 켜진 핵심 프로토콜이 됨, 메타데이터 저장소 Khepri(Raft 기반) 지원.
- 4.4: quorum queue 에서 지연 메시지(`x-opt-delivery-time`) 지원, Erlang 28·29 지원.

서버와 핵심 플러그인은 MPL-2.0. 상용 지원판은 Broadcom(VMware) Tanzu RabbitMQ.

## 설치
관리 UI 가 포함된 공식 커뮤니티 이미지:
```bash
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:4-management
```
5672 = AMQP, 15672 = 관리 UI(http://localhost:15672, 기본 계정 guest/guest 는 개발용이며 운영에서는 별도 사용자를 만들고 삭제한다).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Exchange | 메시지를 받아 큐로 라우팅. 타입: `direct`(키 일치), `topic`(`order.*.created` 같은 패턴), `fanout`(전체 복사), `headers` |
| Queue | 메시지가 쌓이는 곳. 타입: classic(비복제), **quorum**(Raft 복제, 내구성 기본 선택), **stream**(보관·재생 가능한 로그) |
| Binding | exchange 와 queue 를 잇는 규칙 |
| Ack / Nack | 소비자가 처리 완료(ack)하거나 거부(nack, 재큐 여부 선택) |
| Prefetch (QoS) | 소비자에게 동시에 넘길 미확인 메시지 수 상한 |
| Publisher confirm | 브로커가 메시지를 안전하게 받았음을 프로듀서에 알림 |
| Dead letter exchange | 거부·만료·길이 초과 메시지를 옮길 exchange |
| Virtual host | 하나의 브로커 안에서 권한·자원을 나누는 논리 공간 |

## 기본 사용법
TypeScript(`amqplib`) 로 quorum queue 를 만들고 주고받는다.
```ts
import amqp from 'amqplib'

const conn = await amqp.connect('amqp://localhost')
const ch = await conn.createChannel()
await ch.assertQueue('emails', { durable: true, arguments: { 'x-queue-type': 'quorum' } })

ch.sendToQueue('emails', Buffer.from(JSON.stringify({ to: 'a@example.com' })), { persistent: true })

await ch.prefetch(10)
await ch.consume('emails', (msg) => {
  if (!msg) return
  console.log(JSON.parse(msg.content.toString()))
  ch.ack(msg)
})
```
topic exchange 라우팅:
```ts
await ch.assertExchange('orders', 'topic', { durable: true })
await ch.bindQueue('emails', 'orders', 'order.*.created')
ch.publish('orders', 'order.kr.created', Buffer.from('{"id":1}'))
```

## 언어별 클라이언트
| 언어 | 클라이언트 |
| --- | --- |
| TypeScript/JS | `amqplib`, `rabbitmq-client` |
| Python | `pika`, `aio-pika`, Celery 브로커로 사용 |
| Go | `github.com/rabbitmq/amqp091-go` |
| Java/Kotlin | 공식 `amqp-client`, Spring AMQP |
| C# | 공식 `RabbitMQ.Client` |
| Rust | `lapin` |
AMQP 1.0 전용 공식 클라이언트(Java·.NET·Go·Python·JS)도 있다.

## 자주 쓰는 패턴
- **작업 큐(competing consumers)**: 한 큐에 여러 워커를 붙이고 `prefetch` 로 부하를 나눈다.
- **재시도 + DLX**: 실패 메시지를 dead letter exchange 로 보내 별도 큐에서 검사·재처리. quorum queue 는 기본 전달 한도(4.x 기본 20회, `delivery-limit` 정책으로 조정)로 무한 재전달을 막는다.
- **이벤트 라우팅**: topic exchange 로 `도메인.지역.이벤트` 같은 키를 구독자별로 분기.
- **RPC**: `reply_to` 와 `correlation_id` 로 요청-응답(단, 동기 호출은 HTTP·gRPC 가 대개 단순).
- **Streams**: 같은 이벤트를 여러 소비자가 offset 기준으로 다시 읽어야 할 때 stream 큐 타입 사용.

## 언제 쓰나 / 피할 때
- 쓸 때: 백그라운드 작업 분배, 라우팅 규칙이 다양한 서비스 간 메시징, MQTT·STOMP 등 여러 프로토콜을 한 브로커로 받을 때.
- 피할 때(대안): 수십 TB 이벤트 보관·재생·스트림 처리 중심이면 [Apache Kafka](/develop-wiki/backend/messaging/apache-kafka/). 초경량 pub/sub·엣지 환경은 [NATS](/develop-wiki/backend/messaging/nats/). 긴 다단계 업무 흐름의 상태 관리는 [Temporal](/develop-wiki/backend/messaging/temporal/). 클래식 미러링 큐를 쓰던 3.x 클러스터는 4.x 로 올리기 전에 quorum queue 로 옮겨야 한다.

## 공식 문서
- [문서](https://www.rabbitmq.com/docs) · [다운로드·Docker](https://www.rabbitmq.com/docs/download) · [Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues) · [Streams](https://www.rabbitmq.com/docs/streams) · [튜토리얼](https://www.rabbitmq.com/tutorials) · [릴리스 노트](https://github.com/rabbitmq/rabbitmq-server/tree/main/release-notes)
