---
title: Envoy zone-aware routing·패닉 임계 (Envoy Zone-Aware Routing and Panic Threshold)
aka: []
category: performance
level: intermediate
summary: 클러스터 내 가용 호스트 비율이 낮아질 때 Envoy가 건강 상태를 무시하고 트래픽을 분산하는 기능으로, 호스트 장애의 연쇄
  발생을 방지하기 위해 사용한다.
tags:
  - envoy
  - panic-threshold
  - load-balancing
related: []
sources:
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
  - https://www.envoyproxy.io/docs/envoy/v1.12.4/intro/arch_overview/upstream/load_balancing/panic_threshold
updatedAt: 2026-11-22
---

> ⚠ 로컬 모델(gemma4:26b-a4b-64k) 자동 초안 — 2026-11-22 주간 조사. 사이트에 공개되지 않았다. 공개 전 Claude Code `review-drafts` 로 원문 대조·보강이 필요하다.
> 주제(backlog): Envoy zone-aware routing·패닉 임계 (Envoy Zone-Aware Routing and Panic Threshold)

## 패닉 임계값(Panic Threshold)의 정의

패닉 임계값(Panic Threshold)은 클러스터 내 가용 호스트의 비율이 너무 낮아질 경우, Envoy가 건강 상태를 무시하고 모든 호스트 또는 호스트가 없는 상태로 부하 분산을 수행하는 것을 의미한다. 이는 부하 증가 시 호스트 장애가 클러스터 전체로 연쇄적으로 발생하는 상황을 방지하기 위해 사용된다. (근거 1, 3)

## 패닉 상태의 동작 모드

패닉 상태일 때 Envoy는 두 가지 모드 중 하나를 선택할 수 있다. 트래픽을 모든 호스트로 보내거나, 트래픽을 보내지 않는(항상 실패하는) 방식이다. 패닉 상황에서 트래픽을 실패하도록 설정하면, 모든 호스트가 비정상으로 판명되기 전에 상위 서비스에 가해지는 부하를 줄여 서비스가 과부하되는 것을 방지할 수 있다. (근거 4, 5)

## 가용성 및 우선순위에 따른 동작

모든 우선순위 레벨의 정규화된 총 가용성이 100%라면 Envoy는 패닉 임계값을 무시하고 우선순위에 따라 트래픽을 분산한다. 반면, 정규화된 총 가용성이 100% 미만으로 떨어지면 Envoy는 모든 우선순위 레벨에 걸쳐 가용 호스트가 충분하지 않다고 가정한다. 이 경우 특정 우선순위 레벨의 가용성이 패닉 임계값보다 낮다면, 해당 레벨의 가용성 여부와 상관없이 모든 호스트 또는 호스트가 없는 상태로 트래픽이 전달된다. (근거 6, 10)

## 설정 방법

패닉 임계값의 기본 설정값은 50%이며, 런타임이나 클러스터 설정을 통해 변경할 수 있다. 패닉 임계값은 각 우선순위(per-priority)별로 설정할 수 있으며, 패닉 임계값을 0%로 설정하면 패닉 모드를 비활성화할 수 있다. (근거 2, 7, 8, 9)

## 검토용 근거 (공개 전 삭제)

1. 패닉 임계값은 클러스터 내 가용 호스트의 비율이 너무 낮아질 경우, Envoy가 건강 상태를 무시하고 모든 호스트 또는 호스트가 없는 상태로 부하 분산을 수행하는 것을 의미합니다.
   - "However, if the percentage of available hosts in the cluster becomes too low, Envoy will disregard health status and balance either amongst all hosts or no hosts. This is known as the panic threshold ." — https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
2. 패닉 임계값의 기본 설정값은 50%입니다.
   - "The default panic threshold is 50%." — https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
3. 패닉 임계값은 부하 증가 시 호스트 장애가 클러스터 전체로 연쇄적으로 발생하는 상황을 방지하기 위해 사용됩니다.
   - "The panic threshold is used to avoid a situation in which host failures cascade throughout the cluster as load increases." — https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
4. 패닉 상태일 때 Envoy는 모든 호스트로 트래픽을 보내거나, 트래픽을 보내지 않는 두 가지 모드 중 하나를 선택할 수 있습니다.
   - "There are two modes Envoy can choose from when in a panic state: traffic will either be sent to all hosts, or will be sent to no hosts (and therefore will always fail)." — https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
5. 패닉 상황에서 트래픽을 실패하도록 설정하면, 모든 호스트가 비정상으로 판명되기 전에 상위 서비스에 가해지는 부하를 줄여 서비스가 과부하되는 것을 방지할 수 있습니다.
   - "Choosing to fail traffic during panic scenarios can help avoid overwhelming potentially failing upstream services, as it will reduce the load on the upstream service before all hosts have been determined to be unhealthy." — https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
6. 모든 우선순위 레벨의 정규화된 총 가용성이 100%라면 Envoy는 패닉 임계값을 무시하고 우선순위에 따라 트래픽을 분산합니다.
   - "In mathematical terms, if normalized total availability across all priority levels is 100%, Envoy disregards panic thresholds and continues to distribute traffic load across priorities according to the algorithm described here ." — https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
7. 패닉 임계값을 0%로 설정하면 패닉 모드를 비활성화할 수 있습니다.
   - "Panic mode can be disabled by setting the panic threshold to 0%." — https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
8. 패닉 임계값은 각 우선순위(per-priority)별로 설정할 수 있습니다.
   - "Note that panic thresholds can be configured per-priority ." — https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
9. 패닉 임계값의 기본값은 50%이며, 런타임이나 클러스터 설정을 통해 변경할 수 있다.
   - "The default panic threshold is 50%. This is configurable via runtime as well as in the cluster configuration ." — https://www.envoyproxy.io/docs/envoy/v1.12.4/intro/arch_overview/upstream/load_balancing/panic_threshold
10. 정규화된 총 가용성이 100% 미만으로 떨어지면, 특정 우선순위 레벨의 가용성이 패닉 임계값보다 낮을 경우 해당 레벨의 가용성 여부와 상관없이 모든 호스트 또는 호스트가 없는 상태로 트래픽이 전달된다.
   - "However, when normalized total availability drops below 100%, Envoy assumes that there are not enough available hosts across all priority levels. It continues to distribute traffic load across priorities, but if a given priority level’s availability is below the panic threshold, traffic will go to all (or no) hosts in that priority level regardless of their availability." — https://www.envoyproxy.io/docs/envoy/v1.12.4/intro/arch_overview/upstream/load_balancing/panic_threshold
