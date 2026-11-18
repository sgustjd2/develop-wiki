---
name: OpenTelemetry
url: https://opentelemetry.io
repo: https://github.com/open-telemetry
docs: https://opentelemetry.io/docs/
domain: backend
category: observability
description: 트레이스·메트릭·로그 수집을 위한 벤더 중립 표준과 SDK.
pricing: oss
tags: [tracing, metrics]
languages: [typescript, python, go, java, csharp]
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OpenTelemetry(OTel)는 트레이스·메트릭·로그 같은 텔레메트리를 만들고 수집·전송하는 방법을 벤더 중립적으로 정한 CNCF 프로젝트다. 언어별 API·SDK, 라이브러리 자동 계측, 전송 프로토콜 **OTLP**, 중계 서버 **Collector**, 속성 이름 규칙인 **시맨틱 컨벤션**으로 구성된다. 애플리케이션은 OTel 로 한 번만 계측하고, 저장·조회 백엔드(Jaeger, Prometheus, Grafana 계열, 상용 APM 등)는 설정으로 바꾼다.

OTel 자체는 데이터를 저장하거나 대시보드를 그리지 않는다. 수집 표준과 파이프라인까지가 범위다.

## 설치
언어별 SDK 와 자동 계측 패키지를 설치한다.
```bash
# Node.js
npm install @opentelemetry/sdk-node @opentelemetry/api \
  @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
# Python (코드 수정 없는 자동 계측)
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap -a install      # 설치된 라이브러리에 맞는 계측 패키지 추가
```
로컬에서 데이터를 받을 Collector 는 Docker 로 띄운다(4317 = OTLP/gRPC, 4318 = OTLP/HTTP).
```bash
docker run -p 4317:4317 -p 4318:4318 otel/opentelemetry-collector:0.165.0
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Trace / Span | 요청 하나가 서비스를 지나는 경로가 trace, 그 안의 작업 단위가 span(시작·끝 시각, 속성, 상태) |
| Metric | 카운터·히스토그램·게이지 등 런타임 측정값 |
| Log | 이벤트 기록. 기존 로깅 라이브러리를 브리지해 trace 와 연결 |
| Baggage | 서비스 사이로 전파되는 키-값 컨텍스트 |
| Context propagation | `traceparent` 같은 헤더로 trace 컨텍스트를 다음 서비스에 넘긴다 |
| Resource | `service.name` 등 텔레메트리를 만든 주체의 속성 |
| 자동 계측 | HTTP 서버·클라이언트, DB 드라이버 등을 감싸 span 을 자동 생성 |
| Exporter / OTLP | SDK 가 데이터를 내보내는 출구. 표준 프로토콜은 OTLP(gRPC·HTTP) |
| Collector | receiver → processor → exporter 파이프라인으로 수신·가공·전달하는 별도 프로세스 |

언어 SDK 성숙도(공식 status 페이지 기준): JavaScript·Python 은 트레이스·메트릭 Stable, 로그 Development. Go 는 로그가 Release candidate. Java·.NET 은 세 신호 모두 Stable. Profiles 신호는 아직 개발 단계다.

## 기본 사용법
Node.js 에서 자동 계측 + OTLP 전송을 켜는 계측 파일. 애플리케이션 코드보다 **먼저** 로드해야 한다.
```ts
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

const sdk = new NodeSDK({
  serviceName: 'todo-api',
  traceExporter: new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces' }),
  instrumentations: [getNodeAutoInstrumentations()],
})
sdk.start()
```
```bash
npx tsx --import ./instrumentation.ts app.ts      # JS 는 node --import ./instrumentation.mjs app.js
```
수동 span 은 API 패키지로 만든다.
```ts
import { trace } from '@opentelemetry/api'
const tracer = trace.getTracer('todo-service')

await tracer.startActiveSpan('load-todos', async (span) => {
  span.setAttribute('todo.count', 3)
  span.end()
})
```
Python 은 코드 수정 없이 실행 명령을 감싼다.
```bash
OTEL_SERVICE_NAME=todo-api OTEL_TRACES_EXPORTER=otlp \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 opentelemetry-instrument python app.py
```

## 자주 쓰는 패턴
- **Collector 경유**: 앱은 가까운 Collector 로만 OTLP 를 보내고, 샘플링·배치·민감 속성 제거·백엔드 라우팅은 Collector 설정에서 처리한다. 백엔드를 바꿔도 앱 배포가 필요 없다.
- **환경 변수 설정**: `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_RESOURCE_ATTRIBUTES` 처럼 SDK 공통 환경 변수로 배포 환경마다 값을 바꾼다.
- **프레임워크 연동**: [Express](/develop-wiki/backend/web-framework/express/)·[FastAPI](/develop-wiki/backend/web-framework/fastapi/)·[Django](/develop-wiki/backend/web-framework/django/) 는 자동 계측으로 요청 span 이 생긴다. [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) 는 Java 에이전트나 Micrometer 연동, [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/) 는 .NET SDK 계측 패키지, [Axum](/develop-wiki/backend/web-framework/axum/) 은 `tracing` 생태계와 OTel 브리지를 쓴다.
- **로그·트레이스 연결**: 로그 브리지나 로거 설정으로 로그에 trace id·span id 를 넣어 trace 에서 로그로 이동할 수 있게 한다.
- **로컬 확인**: 콘솔 exporter(`ConsoleSpanExporter`)나 Collector 의 debug exporter 로 데이터가 나가는지 먼저 확인한 뒤 실제 백엔드를 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 서비스에 걸친 분산 트레이싱, 특정 APM 벤더에 묶이지 않는 계측, 여러 언어가 섞인 시스템에서 공통 텔레메트리 규격이 필요할 때.
- 피할 때(대안): 단일 프로세스에서 로그만 필요하면 기존 로깅 라이브러리로 충분하다. 메트릭만 필요하고 이미 Prometheus 클라이언트로 운영 중이면 그대로 두는 편이 단순하다. 로그 신호는 언어별로 아직 Development 인 SDK 가 있으니 status 페이지를 확인한다.

## 공식 문서
- [문서 홈](https://opentelemetry.io/docs/) · [신호 개념](https://opentelemetry.io/docs/concepts/signals/) · [Node.js 시작하기](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/) · [Python 자동 계측](https://opentelemetry.io/docs/zero-code/python/) · [Collector](https://opentelemetry.io/docs/collector/) · [언어별 상태](https://opentelemetry.io/status/)
