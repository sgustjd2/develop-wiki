---
title: 액터 모델과 CSP(채널)
aka: [Actor Model, CSP, Communicating Sequential Processes, Channels, Message Passing, Erlang, Akka, Goroutines]
category: cs-fundamentals
group: concurrency
level: advanced
summary: 공유 메모리와 락 대신 메시지로 협력하는 두 동시성 모델. 액터는 주소가 있는 개체가 우편함으로 메시지를 받고, CSP 는 이름 없는 프로세스가 채널로 값을 주고받는다.
tags: [concurrency, actor, csp, channel, erlang, akka, go, message-passing]
related: [cs-fundamentals/race-condition-lock-deadlock, cs-fundamentals/async-vs-threads, cs-fundamentals/memory-model-atomics, architecture/event-driven]
sources:
  - https://www.erlang.org/doc/system/conc_prog.html
  - https://www.erlang.org/doc/system/robustness.html
  - https://doc.akka.io/libraries/akka-core/current/typed/guide/actors-intro.html
  - https://go.dev/blog/codelab-share
  - https://go.dev/ref/mem
updatedAt: 2026-11-18
---

## 문제

락으로 공유 상태를 지키는 방식은 락 순서·범위를 모든 코드가 지켜야 하고, 하나만 어겨도 [경쟁 조건이나 데드락](/develop-wiki/knowledge/cs-fundamentals/race-condition-lock-deadlock/)이 된다. 두 모델은 "상태를 공유하지 말고 메시지로 넘기자"는 같은 출발점에서 다른 길로 간다. Go 문서의 표어가 이를 요약한다: 메모리를 공유해서 통신하지 말고, 통신해서 메모리를 공유하라.

## 비교

| | 액터 (Hewitt 1973 → Erlang, Akka) | CSP (Hoare 1978 → Go, Clojure core.async) |
| --- | --- | --- |
| 통신 대상 | **액터**(주소/PID 를 가진 개체)에게 보냄 | **채널**(이름 붙은 통로)에 보냄, 받는 쪽이 누군지 모름 |
| 전달 | 비동기, 각 액터의 우편함(mailbox)에 쌓임 | 기본은 동기(무버퍼: 주고받는 쪽이 만나야 진행), 버퍼 채널은 제한된 비동기 |
| 상태 | 액터 내부 비공개, 메시지를 한 번에 하나씩 처리 | 각 고루틴이 소유, 채널로 소유권을 넘김 |
| 배압 | 우편함이 무한히 커질 수 있음 → 별도 설계 | 버퍼가 차면 보내는 쪽이 멈춤 → 자연스러운 배압 |
| 분산 | 위치 투명성 (원격 노드의 액터에도 같은 방식으로 보냄) | 보통 한 프로세스 안 |
| 실패 처리 | 링크·감독자 트리, "죽게 두고 재시작" | 언어 차원 지원 적음 (errgroup, context 로 조립) |

## 액터

Erlang 문서 기준: 프로세스는 데이터를 공유하지 않고, `spawn` 으로 만들고, `Pid ! Msg` 로 보내고, `receive` 로 우편함에서 패턴이 맞는 메시지를 꺼낸다. Akka 문서도 액터가 우편함을 **하나씩 순서대로** 처리하므로 락 없이 내부 불변식이 지켜진다고 설명한다.

**장애 처리**: Erlang 프로세스를 `link` 하면 한쪽이 비정상 종료할 때 종료 신호가 전파된다. `trap_exit` 로 신호를 메시지로 받아 처리할 수 있고, OTP 감독자(supervisor)가 이를 이용해 자식을 재시작한다. Akka 도 부모가 실패한 자식을 재시작·중지하는 계층을 둔다.

```ts
// TypeScript 로 흉내 낸 최소 액터: 우편함 + 순차 처리
type Msg = { type: 'deposit'; amount: number } | { type: 'get'; reply: (n: number) => void };

function bankAccount() {
  let balance = 0;                  // 외부에서 직접 못 건드림
  const mailbox: Msg[] = [];
  let running = false;
  async function drain() {
    running = true;
    while (mailbox.length) {
      const m = mailbox.shift()!;   // 한 번에 하나씩
      if (m.type === 'deposit') balance += m.amount;
      else m.reply(balance);
    }
    running = false;
  }
  return (m: Msg) => { mailbox.push(m); if (!running) queueMicrotask(drain); };
}
```

## CSP (Go 채널)

```go
// 작업자 풀: 결과를 채널로 모은다 (공유 슬라이스 + 락 없음)
func crawl(urls []string) map[string]int {
	type res struct{ url string; size int }
	jobs := make(chan string)
	out := make(chan res)
	for w := 0; w < 8; w++ {
		go func() {
			for u := range jobs { out <- res{u, fetchSize(u)} }
		}()
	}
	go func() { for _, u := range urls { jobs <- u }; close(jobs) }()
	sizes := map[string]int{}
	for range urls { r := <-out; sizes[r.url] = r.size } // map 은 이 고루틴만 소유
	return sizes
}
```

Go 메모리 모델은 채널 송신이 대응하는 수신 완료보다 **먼저 일어남(happens-before)** 을 보장한다. 그래서 채널로 넘긴 값은 별도 동기화 없이 안전하게 읽힌다.

## 개발자에게 왜 중요한가

- 상태를 가진 개체가 많고(사용자 세션, 게임 방, 디바이스) 각자 독립적으로 메시지를 처리하면 액터가 잘 맞는다. Orleans·Akka·Erlang/Elixir 가 이 영역이다.
- 파이프라인·팬아웃/팬인처럼 **데이터 흐름**이 핵심이면 채널이 자연스럽다.
- 메시지 큐 기반 [이벤트 주도 아키텍처](/develop-wiki/knowledge/architecture/event-driven/)는 서비스 수준의 액터 모델로 볼 수 있다. 같은 문제(순서, 중복, 배압)가 반복된다.

## 언제 쓰나

- 공유 상태 경쟁이 잦고 락 설계가 복잡해질 때.
- 장애 격리와 자동 재시작이 중요한 장기 실행 시스템(통신, 메시징).

## 주의 (비용)

- **채널·메시지로도 데드락이 난다.** 두 고루틴이 서로의 채널을 기다리거나, 액터 A 가 B 의 응답을 동기적으로 기다리는 동안 B 가 A 에 묻는 경우.
- 액터 우편함은 무한히 쌓일 수 있다. 우편함 크기 제한·배압·느린 소비자 감지를 설계한다.
- Go 문서도 이 방식이 지나칠 수 있다고 말한다. 단순 카운터·캐시는 뮤텍스나 원자 연산이 더 명확하다.
- 메시지 순서는 보낸 쪽·받는 쪽 쌍 사이에서만 보장되는 경우가 많다. 전역 순서를 가정하지 않는다.
- 디버깅이 어렵다. 메시지 흐름을 추적할 수 있도록 상관 ID 와 로깅을 넣는다.
