---
name: PlatformIO
url: https://platformio.org
docs: https://docs.platformio.org/en/latest/
repo: https://github.com/platformio/platformio-core
stars: 9639
domain: robotics
category: embedded
description: 임베디드 빌드·패키지·디버그를 통합한 크로스 플랫폼 CLI 와 VS Code 확장. platformio.ini 한 파일로 보드·프레임워크·라이브러리를 관리한다.
pricing: oss
tags: [platformio, embedded, build-system, arduino, esp32, stm32, vscode]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
PlatformIO 는 MCU 개발의 빌드 시스템·툴체인 설치·라이브러리 관리·업로드·디버깅·유닛 테스트를 하나로 묶은 도구다. 핵심(`platformio-core`)은 Python CLI(`pio`)이고 VS Code 확장이 그 위에 IDE 기능을 얹는다. 프로젝트는 `platformio.ini` 로 선언하며, 보드(Arduino·ESP32·STM32·RP2040 등)와 프레임워크(Arduino, ESP-IDF, Zephyr 등)를 바꿔 끼워도 같은 워크플로를 쓸 수 있다. Apache-2.0.
**Core v6.2.0 기준(2026-09-05)**. 보드 지원은 별도 "플랫폼" 패키지(예: `espressif32`, `raspberrypi`)가 담당하고 갱신 주기가 각각 다르므로 최신 칩 지원은 플랫폼 버전도 확인한다.

## 설치
```bash
pip install -U platformio       # 또는 VS Code 에서 "PlatformIO IDE" 확장 설치
pio --version
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `platformio.ini` | 프로젝트 설정. `[env:이름]` 섹션이 빌드 대상 |
| platform | 칩 계열 지원 패키지(`espressif32`, `ststm32`, `atmelavr` …) |
| board | 보드 ID(`uno`, `esp32dev`, `pico` …) |
| framework | `arduino`, `espidf`, `zephyr` 등 |
| `lib_deps` | 라이브러리 의존성 선언(레지스트리·Git URL) |
| 환경(env) | 같은 소스를 여러 보드로 빌드 |
| `pio` CLI | `run`, `upload`, `device monitor`, `test`, `debug` |

## 기본 사용법
프로젝트 생성과 설정:
```bash
pio project init --board uno      # platformio.ini 와 src/ 생성
```
```ini
[env:uno]
platform = atmelavr
board = uno
framework = arduino
monitor_speed = 115200
lib_deps =
    adafruit/Adafruit NeoPixel
```
빌드·업로드·시리얼 모니터:
```bash
pio run                  # 빌드
pio run -t upload        # 업로드
pio device monitor       # 시리얼 모니터
```

## 자주 쓰는 패턴
- **멀티 환경**: `[env:esp32]`, `[env:pico]` 를 함께 두고 `pio run -e esp32` 로 선택 빌드한다.
- **공통 설정 상속**: `[env]` 섹션이나 `extends` 로 중복을 줄인다.
- **CI**: `pio run` 과 `pio test -e native`(호스트 단위 테스트)를 파이프라인에 넣는다.
- **빌드 플래그**: `build_flags = -DDEBUG -Wall` 로 매크로·경고를 지정한다.
- **ESP-IDF·Zephyr 프레임워크**: `framework = espidf` 로 네이티브 SDK 를 PlatformIO 빌드 안에서 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 보드·프레임워크를 오가며 재현 가능한 빌드와 의존성 관리가 필요할 때, VS Code 중심 개발.
- 피할 때(대안): 공식 툴체인의 최신 기능을 즉시 써야 하면 [ESP-IDF](/develop-wiki/robotics/embedded/esp-idf/)·[Zephyr](/develop-wiki/robotics/embedded/zephyr/) 의 네이티브 빌드(`idf.py`, `west`), 간단한 스케치는 [Arduino](/develop-wiki/robotics/embedded/arduino/) CLI.

## 공식 문서
- [문서 홈](https://docs.platformio.org/en/latest/) · [Core(CLI)](https://docs.platformio.org/en/latest/core/index.html)
- [GitHub](https://github.com/platformio/platformio-core)
