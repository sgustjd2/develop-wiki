---
name: Apache Kafka
url: https://kafka.apache.org
docs: https://kafka.apache.org/documentation/
repo: https://github.com/apache/kafka
stars: 34316
domain: backend
category: messaging
description: 파티션으로 나뉜 로그에 이벤트를 쌓고 여러 소비자가 각자 위치에서 읽는 분산 이벤트 스트리밍 플랫폼. 대용량 이벤트 파이프라인, CDC, 서비스 간 비동기 통합에 쓴다.
pricing: oss
tags: [event-streaming, pubsub, log, kraft, queue]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Apache Kafka 는 메시지를 지우지 않고 **추가 전용 로그(append-only log)** 로 디스크에 보관하고, 소비자가 자신이 읽은 위치(offset)를 관리하는 분산 이벤트 스트리밍 플랫폼이다. 토픽을 파티션으로 나눠 여러 브로커에 분산·복제하므로 처리량을 수평으로 늘릴 수 있고, 같은 데이터를 여러 소비자 그룹이 서로 독립적으로 다시 읽을 수 있다.

Kafka 4.0 부터 ZooKeeper 없이 내장 합의 프로토콜 **KRaft** 로만 동작한다. 4.2 에서 큐 방식 소비를 하는 **Share Group(Queues for Kafka, KIP-932)** 이 production-ready 로 표시됐다. 2026-11 기준 최신 릴리스는 **4.4.0**(2026-10-22), 4.3 계열은 4.3.2 가 나왔다. Apache-2.0 라이선스.

전통적인 메시지 브로커(RabbitMQ)가 "전달 후 삭제"라면 Kafka 는 "보관하고 재생"하는 쪽이다.

## 설치
Java 17 이상이 필요하다. 로컬 단일 노드(KRaft) 실행:
```bash
tar -xzf kafka_2.13-4.4.0.tgz && cd kafka_2.13-4.4.0
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"
bin/kafka-storage.sh format --standalone -t $KAFKA_CLUSTER_ID -c config/server.properties
bin/kafka-server-start.sh config/server.properties
```
Docker 공식 이미지(GraalVM 네이티브 이미지 `apache/kafka-native` 도 있다):
```bash
docker run -p 9092:9092 apache/kafka:4.4.0
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Topic / Partition | 이벤트의 논리적 이름과, 순서가 보장되는 물리적 분할 단위. 순서는 파티션 안에서만 보장 |
| Offset | 파티션 내 레코드의 일련번호. 소비자 그룹이 커밋해 진행 위치를 기록 |
| Key | 같은 키는 같은 파티션으로 간다(기본 파티셔너). 엔티티별 순서 보장에 사용 |
| Broker / Controller | 데이터를 저장·서빙하는 노드와, KRaft 로 메타데이터를 관리하는 노드 |
| Replication | 파티션마다 leader 와 follower 복제본. `min.insync.replicas` 와 `acks=all` 로 내구성 확보 |
| Consumer Group | 그룹 안에서 파티션을 나눠 갖는다. 병렬도의 상한은 파티션 수 |
| Share Group | 4.2 부터 production-ready. 레코드 단위로 분배·확인(ack)하는 큐 방식 소비. 파티션 수보다 많은 소비자 가능, 순서 보장 없음 |
| Retention / Compaction | 시간·크기 기준 보관, 또는 키별 최신 값만 남기는 compacted 토픽 |
| Kafka Connect / Streams | 외부 시스템 연동 프레임워크와, Java 스트림 처리 라이브러리 |

## 기본 사용법
CLI 로 토픽을 만들고 메시지를 주고받는다.
```bash
bin/kafka-topics.sh --create --topic orders --partitions 3 --bootstrap-server localhost:9092
bin/kafka-console-producer.sh --topic orders --bootstrap-server localhost:9092
bin/kafka-console-consumer.sh --topic orders --from-beginning --bootstrap-server localhost:9092
```
Python(`confluent-kafka`, librdkafka 기반) 프로듀서·컨슈머:
```python
from confluent_kafka import Producer, Consumer

p = Producer({"bootstrap.servers": "localhost:9092", "acks": "all"})
p.produce("orders", key="user-42", value=b'{"total": 3000}')
p.flush()

c = Consumer({"bootstrap.servers": "localhost:9092",
              "group.id": "billing", "auto.offset.reset": "earliest"})
c.subscribe(["orders"])
msg = c.poll(5.0)
if msg and not msg.error():
    print(msg.key(), msg.value())
c.close()
```

## 언어별 클라이언트
| 언어 | 대표 클라이언트 |
| --- | --- |
| Java/Kotlin | 공식 `kafka-clients`, Kafka Streams |
| Python | `confluent-kafka` |
| Go | `confluent-kafka-go`, `franz-go` |
| TypeScript/JS | `@confluentinc/kafka-javascript` (KafkaJS 는 2023년 이후 새 릴리스 없음) |
| C# | `Confluent.Kafka` |
| Rust | `rdkafka` |

## 자주 쓰는 패턴
- **키 기반 순서 보장**: 주문 id·사용자 id 를 키로 써서 같은 엔티티 이벤트가 한 파티션에 순서대로 쌓이게 한다.
- **멱등 프로듀서 + `acks=all`**: 재시도 중복을 막고 복제 확인 후에만 성공으로 본다. 트랜잭션 API 로 읽기-처리-쓰기를 원자적으로 묶을 수 있다.
- **Transactional Outbox / CDC**: DB 변경을 Debezium 같은 Kafka Connect 소스로 토픽에 흘려 서비스 간 데이터 동기화.
- **Compacted 토픽**: 설정·상태의 최신 값만 유지하는 테이블처럼 사용.
- **Dead letter 토픽**: 처리 실패 레코드를 별도 토픽에 옮겨 소비 지연을 막는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 초당 대량 이벤트, 여러 팀·시스템이 같은 이벤트를 재생해야 할 때, 이벤트 소싱·CDC·스트림 처리 파이프라인.
- 피할 때(대안): 작업 큐 하나가 필요한 소규모 서비스는 운영 부담이 크다 → [RabbitMQ](/develop-wiki/backend/messaging/rabbitmq/), [BullMQ](/develop-wiki/backend/messaging/bullmq/), [Celery](/develop-wiki/backend/messaging/celery/). 가벼운 pub/sub·요청-응답은 [NATS](/develop-wiki/backend/messaging/nats/). 멀티테넌시·지역 복제가 핵심이면 [Apache Pulsar](/develop-wiki/backend/messaging/apache-pulsar/). 이미 [Redis](/develop-wiki/backend/database/redis/)(또는 Valkey)를 운영 중이고 규모가 작으면 Redis Streams 로 충분할 수 있다.

## 공식 문서
- [문서](https://kafka.apache.org/documentation/) · [Quickstart](https://kafka.apache.org/quickstart) · [4.2 업그레이드 노트(Share Group)](https://kafka.apache.org/42/getting-started/upgrade/) · [릴리스 블로그](https://kafka.apache.org/blog) · [다운로드](https://kafka.apache.org/downloads)
