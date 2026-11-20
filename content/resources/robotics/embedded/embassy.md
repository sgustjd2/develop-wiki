---
name: Embassy
url: https://embassy.dev
docs: https://embassy.dev/book/
repo: https://github.com/embassy-rs/embassy
stars: 10135
domain: robotics
category: embedded
description: Rust 임베디드용 async/await 프레임워크. 협력형 실행기, 타이머, STM32·nRF·RP 하드웨어 추상화와 네트워크·USB 스택을 제공한다.
pricing: oss
tags: [embassy, rust, async, embedded, no-std, stm32, nrf, rp2040]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Embassy 는 Rust 의 `async`/`await` 를 MCU 에서 쓰게 해 주는 프레임워크다. 인터럽트 기반 협력형 실행기(`embassy-executor`)가 힙 없이 태스크를 스케줄하고, 대기 중에는 코어를 슬립시켜 전력을 아낀다. HAL 은 STM32(`embassy-stm32`)·nRF(`embassy-nrf`)·RP2040/RP235x(`embassy-rp`) 등을 제공하며, `embassy-time`(타이머), `embassy-net`(TCP/IP), `embassy-usb`, 부트로더(`embassy-boot`)가 따로 있다. Apache-2.0 또는 MIT 이중 라이선스.
Embassy 는 크레이트 단위로 개별 릴리스한다(저장소에 통합 GitHub 릴리스가 없음). crates.io 기준 **`embassy-executor` 0.10.0(2026-03-20)**, `embassy-rp` 0.10.0 을 확인했다. 아직 0.x 라 크레이트 사이 버전 호환을 맞춰야 하며, 공식 예제 저장소의 `Cargo.toml` 조합을 그대로 따르는 편이 안전하다.

## 설치
Rust 툴체인과 칩에 맞는 타깃·플래시 도구가 필요하다.
```bash
rustup target add thumbv6m-none-eabi      # RP2040 예(칩마다 타깃이 다름)
cargo install probe-rs-tools              # 플래시·디버그(또는 elf2uf2-rs)
```
의존성은 `Cargo.toml` 에 `embassy-executor`, `embassy-time`, 칩 HAL(`embassy-rp` 등), `defmt`, `panic-probe` 등을 추가한다. 가장 빠른 시작은 저장소 `examples/` 를 복사하는 것이다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Executor | 인터럽트로 깨어나는 협력형 async 실행기. 힙 불필요 |
| `#[embassy_executor::main]` / `task` | 진입점·태스크 매크로(`spawner.spawn`) |
| HAL(`embassy-*`) | 칩별 하드웨어 추상화. GPIO·SPI·I2C·UART 의 async API |
| `embassy-time` | `Timer::after_millis(..).await`, `Instant`, `Duration` |
| `embassy-sync` | async 채널·뮤텍스·시그널 |
| `embassy-net` | async TCP/UDP/DHCP 스택 |
| `defmt` / `probe-rs` | 경량 로깅과 플래시·디버깅 |

## 기본 사용법
RP2040 LED 점멸(공식 예제 형태):
```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_rp::gpio::{Level, Output};
use embassy_time::Timer;
use {defmt_rtt as _, panic_probe as _};

#[embassy_executor::main]
async fn main(_spawner: Spawner) {
    let p = embassy_rp::init(Default::default());
    let mut led = Output::new(p.PIN_25, Level::Low);   // 보드에 따라 핀 다름
    loop {
        led.set_high();
        Timer::after_millis(500).await;
        led.set_low();
        Timer::after_millis(500).await;
    }
}
```
`cargo run --release` 로 probe-rs 를 통해 플래시·로그를 확인한다(러너 설정은 예제의 `.cargo/config.toml`). 빌드에는 `memory.x` 등 칩별 링커 설정이 필요하다.

## 자주 쓰는 패턴
- **태스크 분리**: 센서 읽기·제어·통신을 `#[embassy_executor::task]` 로 나누고 `embassy-sync` 채널로 연결한다.
- **우선순위 실행기**: 인터럽트 실행기를 여러 개 두어 높은 우선순위 태스크가 낮은 태스크를 선점하게 한다.
- **select/join**: `embassy_futures::select` 로 이벤트(타이머 vs 입력)를 동시에 기다린다.
- **네트워크**: `embassy-net` 으로 Wi-Fi/이더넷 TCP 통신을 async 로 처리한다.
- **타입 안전 GPIO**: 소유권 시스템으로 같은 핀의 이중 사용을 컴파일 타임에 막는다.

## 언제 쓰나 / 피할 때
- 쓸 때: Rust 로 MCU 펌웨어를 쓰고 여러 비동기 I/O 를 RTOS 없이 다루고 싶을 때. 안전한 동시성이 중요한 모터·센서 노드.
- 피할 때(대안): ROS 2 직접 연동이 필요하면 [micro-ROS](/develop-wiki/robotics/embedded/micro-ros/)(C), 큰 생태계·검증 이력은 [FreeRTOS](/develop-wiki/robotics/embedded/freertos/)·[Zephyr](/develop-wiki/robotics/embedded/zephyr/), 언어 개요는 [Rust](/develop-wiki/languages/rust/).

## 공식 문서
- [Embassy Book](https://embassy.dev/book/) · [API 레퍼런스](https://docs.embassy.dev/)
- [GitHub](https://github.com/embassy-rs/embassy)
