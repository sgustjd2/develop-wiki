---
name: Sentry
url: https://sentry.io
docs: https://docs.sentry.io
repo: https://github.com/getsentry/sentry
stars: 45890
domain: backend
category: observability
description: 애플리케이션 예외·성능 트레이스·로그를 모아 이슈 단위로 묶어 보여 주는 에러 추적 플랫폼. 서버는 FSL(2년 뒤 Apache-2.0 전환)로 셀프 호스팅 가능, SDK 는 대부분 MIT.
pricing: source-available
tags: [error-tracking, apm, crash-reporting, tracing, self-hosted, fsl]
languages: [typescript, python, go, java, kotlin, csharp, php, ruby, rust, dart, swift, elixir, cpp]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Sentry 는 애플리케이션에서 발생한 예외를 스택 트레이스·브레드크럼(직전 이벤트)·요청 정보와 함께 수집하고, 같은 원인의 에러를 **이슈**로 묶어 알림·할당·릴리스 추적을 하게 해 주는 도구다. 에러 추적에서 출발해 트레이싱(성능), 프로파일링, 세션 리플레이, 로그, 크론 모니터링까지 범위를 넓혔다. 서버 최신 릴리스는 26.11.0(캘린더 버전).

**라이선스**: 서버(`getsentry/sentry`, `self-hosted`)는 **FSL-1.1-Apache-2.0**(Functional Source License). 내부 사용·수정은 자유지만 Sentry 와 경쟁하는 상용 서비스로 제공할 수 없고, 각 버전은 2년 뒤 Apache-2.0 으로 바뀐다. OSI 오픈소스가 아니어서 이 사이트에서는 source-available 로 분류한다. 언어 SDK 는 대부분 MIT(예: sentry-python, sentry-go). 매니지드 서비스 sentry.io 는 무료 개발자 플랜과 유료 플랜이 있다.

## 설치
SaaS 를 쓰면 프로젝트를 만들고 받은 **DSN** 을 SDK 에 넣으면 끝이다. 셀프 호스팅은 Docker Compose 묶음을 쓴다(최소 4코어, RAM 16GB + 스왑 16GB, 디스크 20GB; 권장 RAM 32GB).
```bash
git clone https://github.com/getsentry/self-hosted.git && cd self-hosted
git checkout 26.11.0          # 최신 릴리스 태그
./install.sh
docker compose up --wait      # http://127.0.0.1:9000
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| DSN | 이벤트를 보낼 프로젝트 주소 겸 공개 키 |
| Event / Issue | 개별 에러 발생과, 지문(fingerprint)으로 묶인 이슈 |
| Breadcrumb | 에러 직전의 로그·HTTP 요청·클릭 등 이벤트 기록 |
| Release / Environment | 버전·환경 태그. 어떤 배포에서 회귀가 생겼는지 추적 |
| Source map / 디버그 심볼 | 압축 JS·네이티브 바이너리의 스택을 원래 코드 위치로 복원 |
| Tracing | 트랜잭션·span 기반 성능 측정. 샘플링 비율로 양을 조절 |
| Alert rule | 신규 이슈, 빈도 급증, 성능 임계값에 대한 알림 |

## 기본 사용법
Node.js — 계측 파일을 앱보다 먼저 로드한다.
```js
// instrument.mjs
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,          // 운영에서는 낮게
})
```
```bash
npm install @sentry/node
node --import ./instrument.mjs app.mjs
```
```js
try {
  await chargeOrder(order)
} catch (e) {
  Sentry.captureException(e)      // 처리한 예외도 명시적으로 보고
  throw e
}
```
Python.
```python
import sentry_sdk

sentry_sdk.init(
    dsn="https://<key>@o<orgId>.ingest.sentry.io/<projectId>",
    traces_sample_rate=0.1,
)
```
처리되지 않은 예외는 SDK 가 자동으로 보낸다. [Express](/develop-wiki/backend/web-framework/express/)·[FastAPI](/develop-wiki/backend/web-framework/fastapi/)·[Django](/develop-wiki/backend/web-framework/django/) 등은 통합(integration)이 자동 활성화되어 요청 정보와 트랜잭션이 붙는다.

## 자주 쓰는 패턴
- **릴리스·소스맵 업로드**: CI 에서 `sentry-cli` 나 번들러 플러그인으로 릴리스를 만들고 소스맵을 올려 프런트엔드 스택을 읽을 수 있게 한다.
- **샘플링 조절**: 에러는 전부, 트레이스는 `tracesSampleRate`/`traces_sampler` 로 일부만 보낸다. 무료·셀프 호스팅 용량 관리의 핵심.
- **개인정보 제어**: 기본적으로 사용자 IP·쿠키 같은 데이터는 보내지 않는다. 필요하면 옵션으로 켜고, `beforeSend` 훅으로 민감 필드를 지운다.
- **OpenTelemetry 연동**: Node SDK 는 내부적으로 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 를 쓰며, 기존 OTel 계측과 함께 쓸 수 있다.
- **이슈 연동**: GitHub·Jira·Slack 연동으로 이슈 할당과 커밋 기반 "의심 커밋" 표시.

## 언제 쓰나 / 피할 때
- 쓸 때: 웹·모바일·백엔드의 예외를 빠르게 발견하고 원인 코드·배포를 찾아야 할 때. 계측이 거의 설정 한 줄이라 작은 팀에 맞다.
- 피할 때(대안): 인프라 메트릭·대량 로그 저장소가 필요하면 [Prometheus](/develop-wiki/backend/observability/prometheus/)·[Loki](/develop-wiki/backend/observability/loki/), 순수 분산 트레이싱이면 [Jaeger](/develop-wiki/backend/observability/jaeger/). OSI 라이선스가 필수인 셀프 호스팅이면 Sentry SDK 프로토콜과 호환되는 GlitchTip 같은 대안을 검토한다. 셀프 호스팅은 구성 요소(Kafka, ClickHouse, PostgreSQL, Redis 등)가 많아 운영 부담이 크다.

## 공식 문서
- [문서 홈](https://docs.sentry.io) · [Node.js](https://docs.sentry.io/platforms/javascript/guides/node/) · [Python](https://docs.sentry.io/platforms/python/) · [셀프 호스팅](https://develop.sentry.dev/self-hosted/) · [라이선스(FSL)](https://github.com/getsentry/sentry/blob/master/LICENSE.md) · [FSL 소개](https://fsl.software/)
