---
title: 기능 플래그
aka: [Feature Flags, Feature Toggles, Feature Switches, 피처 토글]
category: engineering-practice
level: intermediate
summary: 코드를 다시 배포하지 않고 설정으로 기능의 동작을 켜고 끄는 기법. 배포와 출시를 분리해 트렁크 기반 개발, 점진적 출시, 실험, 장애 시 차단에 쓴다.
tags: [release, continuous-delivery, experimentation, trunk-based]
related: [engineering-practice/trunk-based-vs-git-flow, engineering-practice/ci-cd-pipeline, design-patterns/strategy, engineering-practice/incident-response-postmortem]
sources:
  - https://www.sec.gov/litigation/admin/2013/34-70694.pdf
  - https://martinfowler.com/articles/feature-toggles.html
  - https://martinfowler.com/articles/continuousIntegration.html
updatedAt: 2026-11-18
---

## 문제

- 미완성 기능을 숨기려고 장수 브랜치를 쓰면 통합이 늦어진다.
- 새 기능을 모든 사용자에게 한 번에 내보내면 문제가 생겼을 때 재배포 말고는 되돌릴 방법이 없다.
- 장애 중 부하가 큰 기능을 잠시 끄고 싶어도 코드 수정과 배포가 필요하다.

## 해법

조건 분기(토글 지점)와 그 결정을 내리는 로직(토글 라우터)을 분리한다.

```ts
// 토글 라우터: 결정 로직은 한곳에
interface FlagContext { userId: string; plan: 'free' | 'pro' }
interface Flags { isEnabled(flag: string, ctx: FlagContext): boolean }

// 결정을 이름 있는 메서드로 감싼다 → 토글 지점이 플래그 이름·구현에 의존하지 않음
class Features {
  constructor(private flags: Flags) {}
  newCheckout(ctx: FlagContext) { return this.flags.isEnabled('new-checkout', ctx); }
}

// 토글 지점: 결정을 주입받는다 (inversion of decision)
class CheckoutService {
  constructor(private useNewFlow: boolean) {}
  checkout(cartId: string) {
    return this.useNewFlow ? this.newFlow(cartId) : this.legacyFlow(cartId);
  }
  private newFlow(id: string) { /* ... */ }
  private legacyFlow(id: string) { /* ... */ }
}
```

- 관례: 플래그가 **꺼지면 기존 동작, 켜지면 새 동작**.
- 분기가 여러 곳에 퍼지면 `if` 대신 [전략 패턴](/develop-wiki/knowledge/design-patterns/strategy/)으로 구현체를 갈아끼운다.

### 네 가지 종류 (Pete Hodgson 분류)

| 종류 | 목적 | 수명 | 결정의 동적성 | 주 관리자 |
| --- | --- | --- | --- | --- |
| 릴리스 토글 | 미완성 코드를 꺼진 채 배포 | 짧음 (일~주) | 정적 | 개발팀 |
| 실험 토글 | A/B·다변량 실험 | 실험 기간 | 요청마다 (사용자 코호트 고정) | 제품팀 |
| 운영(Ops) 토글 | 장애·과부하 시 기능 차단, 킬 스위치 | 대부분 짧음, 킬 스위치는 길게 | 빠른 재설정 필요 | 운영팀 |
| 권한 토글 | 프리미엄·베타·내부 사용자에게만 노출 | 수년 | 요청마다 | 제품팀 |

### 설정 위치

하드코딩 → 환경 변수 → 설정 파일 → 앱 DB(관리 화면) → 분산 설정 저장소 순으로 동적성이 커진다. 정적 플래그는 소스 관리에 두고 파이프라인으로 승격하는 편이 테스트하기 쉽다.

## 언제 쓰나

- [트렁크 기반 개발](/develop-wiki/knowledge/engineering-practice/trunk-based-vs-git-flow/)에서 미완성 기능을 메인라인에 안전하게 두고 싶을 때
- 일부 사용자에게만 먼저 내보내는 점진적 출시(카나리, 다크 런치)
- 장애 대응용 킬 스위치, 사용자 그룹별 기능 제공

## 주의 (비용)

- **플래그는 부채다.** 코드 경로가 둘로 늘고 테스트할 조합이 기하급수로 늘어난다. 모든 조합을 테스트하지 말고 운영에서 쓸 조합, 폴백(전부 끔), 필요하면 전부 켬 정도만 검증한다.
- 생성할 때 **제거 작업**을 백로그에 같이 넣는다. 만료일, 만료 후 테스트를 실패시키는 "타임 밤", 팀당 플래그 개수 상한 같은 장치를 둔다.
- Knight Capital(2012) 사고가 자주 경고로 인용된다. SEC 명령서에 따르면 수년간 쓰지 않던 Power Peg 코드를 지우지 않은 채 그 코드를 켜던 플래그를 새 기능(RLP)에 재사용했다. 수동 배포에서 서버 8대 중 1대에 새 코드가 빠져, 그 서버에서 옛 코드가 실행돼 4억 6천만 달러 이상 손실을 냈다. 다 쓴 플래그와 그 코드는 지우고, 플래그 이름은 재사용하지 않는다.
- 요청 단위 오버라이드(쿠키·헤더로 켜기)는 테스트에 편리하지만 보안 위험이 있다. 서명하거나 내부망으로 제한한다.
- 현재 플래그 상태를 조회하는 엔드포인트를 두어 운영자가 무엇이 켜져 있는지 알 수 있게 한다.
