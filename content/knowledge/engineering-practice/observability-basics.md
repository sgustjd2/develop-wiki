---
title: 관측 가능성 기본 (로그·메트릭·트레이스)
aka: [Observability, Telemetry, Logs Metrics Traces, Four Golden Signals, OpenTelemetry]
category: engineering-practice
level: beginner
summary: 시스템이 내보내는 로그·메트릭·트레이스로 내부를 몰라도 "지금 무엇이 왜 이상한가"를 물어볼 수 있게 하는 능력과, 그 신호를 설계·연결하는 기본기.
tags: [sre, monitoring, opentelemetry, tracing, alerting]
related: [engineering-practice/incident-response-postmortem, engineering-practice/ci-cd-pipeline, architecture/event-driven]
sources:
  - https://opentelemetry.io/docs/concepts/observability-primer/
  - https://opentelemetry.io/docs/concepts/signals/
  - https://sre.google/sre-book/monitoring-distributed-systems/
  - https://www.w3.org/TR/trace-context/
updatedAt: 2026-11-18
---

## 문제

- "결제가 느리다"는 신고가 들어왔는데 서비스 10개 중 어디서 느린지 모른다.
- 로그는 많지만 요청 하나의 흐름을 서비스 경계 너머로 이어 볼 수 없다.
- 평균 응답 시간은 100ms 로 정상인데, 1% 사용자는 5초씩 기다린다.
- 알림이 너무 많아 진짜 장애 알림이 묻힌다.

## 해법

### 세 가지 신호

| 신호 | 무엇 | 강점 | 약점 |
| --- | --- | --- | --- |
| 로그 | 타임스탬프가 붙은 개별 이벤트 기록 | 상세한 맥락, 예외 원인 | 양이 많고 비쌈, 요청 간 연결이 어려움 |
| 메트릭 | 시간에 따라 집계한 숫자 (요청 수, 오류율, CPU) | 저렴, 추세·알림에 적합 | 개별 요청의 원인은 모름 |
| 트레이스 | 요청 하나가 여러 서비스를 거친 경로. 스팬(작업 단위)의 트리 | 어디서 시간이 걸렸는지 보임 | 계측·저장 비용, 샘플링 필요 |

- **스팬**: 이름, 시작·종료 시각, 속성(HTTP 메서드, 경로, 상태 코드), 이벤트를 가진 작업 단위. 루트 스팬 아래 자식 스팬이 붙는다.
- **컨텍스트 전파**: 서비스 간 호출에 트레이스 ID 를 실어 보내야 스팬이 이어진다. HTTP 에서는 W3C Trace Context 의 `traceparent` 헤더(`버전-트레이스ID(32hex)-부모ID(16hex)-플래그`)가 표준이다.
- **로그에 트레이스 ID 를 넣는다.** 메트릭으로 이상을 감지 → 트레이스로 위치 파악 → 로그로 원인 확인의 흐름이 가능해진다.

```ts
// 구조화 로그 + 트레이스 상관관계 (개념 예시, 라이브러리 API 아님)
function log(level: 'info' | 'error', msg: string, ctx: { traceId: string; spanId: string }, attrs = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...ctx, ...attrs }));
}
log('error', 'payment declined', { traceId: '4bf92f35...', spanId: '00f067aa...' }, { orderId: 'o-42', code: 'card_expired' });
```

### 무엇을 잴까: 네 가지 골든 시그널 (Google SRE)

1. **지연 시간** — 성공과 실패를 나눠 잰다(빠른 실패가 평균을 왜곡함).
2. **트래픽** — 초당 요청 수 등 수요.
3. **오류** — 명시적(500), 암묵적(200 인데 잘못된 내용), 정책상(응답이 1초를 넘으면 실패).
4. **포화도** — 얼마나 "꽉 찼나". 100% 전에 성능이 떨어지므로 목표 사용률을 정한다.

평균 대신 **히스토그램**(지수적 버킷)으로 수집해 p99 같은 꼬리 지연을 본다.

### 알림 원칙

- 알림(페이지)은 **긴급하고, 조치 가능하고, 사람의 판단이 필요한** 것만. 정해진 대응만 필요하면 자동화한다.
- **원인보다 증상**에 알린다. "DB 연결 거부"보다 "사용자 오류율 상승". 원인 기반 알림은 확실하고 임박한 문제에만.
- SLI(사용자 관점의 측정값)와 SLO(목표치)를 정하고, SLO 위반 위험에 알린다.

## 언제 쓰나

- 서비스가 둘 이상으로 나뉘는 순간 트레이스와 컨텍스트 전파가 필요해진다.
- 단일 앱이라도 메트릭 + 구조화 로그는 기본값이다.
- 벤더 중립 계측에는 OpenTelemetry(API·SDK·Collector)를 쓰고, 저장·시각화 백엔드는 따로 고른다.

## 주의 (비용)

- 텔레메트리는 공짜가 아니다. 로그 양, 메트릭의 **카디널리티**(사용자 ID 를 라벨로 넣으면 시계열이 폭발), 트레이스 저장량이 비용을 키운다. 샘플링과 보존 기간을 설계한다.
- 로그에 개인정보·비밀값이 섞이지 않게 한다.
- "대시보드가 많다 = 관측 가능하다"가 아니다. 장애 때 실제로 던질 질문에 답할 수 있는지로 판단하고, 장애 후 [포스트모템](/develop-wiki/knowledge/engineering-practice/incident-response-postmortem/)에서 부족했던 신호를 보강한다.
- 비동기 메시징 구간은 트레이스가 끊기기 쉽다. 메시지 헤더에도 컨텍스트를 실어 보낸다.
