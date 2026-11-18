---
title: WebAssembly 실행 모델
aka: [WebAssembly, Wasm, Linear Memory, Stack Machine, WASI, Component Model, Wasm Sandbox]
category: cs-fundamentals
group: compiler
level: advanced
summary: Wasm 이 어떤 가상 기계인지(스택 머신, 선형 메모리, 테이블, 임포트·익스포트), 검증 → 인스턴스화 → 호출 흐름, JS 와의 경계 비용과 브라우저 밖 사용(WASI).
tags: [webassembly, wasm, compiler, runtime, sandbox, rust, browser]
related: [cs-fundamentals/interpreter-compiler-jit, cs-fundamentals/garbage-collection, cs-fundamentals/virtual-memory, cs-fundamentals/event-loop, cs-fundamentals/same-origin-policy]
sources:
  - https://webassembly.github.io/spec/core/intro/overview.html
  - https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts
  - https://webassembly.org/news/2025-09-17-wasm-3.0/
  - https://wasi.dev/
updatedAt: 2026-11-18
---

## 문제

- 브라우저에서 돌릴 수 있는 언어가 사실상 JS 하나였다. C/C++/Rust 로 짠 이미지 코덱, 게임 엔진, DB, 암호 라이브러리를 웹에 가져오려면 JS 로 다시 써야 했다.
- 서버·엣지에서도 "남이 준 코드를 안전하게, 빠르게, 가볍게" 실행할 격리 단위가 필요하다. 컨테이너는 무겁고, 스크립트 언어는 느리다.

## 해법: 작고 검증 가능한 가상 기계

WebAssembly 는 **이식 가능한 저수준 바이너리 명령 형식**이다. 소스 언어가 아니라 컴파일 타깃이다(Rust, C/C++, Go, Kotlin, AssemblyScript 등 → `.wasm`). 현재 코어 명세는 3.0(2025-09 발표: GC, memory64, 예외 처리, 꼬리 호출 등 포함)이다.

### 구성 요소

| 요소 | 설명 |
| --- | --- |
| 값 타입 | `i32`, `i64`, `f32`, `f64`, 128비트 벡터(`v128`), 참조(불투명 포인터) |
| 명령 | **스택 머신**: 피연산자 스택에서 꺼내 계산하고 결과를 넣는다. 분기는 블록·루프 같은 구조화된 제어만 대상으로 한다(임의 goto 없음) |
| 함수 | 매개변수·결과·지역 변수. 호출 스택은 코드에서 직접 볼 수 없다 → 반환 주소 덮어쓰기 같은 공격이 원천 차단 |
| 선형 메모리 | 연속된 바이트 배열. 페이지(64KiB) 단위로 늘릴 수 있다. 범위 밖 접근은 **트랩**. 3.0 부터 모듈당 여러 개, 64비트 주소(memory64)도 가능 |
| 테이블 | 참조 배열. 함수 포인터는 메모리의 주소가 아니라 테이블 인덱스로 표현된다(간접 호출 시 타입 검사) |
| 모듈 | 위 정의 + **임포트**(밖에서 받을 함수·메모리) + **익스포트**(밖에 내놓을 것) |
| 트랩 | 0 나누기, 범위 밖 접근 등에서 즉시 중단. Wasm 코드 안에서는 못 잡고 호스트가 잡는다 |

### 실행 흐름

```
.wasm 바이트 ─ 디코딩 ─▶ 검증(타입 검사: 스택 사용이 일관적인가) ─▶ 컴파일(기계어)
                                                                │
          임포트 객체(JS 함수, 메모리) ─────────────────────────▶ 인스턴스화
                                                                │ 전역·메모리·테이블 초기화, start 함수
                                                                ▼
                                                  익스포트 함수 호출 (invocation)
```

검증이 실행 **전에** 끝나기 때문에, 검증을 통과한 모듈은 정해진 메모리와 임포트 밖으로 손을 뻗을 수 없다. 브라우저 엔진은 이 모듈을 미리(또는 계층적으로) 기계어로 컴파일한다. [인터프리터·컴파일러·JIT](/develop-wiki/knowledge/cs-fundamentals/interpreter-compiler-jit/) 참고.

