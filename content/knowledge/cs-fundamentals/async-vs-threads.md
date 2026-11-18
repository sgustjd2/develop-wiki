---
title: async/await·이벤트 루프 vs 스레드
aka: [Async/Await, Event Loop vs Threads, Concurrency vs Parallelism, Cooperative vs Preemptive, Goroutine, Virtual Thread, Function Coloring]
category: cs-fundamentals
group: concurrency
level: intermediate
summary: 동시에 많은 일을 다루는 두 방식. 이벤트 루프+async 는 한 스레드가 대기 지점에서 협력적으로 전환하고, 스레드는 OS·런타임이 선점적으로 전환한다. I/O 대기와 CPU 계산에서 장단이 갈린다.
tags: [concurrency, async, event-loop, threads, nodejs, go, python]
related: [cs-fundamentals/event-loop, cs-fundamentals/io-models, cs-fundamentals/process-thread, cs-fundamentals/race-condition-lock-deadlock, cs-fundamentals/actor-csp]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model
  - https://nodejs.org/api/worker_threads.html
  - https://go.dev/doc/effective_go
  - https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
updatedAt: 2026-11-18
---

## 동시성 vs 병렬성

- **동시성**: 여러 일을 겹쳐서 진행(한 사람이 여러 냄비를 번갈아 봄).
- **병렬성**: 여러 일을 정말로 같은 순간에 실행(여러 사람이 각자 냄비를 봄).

이벤트 루프는 동시성만, 멀티스레드는 둘 다 가능하다.

## 비교

| | 이벤트 루프 + async/await | 스레드 (OS / 가상·경량) |
| --- | --- | --- |
| 전환 시점 | `await` 지점에서만 (협력적) | 아무 때나 (선점적) |
| 공유 상태 위험 | `await` 사이에만 끼어듦 → 추론 쉬움 | 어느 명령 사이든 끼어듦 → 락 필요 |
| 동시 연결 1만 개 | 가벼움 (콜백·Promise 객체) | OS 스레드는 무거움, 경량 스레드는 가벼움 |
| CPU 계산 | 루프 전체가 멈춤 | 다른 스레드는 계속 진행, 여러 코어 사용 |
| 블로킹 API 호출 | 치명적 (모든 요청 정지) | 그 스레드만 멈춤 |
| 코드 모양 | 비동기 함수가 호출 체인을 "물들임" (function coloring) | 평범한 순차 코드 |
| 예 | Node.js, 브라우저, Python asyncio, Rust tokio | Java 플랫폼/가상 스레드, Go 고루틴, C# 스레드 풀 |

```
이벤트 루프 (스레드 1개)           스레드 풀 (스레드 N개)
req1 ─▶ await DB ┐                req1 ─▶ [T1: DB 대기..........응답]
req2 ─▶ await DB ┤ 대기 중엔        req2 ─▶ [T2: DB 대기..........응답]
req3 ─▶ await DB ┘ 다음 요청 처리    req3 ─▶ [T3: DB 대기..........응답]
        ◀─ 완료 순서대로 이어서 실행     (스레드마다 스택 메모리)
```

## 개발자에게 왜 중요한가

### 1. "async 면 빠르다"가 아니다

async 는 **대기**를 싸게 만들 뿐 계산을 빠르게 하지 않는다. Node 공식 문서도 `worker_threads` 는 CPU 집약 작업용이고 I/O 에는 큰 도움이 안 된다고 적는다.

```ts
// 나쁨: 이벤트 루프에서 큰 JSON 처리·암호 해시·이미지 변환
app.post('/report', async (req, res) => {
  const result = heavyCompute(req.body); // 수백 ms 동안 다른 모든 요청 정지
  res.json(result);
});
// 좋음: 워커 풀(piscina 등)로 보내고 await
```

### 2. 섞을 때의 함정

- async 런타임 안에서 동기 블로킹 호출(`fs.readFileSync`, Python asyncio 안의 `requests.get`, tokio 안의 `std::thread::sleep`)은 루프를 멈춘다.
- 스레드 기반 코드에서 async 라이브러리를 쓰려면 런타임 경계를 명시적으로 넘는다(`asyncio.run`, `block_on`).

### 3. 경량 스레드: 두 장점을 합치려는 시도

Go 고루틴, Java 가상 스레드는 **순차 코드처럼 쓰면서** 블로킹 지점에서 런타임이 OS 스레드를 놓아 준다. Go 공식 문서는 고루틴을 "같은 주소 공간에서 동시에 실행되는 함수, 스택 할당 정도의 비용"으로 설명한다. 대신 선점적 전환이므로 공유 상태에는 여전히 동기화가 필요하다.

```go
// 고루틴: 블로킹처럼 보이지만 런타임이 netpoller 로 대기를 처리
for _, url := range urls {
	go func(u string) {
		resp, err := http.Get(u) // 이 고루틴만 대기
		results <- result{u, resp, err}
	}(url)
}
```

## 언제 무엇을

- **I/O 대기 위주, 연결 많음, 공유 상태 적음** → 이벤트 루프·async (Node, asyncio) 또는 경량 스레드.
- **CPU 계산 위주** → 코어 수만큼의 스레드·프로세스, 또는 이벤트 루프 + 워커 풀.
- **기존 블로킹 라이브러리가 많음** → 스레드(가상 스레드) 쪽이 마이그레이션 비용이 적다.
- **팀이 공유 상태 동기화에 익숙하지 않음** → 이벤트 루프의 협력적 모델이 실수를 줄인다(그래도 `await` 사이 경쟁은 있다).

## 주의 (비용)

- 이벤트 루프는 하나의 느린 콜백이 전체 지연을 결정한다. 이벤트 루프 지연(event loop lag)을 지표로 모니터링한다.
- 스레드는 스레드 풀 고갈(모든 스레드가 느린 하위 호출을 기다림)이 전형적 장애다. 타임아웃과 벌크헤드로 막는다.
- `await` 를 빠뜨린 Promise 는 오류가 조용히 사라지거나 순서가 꼬인다. 린트 규칙(`no-floating-promises`)을 켠다.
- 어느 쪽이든 공유 상태가 있으면 [경쟁 조건](/develop-wiki/knowledge/cs-fundamentals/race-condition-lock-deadlock/)을 설계해야 한다.
