---
name: Grafana Mimir
url: https://grafana.com/oss/mimir/
docs: https://grafana.com/docs/mimir/latest/
repo: https://github.com/grafana/mimir
stars: 5284
domain: backend
category: observability
description: Prometheus 메트릭을 수평 확장·멀티테넌트로 장기 저장하는 시계열 데이터베이스. 여러 Prometheus 를 remote write 로 모아 PromQL 로 조회할 때 쓴다. AGPLv3.
pricing: oss
tags: [metrics, prometheus, promql, long-term-storage, multi-tenant, lgtm]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Mimir 는 [Prometheus](/develop-wiki/backend/observability/prometheus/) 의 장기 저장소 역할을 하는 분산 시계열 DB 다. Prometheus·Grafana Alloy·OpenTelemetry Collector 가 remote write(또는 OTLP)로 보낸 메트릭을 받아 Prometheus TSDB 블록 형식으로 오브젝트 스토리지에 저장하고, PromQL 호환 API 로 조회한다. 테넌트를 `X-Scope-OrgID` 헤더로 구분하는 멀티테넌시, 구성 요소별 수평 확장, 고가용성 Prometheus 쌍의 중복 제거, 룰·알림(ruler, Alertmanager) 기능을 갖췄다. Cortex 에서 갈라져 나온 프로젝트다.

라이선스 AGPL-3.0. **3.0**(2025-10)에서 Kafka 기반 **ingest storage** 구조(쓰기·읽기 경로 분리)를 도입했고 스트리밍 방식의 **Mimir Query Engine(MQE)** 이 기본 쿼리 엔진이 됐다. 3.0 에서도 기존 classic 구조는 지원된다. 2026-11 기준 최신 릴리스는 3.2.6(2026-11-18), 3.1.x·2.17.x 도 패치가 나온다.

같은 LGTM 스택의 트레이스는 [Grafana Tempo](/develop-wiki/backend/observability/grafana-tempo/), 로그는 [Loki](/develop-wiki/backend/observability/loki/), 화면은 [Grafana](/develop-wiki/backend/observability/grafana/) 다.

## 설치
```bash
# 모놀리식 모드(모든 컴포넌트를 한 프로세스로): 시험·소규모
docker run -p 9009:9009 -v $PWD/mimir.yaml:/etc/mimir.yaml \
  grafana/mimir:3.2.6 -config.file=/etc/mimir.yaml -target=all

# Kubernetes: 공식 Helm 차트
helm repo add grafana https://grafana.github.io/helm-charts
helm install mimir grafana/mimir-distributed -n mimir --create-namespace
```
`mimir.yaml` 에는 `server.http_listen_port`, 오브젝트 스토리지(`common.storage`), `blocks_storage` 경로 등을 넣는다. 공식 "Get started" 의 예제 설정에서 시작한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Distributor | remote write 수신, 검증·레이트 리밋 후 해시 링에 따라 분배 |
| Ingester | 최근 샘플을 메모리·WAL 에 두고 2시간 단위 블록으로 업로드 |
| Ingest storage (3.x) | Kafka 를 쓰기 버퍼로 두어 쓰기와 읽기 부하를 분리 |
| Querier / Query-frontend | PromQL 실행, 쿼리 분할·캐시·샤딩 |
| Store-gateway | 오브젝트 스토리지의 오래된 블록을 조회 |
| Compactor | 블록 병합·중복 제거·보존 기간 삭제 |
| Ruler / Alertmanager | 레코딩·알림 룰 평가, 테넌트별 알림 라우팅 |
| Tenant | `X-Scope-OrgID` 로 구분되는 독립 데이터 공간, 테넌트별 한도(limits) |

## 기본 사용법
Prometheus 에서 Mimir 로 보내기:
```yaml
remote_write:
  - url: http://mimir:9009/api/v1/push
    headers:
      X-Scope-OrgID: team-a
```
조회는 Grafana 에 Prometheus 데이터소스를 추가하고 URL 을 `http://mimir:9009/prometheus`, 헤더 `X-Scope-OrgID: team-a` 로 설정한 뒤 일반 PromQL 을 쓴다.
```bash
# mimirtool: 룰 업로드, 대시보드·룰이 쓰는 메트릭 분석
mimirtool rules load rules.yaml --address=http://mimir:9009 --id=team-a
mimirtool analyze grafana --address=http://grafana:3000 --key=$GRAFANA_TOKEN
```

## 자주 쓰는 패턴
- **여러 Prometheus 통합**: 클러스터마다 Prometheus(또는 Alloy agent)를 두고 Mimir 하나로 모아 전역 쿼리·장기 보존을 제공한다.
- **HA 쌍 중복 제거**: 같은 대상을 수집하는 Prometheus 두 대에 `cluster`·`__replica__` 레이블을 붙이고 HA tracker 로 한쪽만 저장한다.
- **카디널리티 관리**: 테넌트별 `max_global_series_per_user` 등 한도를 걸고, 카디널리티 API·mimirtool 로 불필요한 레이블을 찾는다.
- **운영 모니터링**: 공식 mimir-mixin 대시보드·알림을 설치해 Mimir 자체를 감시한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 단일 Prometheus 의 저장 용량·보존 기간·가용성 한계를 넘었을 때, 여러 팀·클러스터 메트릭을 테넌트로 나눠 한곳에 모을 때.
- 피할 때(대안): 단일 클러스터·짧은 보존이면 [Prometheus](/develop-wiki/backend/observability/prometheus/) 단독으로 충분하다. 운영이 더 단순한 장기 저장소가 필요하면 Thanos 나 VictoriaMetrics 를 비교한다. AGPL 이 맞지 않으면 매니지드 서비스를 검토한다.
- 주의: 마이크로서비스 모드는 구성 요소가 많아 운영 난도가 높다. 3.x 로 올릴 때 제거된 플래그와 기본 엔진 변경(MQE)을 릴리스 노트로 확인한다.

## 공식 문서
- [문서 홈](https://grafana.com/docs/mimir/latest/) · [제품 소개](https://grafana.com/oss/mimir/) · [GitHub 릴리스](https://github.com/grafana/mimir/releases)