### JS 와 함께 쓰기

```ts
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('/blur.wasm'),                          // 내려받는 동안 컴파일 시작
  { env: { log: (n: number) => console.log(n) } }, // 임포트: Wasm 이 부를 JS 함수
);
const { memory, alloc, blur } = instance.exports as any;

// 큰 데이터는 선형 메모리에 한 번 복사하고, 포인터(정수)만 넘긴다
const ptr = alloc(pixels.length);
new Uint8Array(memory.buffer, ptr, pixels.length).set(pixels);
blur(ptr, width, height);
```

- Wasm 은 **DOM 에 직접 접근하지 못한다.** JS 함수를 임포트해 부른다. 실제로는 wasm-bindgen, Emscripten 이 그 접착 코드를 생성한다.
- 숫자 외의 값(문자열, 객체)은 경계를 넘을 때 선형 메모리로 복사·인코딩해야 한다. 이 왕복이 잦으면 JS 보다 느려진다.
- 메모리가 늘어나면(`memory.grow`) 기존 `memory.buffer` 뷰가 무효화된다. 뷰는 쓸 때마다 다시 만든다.

## 브라우저 밖: WASI 와 컴포넌트 모델

- **WASI** 는 Wasm 용 시스템 인터페이스 표준(파일, 시계, 소켓 등)이다. 0.1(Preview 1), 0.2(Preview 2, 컴포넌트 모델 기반), 0.3(비동기 `stream`/`future`) 순으로 이어지고 있다.
- **능력 기반 보안**: 모듈은 기본 권한이 0 이다. 호스트가 명시적으로 넘겨준 디렉터리·소켓만 쓸 수 있다.
- 런타임: Wasmtime, WasmEdge, Wasmer 등. 플러그인 시스템(Envoy, 데이터베이스 UDF), 엣지 함수, 서버리스에서 쓰인다.

## 언제 쓰나

- **CPU 집약 계산**이 한 번 호출로 오래 도는 경우: 이미지·영상·오디오 처리, 압축, 암호, 물리 시뮬레이션, PDF·CAD 렌더링.
- **기존 네이티브 코드 재사용**: SQLite, FFmpeg, OpenCV 같은 C/C++ 라이브러리를 웹에 가져오기.
- **신뢰할 수 없는 코드 격리**: 사용자 플러그인, 멀티테넌트 함수 실행.

## 주의 (비용)

- **"Wasm 이 JS 보다 항상 빠르다"는 틀리다.** JIT 가 잘 최적화한 JS 와 비슷한 경우가 많고, DOM 조작·작은 함수를 자주 부르는 코드는 경계 비용 때문에 오히려 느리다. 측정 후 결정한다.
- 바이너리 크기: 언어 런타임·표준 라이브러리가 딸려 오면 수백 KB~MB 가 된다. `wasm-opt`, LTO, 불필요 기능 제거로 줄인다.
- GC 언어는 예전엔 자기 GC 를 통째로 Wasm 에 넣어야 했다. WasmGC(3.0 에 포함)로 호스트 GC 를 쓸 수 있게 됐지만 언어·툴체인 지원 수준은 따로 확인한다. [GC](/develop-wiki/knowledge/cs-fundamentals/garbage-collection/) 참고.
- 샌드박스는 **호스트를 보호**하지, 모듈 안의 버그를 막지 않는다. C 코드의 버퍼 오버플로는 선형 메모리 안에서 여전히 데이터를 망가뜨린다.
- 브라우저에서는 같은 출처 정책·권한 정책을 그대로 따른다. `.wasm` 은 `application/wasm` MIME 으로 서빙해야 `instantiateStreaming` 이 동작한다.
- 스레드(`SharedArrayBuffer`)를 쓰려면 교차 출처 격리(COOP/COEP)가 필요하다. [CSP·보안 헤더](/develop-wiki/knowledge/cs-fundamentals/csp-security-headers/) 참고.
- 디버깅은 소스맵·DWARF 지원이 좋아졌지만 JS 만큼 편하지는 않다.
