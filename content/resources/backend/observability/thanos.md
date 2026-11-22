---
name: Thanos
url: https://thanos.io
docs: https://thanos.io/tip/thanos/getting-started.md/
repo: https://github.com/thanos-io/thanos
stars: 14286
domain: backend
category: observability
description: Prometheus 를 여러 대 묶어 전역 조회하고 오브젝트 스토리지에 장기 보관하는 CNCF 인큐베이팅 프로젝트. 고가용성·다운샘플링이 필요한 메트릭 환경에서 쓴다.
pricing: oss
tags: [prometheus, metrics, long-term-storage, object-storage, cncf, high-availability]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
Thanos 는 Prometheus 위에 얹는 구성요소 모음으로, 세 가지를 해결한다. (1) 여러 Prometheus 에 흩어진 메트릭을 하나의 쿼리 API 로 조회(글로벌 뷰), (2) 블록을 S3·GCS·Azure 등 오브젝트 스토리지에 올려 장기 보관, (3) 오래된 데이터의 압축·다운샘플링과 보존 정책 적용. 쿼리 API 는 Prometheus v1 API 와 호환돼 [Grafana](/develop-wiki/backend/observability/grafana/) 데이터 소스를 그대로 쓴다.

CNCF 인큐베이팅 프로젝트(CNCF Landscape 기준), 라이선스는 Apache-2.0, 최신은 **v0.42.5**(2026-10-27)다. 같은 문제를 푸는 [Grafana Mimir](/develop-wiki/backend/observability/grafana-mimir/) 나 [VictoriaMetrics](/develop-wiki/backend/observability/victoriametrics/) 와 달리 Thanos 는 기존 Prometheus 를 유지한 채 구성요소를 덧붙이는 모델이다.

## 설치
Go 단일 바이너리이며 컨테이너 이미지로 배포된다(`quay.io/thanos/thanos`). 서브커맨드로 역할을 고른다.
```bash
docker run --rm quay.io/thanos/thanos:v0.42.5 --help
```
Kubernetes 에서는 kube-thanos·Helm 차트로 배포하는 경우가 많다.

## 핵심 개념
| 구성요소 | 역할 |
| --- | --- |
| Sidecar | Prometheus 옆에서 실행. 데이터를 질의 계층에 노출하고 블록을 버킷에 업로드 |
| Querier (`thanos query`) | Prometheus v1 API 를 구현하고 여러 소스(Sidecar, Store, Receiver)를 합쳐 조회 |
| Store Gateway | 버킷의 과거 블록을 서빙 |
| Compactor | 버킷 데이터 압축, 다운샘플링, 보존 기간 적용 |
| Receiver | Prometheus remote write 를 받아 저장·업로드 (Sidecar 를 못 쓰는 환경) |
| Ruler | Thanos 데이터 대상으로 레코딩·알림 규칙 평가 |
| Query Frontend | Querier 앞단에서 응답 캐시·일 단위 쿼리 분할 |

## 기본 사용법
Prometheus 에는 구분용 외부 레이블이 필요하다(Sidecar 는 reload 를 쓰므로 `--web.enable-lifecycle` 도 켠다).
```yaml
global:
  external_labels:
    region: eu-west
    replica: A
```
```bash
# Prometheus 옆에서
thanos sidecar \
  --tsdb.path /var/prometheus \
  --prometheus.url http://localhost:9090 \
  --objstore.config-file bucket_config.yaml \
  --http-address 0.0.0.0:19191 --grpc-address 0.0.0.0:19090

# 조회 계층
thanos query --http-address 0.0.0.0:19192 \
  --endpoint 1.2.3.4:19090 --endpoint 1.2.3.5:19090

# 과거 데이터 서빙, 압축
thanos store   --data-dir /var/thanos/store   --objstore.config-file bucket_config.yaml
thanos compact --data-dir /var/thanos/compact --objstore.config-file bucket_config.yaml
```
`bucket_config.yaml` 의 형식은 공급자(S3, GCS 등)마다 달라 공식 Object Storage 문서를 따른다.

## 자주 쓰는 패턴
- **HA 중복 제거**: 같은 대상을 긁는 Prometheus 두 대에 `replica` 레이블을 주고 Querier 에서 `--query.replica-label=replica` 로 중복 제거한다.
- **Sidecar 대신 Receiver**: 에지·멀티 테넌트 환경에서는 `remote_write` 로 Receiver 에 보낸다.
- **Compactor 는 버킷당 1개**: 같은 버킷에 여러 Compactor 를 돌리면 안 된다.
- **쿼리 가속**: Query Frontend 로 `query_range` 를 쪼개고 캐시한다.
- **Prometheus 블록 길이**: 로컬 TSDB 블록 기간(min/max block duration)을 임의로 바꾸지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 Prometheus 를 운영 중이고 여러 클러스터를 한 화면으로 보거나 오브젝트 스토리지에 장기 보관하고 싶을 때.
- 피할 때(대안): 구성요소가 많아 운영 부담이 커서 단순한 스택을 원하면 [VictoriaMetrics](/develop-wiki/backend/observability/victoriametrics/). 완전 수평 확장형 멀티테넌트 TSDB 를 원하면 Mimir.

## 공식 문서
- [시작하기](https://thanos.io/tip/thanos/getting-started.md/) · [빠른 튜토리얼](https://thanos.io/tip/thanos/quick-tutorial.md/) · [Prometheus](/develop-wiki/backend/observability/prometheus/)
