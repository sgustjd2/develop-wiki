---
title: 인터프리터·컴파일러·JIT
aka: [Interpreter, Compiler, AOT, JIT, Just-in-time Compilation, Bytecode, Tiered Compilation, Deoptimization, V8]
category: cs-fundamentals
group: compiler
level: intermediate
summary: 소스 코드를 실행하는 세 방식. 미리 기계어로 바꾸거나(AOT), 한 줄씩 해석하거나(인터프리터), 실행 중 자주 쓰는 코드를 그때 컴파일한다(JIT). 시작 시간·최고 성능·예측 가능성이 갈린다.
tags: [compiler, jit, interpreter, v8, jvm, performance, javascript]
related: [cs-fundamentals/garbage-collection, cs-fundamentals/number-representation, cs-fundamentals/event-loop]
sources:
  - https://v8.dev/blog/maglev
  - https://v8.dev/blog/sparkplug
updatedAt: 2026-11-18
---

## 세 방식

| | AOT 컴파일 | 인터프리터 | JIT |
| --- | --- | --- | --- |
| 언제 번역 | 실행 전 (빌드 시) | 실행 중, 매번 | 실행 중, 뜨거운 코드만 |
| 시작 속도 | 빠름 | 빠름 | 처음엔 인터프리터, 점점 빨라짐 (워밍업) |
| 최고 성능 | 높음 | 낮음 | 높음 (런타임 정보로 추측 최적화) |
| 성능 예측 | 쉬움 | 쉬움 | 어려움 (최적화·역최적화) |
| 메모리 | 적음 | 적음 | 컴파일러·코드 캐시 몫 추가 |
| 예 | C, C++, Rust, Go, GraalVM native-image | CPython(기본), Ruby(기본), 셸 | V8(JS), HotSpot(JVM), .NET, PyPy, LuaJIT |

대부분의 현대 런타임은 섞어 쓴다. CPython 도 소스를 바이트코드로 컴파일한 뒤 해석한다. "인터프리터 언어" 는 언어가 아니라 구현의 성질이다.

```
소스 ─파싱─▶ AST ─▶ 바이트코드 ─▶ [인터프리터로 실행 + 타입·모양 기록]
                                      │ 자주 실행됨(뜨거움)
                                      ▼
                              최적화 컴파일러 ─▶ 기계어 (추측: "x 는 항상 정수")
                                      ▲              │ 추측이 틀림
                                      └── 역최적화 ◀──┘ (다시 바이트코드로)
```

## V8 의 계층 (2023 년 기준)

V8 블로그에 따르면:

| 계층 | 역할 |
| --- | --- |
| Ignition | 인터프리터. 모든 JS 는 먼저 바이트코드로 실행되고, 이때 객체 모양·타입 피드백을 모음 |
| Sparkplug (2021) | 베이스라인 JIT. 바이트코드를 거의 그대로 기계어로 빠르게 변환 |
| Maglev (Chrome M117) | 중간 단계 최적화 JIT. SSA 기반, TurboFan 보다 훨씬 빨리 컴파일하면서 Sparkplug 보다 빠른 코드 |
| TurboFan | 최상위 최적화 컴파일러. 피드백으로 추측 최적화, 최고 성능 |

중간 계층이 생긴 이유: 웹 페이지 코드 대부분은 TurboFan 이 손댈 만큼 뜨거워지지 않는다. Maglev 글은 Speedometer 같은 실제 웹앱형 벤치마크에서 이 간극을 메우는 것이 중요했다고 설명한다.

## 개발자에게 왜 중요한가

- **워밍업**: JIT 런타임(JVM, Node)은 배포 직후·스케일 아웃 직후 몇 초~몇 분 동안 느리다. 새 인스턴스에 트래픽을 점진적으로 보내거나, 벤치마크 전에 워밍업을 돌린다.
- **모양(shape)을 일정하게**: JIT 는 "이 함수에 들어오는 객체는 항상 같은 모양"이라고 추측해 최적화한다. 같은 함수에 다양한 모양을 넣으면(속성 추가 순서가 다름, 가끔 `undefined`) 다형성이 늘어 느려지고 역최적화가 반복된다.

```ts
// 생성자·리터럴에서 모든 필드를 같은 순서로 초기화 → 모양이 하나
class Point { constructor(public x: number, public y: number) {} }

// 피할 것: 나중에 조건부로 속성 추가, delete 로 속성 제거
const p: any = { x: 1 };
if (cond) p.y = 2;   // 모양이 갈라짐
delete p.x;          // 모양 변경
```

- **마이크로 벤치마크 함정**: JIT 는 결과를 안 쓰는 계산을 지워 버리거나, 상수로 접어 버린다. 실제 워크로드와 비슷한 입력, 충분한 반복, 결과 사용이 필요하다.
- **서버리스·CLI**: 시작 시간이 중요하면 AOT(Go, Rust, GraalVM native-image)가 유리하다. 대신 JIT 의 런타임 프로파일 기반 최적화를 잃는다.

## 언제 무엇을

- 긴 수명의 서버, 최고 처리량: JIT(JVM, .NET, Node) 또는 AOT 네이티브.
- 짧은 수명(서버리스 콜드 스타트, CLI): AOT 또는 스냅숏(V8 스냅숏, JVM CDS/CRaC).
- 스크립트·글루 코드: 인터프리터로 충분.

## 주의 (비용)

- JIT 최적화를 노린 코드 꼼수는 런타임 버전이 바뀌면 효과가 사라진다. 프로파일러(`node --cpu-prof`, `--trace-deopt`, JFR)로 확인된 병목에만 적용한다.
- JIT 는 실행 가능한 메모리를 런타임에 만들어야 해서, 일부 플랫폼(iOS 등)·보안 강화 환경에서 제한된다. 이런 곳에서는 인터프리터 모드로만 돌 수 있다.
- AOT 도 공짜가 아니다. 빌드 시간이 길고, 리플렉션·동적 로딩에 제약이 생길 수 있다(GraalVM native-image).
