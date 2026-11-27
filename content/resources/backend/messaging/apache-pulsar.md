---
name: Apache Pulsar
url: https://pulsar.apache.org
docs: https://pulsar.apache.org/docs/
repo: https://github.com/apache/pulsar
stars: 15369
domain: backend
category: messaging
description: 서빙(브로커)과 저장(BookKeeper)을 분리한 분산 메시징·스트리밍 플랫폼. 스트림과 큐 방식 구독, 멀티테넌시, 지역 간 복제가 필요한 대규모 메시징에 쓴다.
pricing: oss
tags: [event-streaming, pubsub, queue, multi-tenancy, geo-replication]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Apache Pulsar 는 메시지를 받는 상태 없는 **브로커** 와, 데이터를 세그먼트 단위로 나눠 저장하는 **Apache BookKeeper**(bookie) 를 분리한 구조다. 저장과 서빙을 따로 늘릴 수 있고, 브로커를 추가해도 파티션 데이터를 옮길 필요가 없다. 하나의 토픽을 Kafka 처럼 순서 있는 스트림으로도, RabbitMQ 처럼 메시지 단위 ack 를 하는 작업 큐로도 소비할 수 있다(구독 타입으로 선택).

테넌트 → 네임스페이스 → 토픽 계층으로 **멀티테넌시** 를 기본 제공하고, 클러스터 간 **지역 복제(geo-replication)** 와 오래된 세그먼트를 S3 같은 객체 저장소로 옮기는 **티어드 스토리지** 가 내장돼 있다.

2026-11 기준 최신은 **5.0.1**(2026-10-26), 5.0.x 가 LTS 계열이다(4.0.x 도 LTS). Apache-2.0.

## 설치
로컬 standalone(브로커·bookie·메타데이터 저장소를 한 프로세스로 실행, 개발용):
```bash
docker run -it -p 6650:6650 -p 8080:8080 \
  --mount source=pulsardata,target=/pulsar/data \
  --mount source=pulsarconf,target=/pulsar/conf \
  apachepulsar/pulsar:5.0.1 bin/pulsar standalone --advertised-address localhost
```
6650 = 바이너리 프로토콜(클라이언트), 8080 = HTTP 관리 API. 5.0 standalone 의 기본 메타데이터 저장소는 RocksDB 다. 운영 배포는 공식 Helm 차트를 주로 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Tenant / Namespace / Topic | `persistent://tenant/namespace/topic` 형식. 정책(보관, 할당량, 복제)은 네임스페이스 단위 |
| Broker | 상태 없는 서빙 계층. 토픽 소유권을 나눠 갖고 장애 시 다른 브로커가 넘겨받음 |
| BookKeeper / Ledger | 복제되는 로그 저장소. 토픽 데이터는 여러 ledger(세그먼트)로 나뉘어 bookie 들에 분산 |
| Subscription | 소비 위치를 관리하는 이름 있는 커서 |
| 구독 타입 | `Exclusive`(소비자 1), `Failover`(대기 소비자), `Shared`(라운드로빈, 큐), `Key_Shared`(키별 순서 유지 + 병렬) |
| Ack / Negative ack | 메시지 단위 확인. nack·ack timeout 시 재전달, dead letter topic 지원 |
| Retention / TTL | 확인된 메시지 보관 기간과 미확인 메시지 만료 |
| Tiered storage | 오래된 세그먼트를 S3·GCS 등으로 오프로드 |
| Pulsar Functions / IO | 경량 서버리스 처리 함수와 소스·싱크 커넥터 |

## 기본 사용법
Python(`pulsar-client`) 프로듀서와 Shared 구독 소비자:
```python
import pulsar

client = pulsar.Client("pulsar://localhost:6650")
producer = client.create_producer("persistent://public/default/orders")
producer.send(b'{"id": 1}', partition_key="user-42")

consumer = client.subscribe("persistent://public/default/orders", "billing",
                            consumer_type=pulsar.ConsumerType.Shared)
msg = consumer.receive(timeout_millis=5000)
print(msg.data())
consumer.acknowledge(msg)
client.close()
```
관리 CLI:
```bash
bin/pulsar-admin tenants create shop
bin/pulsar-admin namespaces create shop/orders
bin/pulsar-admin namespaces set-retention shop/orders --size 10G --time 7d
```

## 언어별 클라이언트
공식: Java, Go, Python, C++, Node.js, C#(DotPulsar). Rust 는 커뮤니티 클라이언트, 그 외 WebSocket API. Kafka 프로토콜 호환 계층(KoP 등)을 쓰면 Kafka 클라이언트로도 접속할 수 있다.

## 자주 쓰는 패턴
- **한 토픽, 두 소비 방식**: 분석 파이프라인은 Exclusive/Failover 로 순서대로, 작업 처리기는 Shared 로 병렬 처리.
- **Key_Shared**: 사용자별 순서는 지키면서 소비자를 파티션 수와 무관하게 늘린다.
- **지연 전달**: `deliver_after`/`deliver_at` 으로 예약 메시지를 보낸다. 지원 구독 타입은 문서에서 확인한다.
- **멀티테넌트 플랫폼**: 팀마다 테넌트를 주고 네임스페이스 정책으로 할당량·보관 기간을 분리.
- **티어드 스토리지로 장기 보관**: 최근 데이터는 bookie, 과거 데이터는 객체 저장소에 두고 같은 API 로 재생.

## 언제 쓰나 / 피할 때
- 쓸 때: 큐와 스트림을 한 시스템으로 통합, 수많은 토픽·테넌트를 운영하는 플랫폼 팀, 지역 간 복제가 필수일 때.
- 피할 때(대안): 구성 요소(브로커·BookKeeper·메타데이터 저장소)가 많아 운영 난도가 높다. 생태계·인력 풀이 중요하면 [Apache Kafka](/develop-wiki/backend/messaging/apache-kafka/), 단순 작업 큐는 [RabbitMQ](/develop-wiki/backend/messaging/rabbitmq/), 가벼운 메시징은 [NATS](/develop-wiki/backend/messaging/nats/).

## 공식 문서
- [문서](https://pulsar.apache.org/docs/) · [Docker 로 시작하기](https://pulsar.apache.org/docs/next/getting-started-docker/) · [메시징 개념](https://pulsar.apache.org/docs/next/concepts-messaging/) · [클라이언트 라이브러리](https://pulsar.apache.org/docs/next/client-libraries/) · [릴리스](https://github.com/apache/pulsar/releases)
