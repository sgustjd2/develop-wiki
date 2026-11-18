---
title: 프록시 패턴
aka: [Proxy Pattern, Surrogate]
category: design-patterns
group: structural
level: intermediate
summary: 실제 객체와 같은 인터페이스를 가진 대리 객체를 두고, 호출 전후에 지연 생성·접근 제어·캐싱·원격 호출 같은 처리를 끼워 넣는 구조 패턴.
tags: [gof, oop, lazy-loading, caching, access-control]
related: [design-patterns/decorator, design-patterns/adapter, design-patterns/facade, principles/composition-over-inheritance]
sources:
  - https://refactoring.guru/design-patterns/proxy
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

리포트 생성기는 초기화 때 큰 템플릿과 폰트를 메모리에 올린다. 대부분의 요청은 리포트를 안 쓰는데도 앱 시작 때마다 비용을 낸다. 호출부마다 "없으면 만들기" 코드를 넣으면 중복되고, 클래스가 외부 라이브러리라 내부를 고칠 수도 없다.

## 해법

실제 객체(subject)와 **같은 인터페이스**를 구현한 프록시를 클라이언트에게 준다. 프록시는 실제 객체를 직접 관리하며, 필요한 시점에 만들고, 호출 전후에 자기 일을 한 뒤 위임한다. 클라이언트는 차이를 모른다.

```ts
interface ReportService {
  render(id: string): Promise<Uint8Array>;
}

class HeavyReportService implements ReportService {
  constructor() { /* 템플릿·폰트 로딩: 느림 */ }
  async render(id: string) { /* ... */ return new Uint8Array(); }
}

class ReportProxy implements ReportService {
  private real?: HeavyReportService;              // 가상 프록시: 지연 생성
  private cache = new Map<string, Uint8Array>();  // 캐싱 프록시

  constructor(private canRender: (id: string) => boolean) {} // 보호 프록시

  async render(id: string) {
    if (!this.canRender(id)) throw new Error('권한 없음');
    const hit = this.cache.get(id);
    if (hit) return hit;
    this.real ??= new HeavyReportService();
    const out = await this.real.render(id);
    this.cache.set(id, out);
    return out;
  }
}
```

### 종류

| 종류 | 하는 일 | 예 |
| --- | --- | --- |
| 가상(virtual) | 비싼 객체를 실제로 쓸 때 생성 | ORM 의 지연 로딩 연관 객체 |
| 보호(protection) | 권한이 있을 때만 위임 | 역할 검사 래퍼 |
| 원격(remote) | 다른 프로세스·서버의 객체를 로컬처럼 호출 | gRPC·RPC 클라이언트 스텁 |
| 캐싱 | 같은 요청의 결과를 재사용 | 조회 결과 캐시 래퍼 |
| 로깅 | 호출 기록 후 위임 | 감사 로그 |
| 스마트 참조 | 사용 클라이언트를 추적해 아무도 안 쓰면 해제 | 참조 카운팅 |

JavaScript 의 내장 `Proxy` 객체는 이 패턴을 언어 수준에서 지원한다(속성 접근·함수 호출 가로채기).

## 언제 쓰나

- 생성 비용이 큰 객체를 필요할 때까지 미루고 싶을 때
- 클라이언트 코드를 바꾸지 않고 접근 제어·캐시·로깅·원격 호출을 끼우고 싶을 때
- 실제 객체의 수명(생성·해제)을 클라이언트 대신 관리하고 싶을 때

## 주의

- 클래스가 늘고, 프록시가 하는 일(캐시, 원격 호출)이 호출부에서 안 보인다. 특히 **원격 프록시는 로컬 호출처럼 보이지만 느리고 실패할 수 있다** — 타임아웃·오류 처리를 숨기지 않는다.
- 캐싱 프록시는 무효화 정책이 없으면 오래된 데이터를 돌려준다.
- ORM 지연 로딩 프록시는 N+1 쿼리, 세션 종료 후 접근 오류의 원인이 되기 쉽다.
- 단순히 기능을 덧붙이는 것이 목적이고 조합을 클라이언트가 정한다면 데코레이터가 더 맞다.

## 비교

| | 프록시 | 데코레이터 | 어댑터 | 퍼사드 |
| --- | --- | --- | --- | --- |
| 인터페이스 | 실제 객체와 **같음** | 같음(확장) | **다르게 변환** | 새로운 단순 인터페이스 |
| 목적 | 접근을 **통제**(언제·누가·어디서) | 기능을 **덧붙임** | 호환되지 않는 인터페이스 연결 | 복잡한 하위 시스템 감추기 |
| 실제 객체 생성 | 보통 프록시가 직접 생성·관리 | 클라이언트가 만들어 감싸게 함 | 클라이언트가 넘겨줌 | 퍼사드가 내부에서 조립 |
| 중첩 | 보통 한 겹 | 여러 겹 조합이 일반적 | 한 겹 | 한 겹 |
