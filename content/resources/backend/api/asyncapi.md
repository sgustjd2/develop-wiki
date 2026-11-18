---
name: AsyncAPI
url: https://www.asyncapi.com
docs: https://www.asyncapi.com/docs
repo: https://github.com/asyncapi/spec
stars: 5340
domain: backend
category: api
description: Kafka, MQTT, AMQP, WebSocket 같은 메시지 기반 API 의 채널·메시지·작업을 기술하는 명세. 이벤트 드리븐 시스템의 문서화와 코드 생성에 쓴다.
pricing: oss
tags: [event-driven, api-spec, kafka, mqtt, websocket]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
AsyncAPI 는 Linux Foundation 산하 프로젝트로, 요청·응답 HTTP 를 다루는 [OpenAPI](/develop-wiki/backend/api/openapi/) 의 비동기 메시징 버전이라 할 수 있다. 어떤 **서버**(브로커)의 어떤 **채널**(토픽·큐)로 어떤 **메시지**(페이로드 스키마, 헤더)가 오가는지, 애플리케이션이 그 채널에 보내는지(`send`) 받는지(`receive`)를 YAML/JSON 으로 기술한다. 프로토콜별 세부 설정은 바인딩(Kafka, AMQP, MQTT, WebSocket, NATS 등)으로 표현한다.

**버전(2026-11)**: 최신은 **3.1.0**(2026-01-31). 3.0(2023-12)에서 채널과 작업(operations)을 분리하고 요청·응답 패턴을 지원하도록 크게 바뀌었고, 3.1 은 하위 호환 마이너 업데이트(ROS 2 바인딩 추가 등)다. 2.x 문서는 공식 변환기로 3.x 로 옮길 수 있다.

## 설치
```bash
npm install -g @asyncapi/cli     # 2026-11 기준 6.x
asyncapi validate asyncapi.yaml
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `servers` | 브로커 주소와 프로토콜(`kafka`, `mqtt`, `amqp`, `ws` 등) |
| `channels` | 메시지가 흐르는 주소(토픽·큐·경로)와 그 채널의 메시지 목록 |
| `operations` | 이 애플리케이션이 채널에 `send` 또는 `receive` 하는 동작 |
| `messages` | 페이로드 스키마(JSON Schema, Avro 등)와 헤더, 상관관계 ID |
| `components` | 재사용 정의. `$ref` 로 참조 |
| bindings | 프로토콜별 설정(Kafka 파티션 키, AMQP exchange 등) |

## 기본 사용법
```yaml
asyncapi: 3.1.0
info: { title: Order Service, version: 1.0.0 }
servers:
  production:
    host: broker.example.com:9092
    protocol: kafka
channels:
  orderCreated:
    address: orders.created
    messages:
      OrderCreated:
        payload:
          type: object
          required: [orderId, total]
          properties:
            orderId: { type: string }
            total: { type: number }
operations:
  publishOrderCreated:
    action: send
    channel: { $ref: '#/channels/orderCreated' }
```

## 자주 쓰는 패턴
- **문서 생성**: `asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template -o docs` 또는 AsyncAPI Studio 로 이벤트 카탈로그를 만든다.
- **코드·모델 생성**: Modelina 로 메시지 페이로드 타입(TS, Java, Go, Python, C# 등)을 생성한다.
- **CI 검증**: `asyncapi validate` 와 린트(Spectral)로 명세 오류를 PR 에서 잡는다.
- **버전 마이그레이션**: `asyncapi convert` 로 2.x 문서를 3.x 로 바꾼다.
- **스키마 레지스트리 연계**: Kafka 환경에서는 Avro·Protobuf 스키마를 레지스트리에 두고 메시지 `payload` 에서 참조한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 팀이 같은 이벤트를 발행·구독하는 이벤트 드리븐 아키텍처, WebSocket·MQTT API 를 외부에 공개할 때.
- 피할 때(대안): HTTP 요청·응답 API 만 있으면 OpenAPI, 이벤트 봉투 형식만 통일하려면 CloudEvents 명세로 충분할 수 있다.

## 공식 문서
- [문서](https://www.asyncapi.com/docs) · [3.1.0 명세](https://www.asyncapi.com/docs/reference/specification/v3.1.0) · [3.1.0 릴리스 노트](https://www.asyncapi.com/blog/release-notes-3.1.0) · [CLI](https://www.asyncapi.com/docs/tools/cli)
