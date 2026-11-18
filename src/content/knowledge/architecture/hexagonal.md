---
title: 헥사고날 아키텍처
aka: [Hexagonal Architecture, Ports and Adapters]
category: architecture
group: app-structure
level: intermediate
summary: 도메인을 중심에 두고 외부(DB, HTTP, 메시지)와는 포트(인터페이스)와 어댑터로만 연결하는 구조.
tags: [ddd, dip, testing]
related: [principles/solid]
sources:
  - https://alistair.cockburn.us/hexagonal-architecture/
updatedAt: 2026-11-18
---

## 구조

- **도메인(코어)**: 비즈니스 규칙. 프레임워크·DB 를 모른다.
- **포트**: 코어가 정의한 인터페이스. 들어오는 포트(유스케이스)와 나가는 포트(저장소, 외부 API).
- **어댑터**: 포트를 구현하는 바깥 코드. HTTP 컨트롤러, DB 리포지토리, 메시지 컨슈머.

의존 방향은 항상 **바깥 → 안쪽**이다.

## 장점

- 코어를 인메모리 어댑터로 빠르게 테스트할 수 있다.
- DB·프레임워크 교체가 어댑터 교체로 끝난다.

## 비용

- 작은 CRUD 서비스에는 파일·인터페이스 수만 늘어난다. 도메인 규칙이 충분히 복잡할 때 선택한다.
