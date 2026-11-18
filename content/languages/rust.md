---
name: Rust
summary: 가비지 컬렉터 없이 소유권 규칙으로 메모리 안전성을 보장하는 시스템 프로그래밍 언어. 성능과 안정성이 모두 중요한 서버·도구·임베디드에 쓴다.
paradigms: [명령형, 함수형, 제네릭, 동시성]
typing: static
execution: compiled
firstAppeared: 2015
officialSite: https://www.rust-lang.org/
docs: https://doc.rust-lang.org/
useCases: [시스템 프로그래밍, 고성능 백엔드·네트워크 서비스, CLI·개발 도구, WebAssembly, 임베디드]
sources:
  - https://rust-lang.org/tools/install/
  - https://doc.rust-lang.org/cargo/getting-started/first-steps.html
  - https://blog.rust-lang.org/
  - https://doc.rust-lang.org/book/
updatedAt: 2026-11-18
---

## 개요
Rust는 Mozilla 연구 프로젝트에서 출발해 2015년 1.0이 나온 언어로, 현재는 Rust Foundation과 커뮤니티 팀이 관리한다. C/C++ 수준의 성능을 목표로 하면서도, 컴파일러가 소유권·빌림 규칙을 검사해 널 포인터·해제 후 사용·데이터 경합 같은 메모리 오류를 컴파일 단계에서 막는다.

- 6주마다 안정 버전이 나온다. 2026-11 기준 최신은 **Rust 1.100.0**(2026-11-12). 언어 에디션은 **2024**가 최신이며 `cargo new` 의 기본값이다.
- `firstAppeared` 는 안정 버전 1.0(2015) 기준이다.

## 언어의 특징
| 항목 | 내용 |
| --- | --- |
| 타입 시스템 | 정적·강한 타입, 지역 타입 추론, 대수적 데이터 타입(`enum`), 트레이트 기반 제네릭, 패턴 매칭 |
| 메모리 관리 | GC 없음. 소유권(값마다 주인 하나), 빌림(`&`/`&mut`), 라이프타임으로 컴파일 시점에 해제 시점을 결정 |
| 널·에러 | 널 대신 `Option<T>`, 예외 대신 `Result<T, E>` 와 `?` 연산자 |
| 동시성 | `Send`/`Sync` 트레이트로 스레드 간 공유를 타입으로 검증. 비동기는 `async`/`await` + 런타임(Tokio 등) |
| 실행 | LLVM 기반 네이티브 컴파일. 런타임이 거의 없어 C ABI 연동·WebAssembly 타깃이 쉬움 |
| `unsafe` | 저수준 작업은 `unsafe` 블록으로 명시해 범위를 좁힌다 |

## 개발 환경 시작하기
1. 공식 설치 도구 **rustup** 으로 컴파일러(`rustc`)와 빌드 도구·패키지 매니저(**Cargo**)를 함께 설치한다.

```bash
# macOS / Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Windows: https://win.rustup.rs 에서 rustup-init.exe 실행

rustup update            # 툴체인 업데이트
cargo --version
```

2. 프로젝트 생성과 실행

```bash
cargo new hello          # 바이너리 프로젝트 (라이브러리는 --lib)
cd hello
cargo run                # 빌드 + 실행
cargo add serde --features derive   # crates.io 의존성 추가
cargo build --release    # 최적화 빌드 → target/release/
cargo test
cargo fmt && cargo clippy    # 포맷, 린트
```

생성되는 `Cargo.toml` 에는 `edition = "2024"` 가 들어간다. 패키지 저장소는 [crates.io](https://crates.io/), 라이브러리 문서는 [docs.rs](https://docs.rs/).

## 문법 한눈에 보기
```rust
// 구조체, 메서드, 트레이트
#[derive(Debug, Clone)]
struct User {
    id: u32,
    name: String,
}

trait Greet {
    fn greet(&self) -> String;
}

impl Greet for User {
    fn greet(&self) -> String {
        format!("안녕하세요, {}님", self.name)
    }
}

// 열거형 + 패턴 매칭
enum Shape {
    Circle(f64),
    Rect { w: f64, h: f64 },
}

fn area(s: &Shape) -> f64 {
    match s {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Rect { w, h } => w * h,
    }
}
```

```rust
use std::num::ParseIntError;

// Result 와 ? 연산자
fn double(s: &str) -> Result<i32, ParseIntError> {
    let n: i32 = s.trim().parse()?; // 실패하면 바로 Err 반환
    Ok(n * 2)
}

fn main() {
    let user = User { id: 1, name: String::from("Kim") };
    let borrowed = &user;              // 빌림: 소유권은 user 에 남음
    println!("{}", borrowed.greet());

    let moved = user;                  // 소유권 이동, 이후 user 사용 불가
    println!("{:?}", moved);

    match double("21") {
        Ok(v) => println!("{v}"),
        Err(e) => eprintln!("파싱 실패: {e}"),
    }
    println!("{:.2}", area(&Shape::Rect { w: 2.0, h: 3.0 }));
}
```

## 생태계
**웹·백엔드**
- [Axum](/develop-wiki/backend/web-framework/axum/) — Tokio 팀의 웹 프레임워크. 그 밖에 Actix Web, Rocket 등이 있다.
- 비동기 런타임 Tokio, 직렬화 serde, HTTP 클라이언트 reqwest, DB 접근 sqlx·Diesel 이 사실상 표준 조합.

**AI**
- 도구 연동: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) Rust SDK

**도구·플랫폼**: ripgrep, uv·Ruff(Python 도구), Biome·Rolldown·Turbopack(JS 도구) 등 개발 도구를 Rust로 다시 만드는 흐름이 강하다. WebAssembly(wasm-bindgen), 임베디드(no_std), 데스크톱(Tauri)에도 쓰인다.

## 언제 쓰나 / 약점
- **쓸 때**
  - 지연 시간·메모리 사용량이 중요한 서버, 프록시, 데이터베이스, 게임 엔진.
  - C/C++ 코드를 메모리 안전하게 대체하거나 Python·Node 의 네이티브 확장 모듈을 만들 때.
  - 빠른 단일 바이너리 CLI, WebAssembly 모듈.
- **약점**
  - 소유권·라이프타임 개념 때문에 학습 곡선이 가파르다.
  - 컴파일 시간이 길다(특히 의존성이 많은 프로젝트의 첫 빌드).
  - 비동기 생태계가 런타임(Tokio)에 묶여 있고 개념이 복잡하다.
  - 빠른 프로토타이핑이나 단순 CRUD 서비스에는 생산성 면에서 과할 수 있다.

## 공식 문서·학습 자료
- [공식 문서 모음](https://doc.rust-lang.org/) · [The Rust Programming Language(“the book”)](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) · [표준 라이브러리](https://doc.rust-lang.org/std/)
- [설치(rustup)](https://rust-lang.org/tools/install/) · [Cargo Book](https://doc.rust-lang.org/cargo/)
- [Edition Guide](https://doc.rust-lang.org/edition-guide/) · [Rust 블로그(릴리스 공지)](https://blog.rust-lang.org/)
