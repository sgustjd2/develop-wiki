---
title: 가비지 컬렉션 방식
aka: [Garbage Collection, GC, Reference Counting, Mark-Sweep, Mark-Compact, Copying GC, Generational GC, Concurrent GC, Stop-the-world]
category: cs-fundamentals
group: compiler
level: intermediate
summary: 더 이상 도달할 수 없는 메모리를 런타임이 자동으로 회수하는 방법들. 참조 카운팅과 추적(마크-스윕·복사·세대별·동시) 방식이 처리량·지연·메모리 사이에서 다르게 타협한다.
tags: [compiler, gc, memory, jvm, v8, go, python, latency]
related: [cs-fundamentals/virtual-memory, cs-fundamentals/interpreter-compiler-jit, cs-fundamentals/container-internals]
sources:
  - https://v8.dev/blog/trash-talk
  - https://go.dev/doc/gc-guide
  - https://docs.python.org/3/library/gc.html
  - https://docs.oracle.com/en/java/javase/21/gctuning/available-collectors.html
updatedAt: 2026-11-18
---

## 문제

수동 해제(`free`)는 해제 후 사용, 이중 해제, 누수를 만든다. GC 는 "살아 있는 객체"를 **도달 가능성**으로 판단해 나머지를 자동 회수한다. 루트(스택, 전역 변수, 레지스터)에서 포인터를 따라갈 수 있으면 살아 있다.

## 방식 비교

| 방식 | 원리 | 장점 | 약점 | 예 |
| --- | --- | --- | --- | --- |
| 참조 카운팅 | 참조 수가 0 이 되면 즉시 해제 | 해제가 즉각적, 예측 가능 | **순환 참조** 회수 불가, 카운트 갱신 비용 | CPython(+순환 수집기), Swift ARC, Rust `Rc` |
| 마크-스윕 | 루트에서 도달한 것 표시 → 나머지를 빈 목록으로 | 순환 처리, 이동 없음 | 단편화 | Go |
| 마크-컴팩트 | 표시 후 살아남은 것을 한쪽으로 모음 | 단편화 해소 | 이동 비용 | V8 old space(일부 페이지) |
| 복사(semi-space) | 살아남은 것만 다른 공간으로 복사 | 비용이 **생존 객체 수**에 비례, 할당이 빠름 | 공간 절반을 비워 둠 | V8 young generation |
| 세대별 | 젊은 객체를 자주, 늙은 객체를 가끔 | "대부분의 객체는 일찍 죽는다" 가설 활용 | 세대 간 참조 추적(쓰기 장벽) 필요 | V8, JVM G1, .NET |

## 실제 런타임

**V8 (Orinoco)**: 힙을 young/old 세대로 나눈다. Minor GC(Scavenger)는 young 을 semi-space 복사로, Major GC 는 전체를 마크-스윕-컴팩트로 처리한다. old→young 참조는 쓰기 장벽으로 기록해 매번 전체를 훑지 않는다. 표시·복사를 병렬·동시·점진적으로 나눠 메인 스레드 정지를 줄였다.

**Go**: 공식 가이드 기준 **이동하지 않는** 동시 마크-스윕 수집기. 주요 손잡이는 둘이다.
- `GOGC`: 목표 힙 = 살아 있는 힙 + (살아 있는 힙 + GC 루트) × GOGC/100. 두 배로 올리면 힙 여유는 약 두 배, GC CPU 는 약 절반.
- `GOMEMLIMIT`(Go 1.19+): 런타임 전체 메모리의 소프트 한도. 컨테이너 한도보다 5~10% 낮게 잡으라고 안내한다.
- 탈출 분석으로 스택에 둘 수 있는 값은 GC 대상이 아니다(`go build -gcflags=-m` 로 확인).

**CPython**: 참조 카운팅이 주력이고, `gc` 모듈의 세대별 순환 수집기가 순환 참조를 보조로 회수한다. `gc.freeze()` 는 fork 전에 객체를 영구 세대로 옮겨 copy-on-write 로 인한 메모리 복제를 줄인다.

**JVM (HotSpot, JDK 21 문서)**: Serial(단일 스레드, 작은 힙), Parallel(처리량), **G1**(대부분 환경의 기본, 일시 정지 목표), **ZGC**(최대 정지 1ms 미만 목표, 힙 크기와 무관, 처리량 일부 희생).

## 개발자에게 왜 중요한가

- **지연 스파이크**: stop-the-world 정지나 GC 가 CPU 를 빼앗는 구간이 p99 지연으로 나타난다. 먼저 GC 로그·런타임 지표로 확인한다.
- **할당을 줄이는 것이 가장 확실한 튜닝**이다. Go 가이드도 할당률을 낮추면 GC 빈도가 줄어 모든 설정에서 이득이라고 말한다.

```go
// 루프마다 새 버퍼 대신 재사용
var bufPool = sync.Pool{New: func() any { return new(bytes.Buffer) }}

func render(w io.Writer, v any) {
	b := bufPool.Get().(*bytes.Buffer)
	b.Reset()
	defer bufPool.Put(b)
	json.NewEncoder(b).Encode(v)
	w.Write(b.Bytes())
}
```

- **GC 가 있어도 누수는 난다**: 도달 가능한 채로 남은 객체(전역 Map 캐시, 해제 안 한 이벤트 리스너, 클로저가 잡은 큰 객체)는 회수되지 않는다.

```ts
// 누수: 요청마다 리스너를 붙이고 떼지 않음 → emitter 가 콜백과 그 클로저를 계속 붙잡음
emitter.on('tick', () => use(bigObject));
// 해결: off/removeListener, AbortSignal, WeakMap/WeakRef (키 수명에 값을 묶음)
```

- **컨테이너 한도와 힙 설정을 맞춘다**: GC 는 한도를 모르면 힙을 크게 키워 OOMKilled 를 부른다. Node `--max-old-space-size`, JVM `-XX:MaxRAMPercentage`, Go `GOMEMLIMIT`. [컨테이너의 원리](/develop-wiki/knowledge/cs-fundamentals/container-internals/) 참고.

## 언제 무엇을

| 우선순위 | 선택 |
| --- | --- |
| 처리량 (배치) | Parallel GC, 큰 힙, 높은 GOGC |
| 낮은 지연 (API) | G1/ZGC, 할당 줄이기, 적절한 힙 여유 |
| 메모리 절약 | 낮은 GOGC/힙 한도 (대신 GC CPU 증가) |
| 결정적 해제 (실시간, 리소스 핸들) | 참조 카운팅·RAII, 또는 명시적 `close`/`using`/`defer` |

## 주의 (비용)

- GC 는 메모리 관리만 한다. 파일·소켓·DB 연결 같은 자원은 파이널라이저에 맡기지 말고 명시적으로 닫는다. 실행 시점이 보장되지 않는다.
- 튜닝 플래그를 인터넷 글대로 복사하지 않는다. 런타임 버전마다 기본값과 최적값이 바뀐다(JVM 은 수집기 선택부터 기본값에 맡기라고 권한다).
- 힙을 늘리면 GC 횟수는 줄지만 한 번의 표시 작업이 커질 수 있고 메모리 비용이 는다. 지표로 확인하면서 한 번에 하나씩 바꾼다.
