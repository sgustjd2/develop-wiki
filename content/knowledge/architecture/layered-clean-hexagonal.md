---
title: 레이어드 vs 클린 vs 헥사고날
aka: [Layered vs Clean vs Hexagonal Architecture, Onion Architecture]
category: architecture
group: app-structure
level: intermediate
summary: 애플리케이션 내부 구조를 나누는 세 방식의 의존 방향·경계·비용을 비교한다. 핵심 차이는 도메인이 DB 에 의존하느냐, DB 가 도메인에 의존하느냐다.
tags: [comparison, ddd, dip, layering]
related: [architecture/hexagonal, principles/solid, principles/coupling-and-cohesion, architecture/cqrs]
sources:
  - https://martinfowler.com/bliki/PresentationDomainDataLayering.html
  - https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
  - https://alistair.cockburn.us/hexagonal-architecture/
updatedAt: 2026-11-18
---

세 가지 모두 "관심사를 층으로 나눈다"는 같은 출발점을 가진다. 차이는 **의존 화살표가 어디를 향하느냐**와 **경계를 얼마나 명시적으로 긋느냐**다.

## 한눈에 보기

```
레이어드          헥사고날                    클린
┌─────────┐       ┌──────────────┐            Frameworks & Drivers
│표현(UI) │       │  어댑터(HTTP)│               Interface Adapters
├─────────┤       │   ↓ 포트     │                  Use Cases
│ 도메인  │       │  ┌──────┐    │                   Entities
├─────────┤       │  │도메인│    │            (바깥 원 → 안쪽 원으로만 의존)
│ 데이터  │       │  └──────┘    │
└─────────┘       │   ↑ 포트     │
 위 → 아래 의존   │  어댑터(DB)  │
                  └──────────────┘
                   바깥 → 안쪽 의존
```

## 비교

| | 레이어드 | 헥사고날 (포트와 어댑터) | 클린 |
| --- | --- | --- | --- |
| 제안 | 오래된 관행, Fowler 가 presentation-domain-data 로 정리 | Alistair Cockburn (2005) | Robert C. Martin (2012) |
| 구조 | 표현 → 도메인 → 데이터 | 도메인 코어 + 포트(인터페이스) + 어댑터 | 엔티티 / 유스케이스 / 인터페이스 어댑터 / 프레임워크 동심원 |
| 의존 방향 | 위에서 아래로. **도메인이 데이터 계층에 의존** | 바깥(어댑터) → 안(코어) | 바깥 원 → 안쪽 원 (Dependency Rule) |
| DB 의 위치 | 맨 아래 "기반" | 여러 어댑터 중 하나 | 가장 바깥 원의 세부 사항 |
| 경계 장치 | 계층 간 직접 호출 | 코어가 정의한 포트 인터페이스 | 유스케이스의 입력·출력 포트, 경계용 단순 DTO |
| 안쪽 층 구분 | 도메인 하나 | 코어 내부 구조는 정하지 않음 | 엔티티(전사 규칙)와 유스케이스(앱 규칙)를 분리 |
| 파일·인터페이스 수 | 적음 | 중간 | 많음 |
| 잘 맞는 곳 | CRUD 위주, 소규모 앱 | 외부 연동이 많고 도메인 규칙이 있는 서비스 | 도메인이 크고 수명이 긴 시스템 |

## 핵심 차이: 의존 역전

```ts
// 레이어드: 도메인 서비스가 구체 저장소를 직접 안다
import { PgOrderRepository } from '../data/pg-order-repository';
class OrderService { repo = new PgOrderRepository(); }

// 헥사고날·클린: 도메인이 포트를 정의하고, 바깥이 구현한다
export interface OrderRepository { save(o: Order): Promise<void>; } // 코어 소유
class PlaceOrder { constructor(private repo: OrderRepository) {} }  // 유스케이스
class PgOrderRepository implements OrderRepository { /* 어댑터 */ }
```

레이어드에 저장소 인터페이스를 도메인 쪽에 두는 순간(Fowler 가 말한 "mapper 를 사이에 두는" 변형) 사실상 헥사고날이 된다. 셋은 별개 진영이라기보다 **의존 역전을 얼마나 엄격하게 적용하느냐의 스펙트럼**이다. 클린 아키텍처 원문도 헥사고날·어니언을 같은 목표의 변형으로 묶는다.

## 언제 쓰나

- **레이어드**: 비즈니스 규칙이 얇고 DB 스키마가 곧 모델인 서비스. 팀이 작고 빨리 내야 할 때.
- **헥사고날**: DB·메시지 브로커·외부 API 를 갈아끼우거나, 코어를 인메모리 어댑터로 빠르게 테스트하고 싶을 때.
- **클린**: 헥사고날에 더해 유스케이스 단위로 애플리케이션 규칙을 명시하고 싶을 때. 여러 전달 수단(HTTP, CLI, 배치)이 같은 유스케이스를 공유할 때.

## 주의

- 이름보다 **의존 방향**을 지키는 것이 본질이다. 폴더를 `domain/`, `adapters/` 로 나눠도 도메인이 ORM 엔티티를 import 하면 레이어드와 같다.
- 클린·헥사고날을 작은 CRUD 에 적용하면 인터페이스·DTO·매퍼만 늘고 실익이 없다.
- Fowler 는 presentation-domain-data 를 **큰 시스템의 최상위 분할로 쓰지 말라**고 권한다. 최상위는 기능(주문, 결제) 모듈로 나누고, 각 모듈 안에서 층을 나눈다. 팀도 층별이 아니라 기능별로 꾸린다.
- 경계를 넘는 데이터를 엔티티 그대로 넘기면 바깥 형식이 안으로 새어 들어온다. 경계에서는 단순한 DTO 로 변환한다.
