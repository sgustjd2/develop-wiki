---
name: Raspberry Pi Pico SDK
url: https://www.raspberrypi.com/documentation/microcontrollers/c_sdk.html
docs: https://www.raspberrypi.com/documentation/microcontrollers/c_sdk.html
repo: https://github.com/raspberrypi/pico-sdk
stars: 5033
domain: robotics
category: embedded
description: RP2040·RP2350 용 공식 C/C++ SDK. CMake 빌드와 하드웨어 API, PIO·멀티코어·USB·Wi-Fi 라이브러리를 제공한다.
pricing: oss
tags: [raspberry-pi-pico, pico-sdk, rp2040, rp2350, cmake, pio]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Pico SDK 는 Raspberry Pi 의 RP 시리즈 MCU(RP2040, RP2350 — Pico, Pico 2 등)를 C/C++ 로 프로그래밍하기 위한 공식 SDK 다. `main()` 에서 시작하는 일반적인 C 프로그램 구조에 하드웨어 레지스터 위의 `hardware_*` 라이브러리(GPIO, I2C, SPI, PWM, DMA)와 `pico_*` 고수준 라이브러리(타이머, 멀티코어, USB, 네트워크)를 얹고, CMake 로 빌드해 UF2 파일을 만든다. 고유 기능인 PIO(프로그래머블 I/O)로 커스텀 프로토콜을 하드웨어로 구현할 수 있다. BSD-3-Clause.
**v2.3.1 기준(2026-09-04)**. 로봇에서는 저가 모터·센서 제어 보드로 쓰이며, [micro-ROS](/develop-wiki/robotics/embedded/micro-ros/) 의 Pico 지원이나 Rust 쪽 [Embassy](/develop-wiki/robotics/embedded/embassy/)(`embassy-rp`) 가 대안 경로다. 문서 사이트는 자동 요청에 막힐 수 있어(검증 시 일부 403) 브라우저로 확인한다.

## 설치
툴체인(Arm GNU, CMake, Ninja/Make)을 설치하고 SDK 를 클론한다.
```bash
git clone https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk && git submodule update --init   # TinyUSB, cyw43 등 서브모듈
export PICO_SDK_PATH=$PWD
```
공식 Getting Started 는 VS Code 확장으로 이 과정을 자동화하는 경로도 안내한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `pico_stdlib` | 기본 라이브러리 묶음(GPIO, 타이머, stdio) |
| `hardware_*` | 장치별 저수준 API(`hardware_i2c`, `hardware_pwm` …) |
| `PICO_BOARD` | 대상 보드(`pico`, `pico_w`, `pico2` …) CMake 변수 |
| UF2 | BOOTSEL 모드의 USB 저장장치에 복사해 쓰는 펌웨어 파일 |
| PIO | 상태 머신 기반 프로그래머블 I/O 블록 |
| 멀티코어 | `pico_multicore` 로 두 번째 코어 실행 |
| `pico_cyw43_arch` | Pico W 의 Wi-Fi/Bluetooth 칩 드라이버 |

## 기본 사용법
CMake 프로젝트(`pico_sdk_import.cmake` 를 SDK 에서 복사해 둔다):
```cmake
cmake_minimum_required(VERSION 3.13)
include(pico_sdk_import.cmake)
project(blink C CXX ASM)
pico_sdk_init()

add_executable(blink blink.c)
target_link_libraries(blink pico_stdlib)
pico_add_extra_outputs(blink)    # .uf2 생성
```
```c
#include "pico/stdlib.h"

int main(void) {
    const uint LED = PICO_DEFAULT_LED_PIN;   // Pico W 는 cyw43 경유라 다름
    gpio_init(LED);
    gpio_set_dir(LED, GPIO_OUT);
    while (true) {
        gpio_put(LED, 1); sleep_ms(500);
        gpio_put(LED, 0); sleep_ms(500);
    }
}
```
빌드 후 BOOTSEL 을 누른 채 USB 연결하고 `blink.uf2` 를 복사한다.
```bash
mkdir build && cd build && cmake -DPICO_BOARD=pico .. && make
```

## 자주 쓰는 패턴
- **USB 시리얼 로그**: CMake 에서 `pico_enable_stdio_usb(blink 1)` 로 `printf` 를 USB CDC 로 출력한다.
- **PWM 모터 제어**: `hardware_pwm` 으로 서보·DC 모터 속도를 제어한다.
- **PIO**: 엔코더 읽기·WS2812·커스텀 직렬 프로토콜을 CPU 부하 없이 처리한다.
- **듀얼 코어 분할**: 코어 1 에서 제어 루프, 코어 0 에서 통신을 돌린다.
- **RTOS 결합**: FreeRTOS 포트를 추가해 [FreeRTOS](/develop-wiki/robotics/embedded/freertos/) 태스크 구조로 확장한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 저렴한 RP 보드에서 C/C++ 로 PIO 같은 고유 기능까지 활용하고 싶을 때.
- 피할 때(대안): 빠른 프로토타입은 [Arduino](/develop-wiki/robotics/embedded/arduino/) 코어나 MicroPython, Rust 비동기 개발은 [Embassy](/develop-wiki/robotics/embedded/embassy/), 멀티 벤더 이식성은 [Zephyr](/develop-wiki/robotics/embedded/zephyr/).

## 공식 문서
- [C/C++ SDK 문서](https://www.raspberrypi.com/documentation/microcontrollers/c_sdk.html) · [Getting Started](https://rptl.io/pico-get-started)
- [GitHub](https://github.com/raspberrypi/pico-sdk)
