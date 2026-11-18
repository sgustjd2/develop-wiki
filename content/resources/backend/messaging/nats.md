---
name: NATS
url: https://nats.io
docs: https://docs.nats.io
repo: https://github.com/nats-io/nats-server
stars: 21055
domain: backend
category: messaging
description: 단일 바이너리로 동작하는 경량 메시징 시스템. subject 기반 pub/sub·요청-응답을 제공하고, JetStream 으로 영속 스트림·KV 저장소까지 쓸 수 있다. 마이크로서비스·엣지·IoT 통신에 쓴다.
pricing: oss
tags: [pubsub, request-reply, jetstream, cncf, key-value]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
NATS 는 Go 로 작성된 CNCF 메시징 시스템이다. 서버는 의존성 없는 단일 바이너리이고, 클라이언트는 **subject**(점으로 구분된 문자열)에 publish·subscribe 한다. 기본(Core NATS)은 메모리상에서 현재 연결된 구독자에게만 전달하는 at-most-once 방식이라 매우 가볍고, 내장 영속 계층 **JetStream** 을 켜면 저장·재생·at-least-once 전달과 Key-Value·Object Store 를 쓸 수 있다.

2026-11 기준 최신 서버는 **v2.15.3**(2026-11-11). Apache-2.0.

라이선스 이력: 2025년 4월 주 기여사 Synadia 가 서버를 BSL 로 바꾸려는 계획을 밝혀 CNCF 와 분쟁이 있었으나, 2025-05-01 합의로 NATS 는 CNCF 프로젝트로 남고 Apache-2.0 을 유지하기로 했다. 상용 기능은 Synadia 의 별도 제품(Synadia Platform·Cloud)으로 제공된다.

## 설치
```bash
docker run -p 4222:4222 -p 8222:8222 nats:latest -js   # 4222 클라이언트, 8222 모니터링
brew install nats-server && nats-server -js              # 로컬 바이너리 + JetStream
brew install nats-io/nats-tools/nats                     # nats CLI
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Subject | `orders.kr.created` 처럼 점으로 구분된 주소. `*` 는 토큰 하나, `>` 는 나머지 전체와 일치 |
| Pub/Sub | 같은 subject 구독자 모두에게 전달(fan-out) |
| Request-Reply | 요청 시 임시 응답 subject(inbox)를 만들어 응답 하나를 기다림 |
| Queue Group | 같은 그룹 구독자 중 한 명에게만 전달 → 별도 설정 없는 부하 분산 |
| JetStream Stream | subject 패턴에 묶인 서버측 메시지 저장소(메모리·디스크, 복제, 보관 정책) |
| Consumer | 스트림에 대한 상태 있는 읽기 뷰. 진행 위치를 서버가 관리하고 미확인 메시지는 재전달 |
| KV / Object Store | JetStream 위에 만든 복제되는 키-값 저장소와 대용량 객체 저장소 |
| Cluster / Leaf node / Gateway | 서버 클러스터, 엣지에서 중앙으로 붙는 leaf node, 클러스터 간 연결(supercluster) |

## 기본 사용법
CLI 로 확인:
```bash
nats sub 'orders.>'                       # 터미널 1
nats pub orders.kr.created '{"id":1}'     # 터미널 2
nats reply greet 'hi'  &  nats request greet 'hello' --timeout=2s
```
Go(`github.com/nats-io/nats.go`, JetStream 은 `jetstream` 패키지):
```go
nc, _ := nats.Connect(nats.DefaultURL)
defer nc.Drain()

// Core: 큐 그룹으로 부하 분산
nc.QueueSubscribe("orders.*.created", "billing", func(m *nats.Msg) {
    fmt.Println(string(m.Data))
})

// JetStream: 스트림 생성 → 발행 → 내구 소비자
js, _ := jetstream.New(nc)
ctx := context.Background()
s, _ := js.CreateStream(ctx, jetstream.StreamConfig{Name: "ORDERS", Subjects: []string{"orders.>"}})
js.Publish(ctx, "orders.kr.created", []byte(`{"id":1}`))
cons, _ := s.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{Durable: "billing", AckPolicy: jetstream.AckExplicitPolicy})
cons.Consume(func(msg jetstream.Msg) { msg.Ack() })
```

## 언어별 클라이언트
공식 클라이언트: Go(`nats.go`), TypeScript/JS(`@nats-io/transport-node` 등 v3 모듈 구조, 구버전 `nats` 패키지), Python(`nats-py`), Rust(`async-nats`), Java(`jnats`), C#(`NATS.Net`), C, Elixir 등 커뮤니티 클라이언트 다수.

## 자주 쓰는 패턴
- **서비스 간 요청-응답**: HTTP 대신 subject 로 호출하면 서비스 디스커버리·로드밸런싱이 큐 그룹으로 해결된다. 공식 Services API(`micro`)로 엔드포인트·상태 조회를 표준화.
- **subject 설계**: `도메인.지역.엔티티.이벤트` 순으로 넓은 것→좁은 것. 와일드카드 구독과 권한(subject 단위 ACL)이 이 구조를 따른다.
- **JetStream 작업 큐**: `WorkQueuePolicy` 스트림 + 공유 pull consumer 로 한 번만 처리되는 작업 분배.
- **KV 로 설정·리더 선출**: KV 버킷의 watch 로 설정 변경 전파, revision 비교 갱신(CAS)으로 간단한 락.
- **엣지 연결**: 공장·매장 같은 엣지에 leaf node 를 두고 중앙 클러스터와 선택적으로 subject 를 공유.

## 언제 쓰나 / 피할 때
- 쓸 때: 지연이 낮은 마이크로서비스 통신, 요청-응답과 이벤트를 한 시스템으로, 엣지·IoT 처럼 작은 풋프린트가 필요할 때.
- 피할 때(대안): 커넥터·스트림 처리 생태계(CDC, Kafka Connect, Flink)가 중요하면 [Apache Kafka](/develop-wiki/backend/messaging/apache-kafka/). AMQP 표준 호환이나 exchange 기반 복잡 라우팅이 필요하면 [RabbitMQ](/develop-wiki/backend/messaging/rabbitmq/). Core NATS 는 구독자가 없으면 메시지가 사라지므로 유실이 안 되는 흐름은 반드시 JetStream 을 쓴다.

## 공식 문서
- [문서](https://docs.nats.io) · [시작하기](https://docs.nats.io/concepts/getting-started/) · [Subjects](https://docs.nats.io/concepts/subjects) · [JetStream](https://docs.nats.io/concepts/jetstream) · [NATS by Example](https://natsbyexample.com) · [CNCF–Synadia 합의 발표](https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/)
