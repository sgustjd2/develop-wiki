---
name: Arduino
url: https://www.arduino.cc
docs: https://docs.arduino.cc/arduino-cli/getting-started/
repo: https://github.com/arduino/arduino-cli
stars: 5103
domain: robotics
category: embedded
description: 스케치(C++) 기반 MCU 개발 생태계. arduino-cli 로 코어·라이브러리를 설치하고 빌드·업로드하며 IDE 2 와 보드 코어가 같은 도구를 쓴다.
pricing: oss
tags: [arduino, arduino-cli, ide, sketch, microcontroller, prototyping]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Arduino 는 `setup()`/`loop()` 구조의 스케치(C++)와 보드 코어·라이브러리 생태계다. 공식 도구는 셋으로 보면 쉽다. **arduino-cli**(명령줄 빌드·업로드·보드·라이브러리 관리, 이 항목의 repo), **Arduino IDE 2**(CLI 를 백엔드로 쓰는 에디터), 보드별 **코어**(예: `arduino:avr`). 로봇에서는 모터 드라이버·센서 보드 같은 저수준 제어부나 프로토타입에 자주 쓴다.
**arduino-cli v1.6.0(2026-11-10), Arduino IDE 2.3.11(2026-11-12) 기준**. 라이선스가 구성요소별로 다르다: arduino-cli 는 GPL-3.0, IDE 2 는 AGPL-3.0(확인), AVR 코어는 GitHub 라이선스 메타데이터가 비어 있어 저장소 파일로 직접 확인해야 한다. 1.8.x 의 구 IDE 저장소(`arduino/Arduino`)는 2021 이후 릴리스가 없다.

## 설치
```bash
brew install arduino-cli          # macOS. 다른 OS 는 공식 설치 스크립트·릴리스 바이너리
arduino-cli core update-index
arduino-cli core install arduino:avr
arduino-cli board list            # 연결된 보드 확인
```
IDE 2 는 공식 사이트에서 설치 파일을 받는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Sketch | `.ino` 파일을 가진 폴더. `setup()` 1회, `loop()` 반복 |
| FQBN | 보드 식별자(`arduino:avr:uno`, `esp32:esp32:esp32` …) |
| Core | 특정 MCU 계열 지원 패키지. 보드 매니저로 설치 |
| Library | `arduino-cli lib install` 로 설치. `Servo`, `Wire` 등 |
| Board Manager URL | 서드파티 코어(ESP32, RP2040 등) 추가용 인덱스 |
| `sketch.yaml` | 스케치별 기본 FQBN·포트·프로필 저장 |

## 기본 사용법
스케치 생성 → 컴파일 → 업로드:
```bash
arduino-cli sketch new Blink
# Blink/Blink.ino 편집 후
arduino-cli compile --fqbn arduino:avr:uno Blink
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:avr:uno Blink
```
```cpp
void setup() { pinMode(LED_BUILTIN, OUTPUT); }

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}
```

## 자주 쓰는 패턴
- **시리얼 통신**: `Serial.begin(115200)` 로 호스트(ROS 노드 등)와 간단한 프로토콜을 주고받는다.
- **`millis()` 비차단 타이밍**: `delay()` 대신 시간 비교로 센서 읽기·모터 제어를 병행한다.
- **서보·모터**: `Servo` 라이브러리나 PWM(`analogWrite`)으로 액추에이터를 구동한다.
- **CI 빌드**: `arduino-cli compile` 을 GitHub Actions 에서 여러 FQBN 로 돌린다.
- **서드파티 보드**: 설정에 Board Manager URL 을 추가해 ESP32·RP2040 코어를 설치한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 빠른 프로토타이핑, 풍부한 라이브러리·튜토리얼, 교육용, 간단한 센서·액추에이터 보드.
- 피할 때(대안): 멀티 환경 빌드·테스트는 [PlatformIO](/develop-wiki/robotics/embedded/platformio/), 실시간 스케줄링은 [FreeRTOS](/develop-wiki/robotics/embedded/freertos/)·[Zephyr](/develop-wiki/robotics/embedded/zephyr/), ROS 2 통합은 [micro-ROS](/develop-wiki/robotics/embedded/micro-ros/)(Arduino 용 컴포넌트 있음).

## 공식 문서
- [Arduino CLI 시작하기](https://docs.arduino.cc/arduino-cli/getting-started/) · [IDE 2](https://docs.arduino.cc/software/ide/)
- [arduino-cli](https://github.com/arduino/arduino-cli) · [arduino-ide](https://github.com/arduino/arduino-ide)
