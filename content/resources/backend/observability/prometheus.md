---
name: Prometheus
url: https://prometheus.io
docs: https://prometheus.io/docs/introduction/overview/
repo: https://github.com/prometheus/prometheus
stars: 67760
domain: backend
category: observability
description: 대상을 주기적으로 스크레이프해 시계열 메트릭을 저장하고 PromQL 로 조회·알림하는 모니터링 시스템. 서버·컨테이너·애플리케이션 메트릭 수집의 사실상 표준이다.
pricing: oss
tags: [metrics, monitoring, promql, alerting, cncf, time-series]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Prometheus 는 메트릭 수집·저장·조회·알림을 한 바이너리로 묶은 CNCF 졸업(graduated) 프로젝트다. 애플리케이션이 HTTP `/metrics` 엔드포인트로 현재 값을 노출하면 Prometheus 가 정해진 주기로 **당겨 오는(pull)** 방식이 기본이며, 데이터는 로컬 시계열 DB(TSDB)에 저장된다. 레이블(key=value)로 차원을 나누고 쿼리 언어 **PromQL** 로 집계한다. 2026-11 기준 최신 릴리스는 v3.16.0(Apache-2.0).

장기 보관·다중 클러스터 집계는 단일 Prometheus 의 범위 밖이라 Grafana Mimir·Thanos 같은 원격 저장소에 `remote_write` 로 넘기는 구성이 흔하다. 시각화는 내장 UI 보다 [Grafana](/develop-wiki/backend/observability/grafana/) 를 주로 쓴다.

## 설치
```bash
# Docker (9090 = 웹 UI·API)
docker run -p 9090:9090 -v ./prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus:v3.16.0
# 바이너리
./prometheus --config.file=prometheus.yml      # 데이터는 기본 ./data (--storage.tsdb.path)
```
호스트 메트릭은 `node_exporter`, 컨테이너는 cAdvisor, Kubernetes 는 kube-prometheus-stack(Helm 차트) 같은 exporter·배포 묶음을 함께 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Target / Job | 스크레이프할 엔드포인트와 그 묶음. `job`, `instance` 레이블이 자동으로 붙는다 |
| 메트릭 타입 | Counter(누적 증가), Gauge(오르내리는 값), Histogram(버킷 분포), Summary(클라이언트 측 분위수) |
| Native histogram | 버킷을 미리 정하지 않는 고해상도 히스토그램(v3 에서 정식 기능으로 발전 중) |
| Label | 시계열을 구분하는 차원. 값 종류가 많은 레이블(user id 등)은 시계열 폭증(high cardinality)을 부른다 |
| PromQL | instant/range vector 를 다루는 함수형 쿼리 언어 (`rate`, `sum by`, `histogram_quantile`) |
| Recording rule | 자주 쓰는 비싼 쿼리를 미리 계산해 새 시계열로 저장 |
| Alerting rule + Alertmanager | 규칙이 조건을 판정하고, 별도 프로세스인 Alertmanager 가 묶기·억제·알림 전송(Slack, PagerDuty 등)을 맡는다 |
| Service discovery | Kubernetes, Consul, EC2, 파일 등에서 타깃 목록을 자동으로 받아온다 |
| remote_write / OTLP 수신 | 다른 저장소로 내보내기. `--web.enable-otlp-receiver` 로 OTLP 메트릭을 직접 받을 수도 있다 |

## 기본 사용법
최소 설정 파일. 자기 자신과 애플리케이션 하나를 15초마다 수집한다.
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
rule_files: [alerts.yml]
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']
  - job_name: todo-api
    static_configs:
      - targets: ['todo-api:8080']     # GET /metrics 를 노출하는 서비스
```
자주 쓰는 PromQL.
```promql
# 초당 요청 수 (5분 평균), 상태 코드별
sum by (status) (rate(http_requests_total{job="todo-api"}[5m]))

# 5xx 비율
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# p95 지연 (classic histogram)
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
```
알림 규칙.
```yaml
# alerts.yml
groups:
  - name: todo-api
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 10m
        labels: { severity: page }
        annotations: { summary: "todo-api 5xx 비율 5% 초과" }
```

## 자주 쓰는 패턴
- **애플리케이션 계측**: 공식 클라이언트 라이브러리(Go, Java, Python, Ruby, Rust 등)나 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) SDK 의 Prometheus exporter 로 `/metrics` 를 노출한다. [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) 는 Micrometer + Actuator 로 `/actuator/prometheus` 를 제공한다.
- **RED/USE 대시보드**: 서비스는 Rate·Errors·Duration, 자원은 Utilization·Saturation·Errors 기준으로 패널을 만든다.
- **카운터는 항상 `rate()`**: 누적값 자체는 재시작 때 0 으로 돌아가므로 `rate`/`increase` 로 변화량을 본다.
- **레이블 카디널리티 관리**: 요청 경로는 템플릿(`/todos/:id`)으로 정규화하고 사용자·요청 id 는 레이블에 넣지 않는다.
- **장기 보관**: 로컬 보존 기간(`--storage.tsdb.retention.time`)은 짧게 두고 `remote_write` 로 Mimir·Thanos 등에 장기 저장한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 서버·컨테이너·Kubernetes·애플리케이션 메트릭 수집과 임계값 알림. 대부분의 인프라 소프트웨어가 Prometheus 형식 메트릭을 기본 제공한다.
- 피할 때(대안): 이벤트 단위 정밀 기록(과금, 감사 로그)에는 맞지 않는다(샘플링된 집계값이다). 로그는 [Loki](/develop-wiki/backend/observability/loki/), 트레이스는 [Jaeger](/develop-wiki/backend/observability/jaeger/) 등 별도 백엔드를 쓴다. 수평 확장·멀티테넌시가 처음부터 필요하면 Mimir·Thanos·VictoriaMetrics 를 검토한다.

## 공식 문서
- [개요](https://prometheus.io/docs/introduction/overview/) · [시작하기](https://prometheus.io/docs/prometheus/latest/getting_started/) · [설정 레퍼런스](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) · [PromQL 기초](https://prometheus.io/docs/prometheus/latest/querying/basics/) · [명령행 플래그](https://prometheus.io/docs/prometheus/latest/command-line/prometheus/) · [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
