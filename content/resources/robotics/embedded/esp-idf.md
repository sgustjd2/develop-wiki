---
name: ESP-IDF
url: https://docs.espressif.com/projects/esp-idf/en/stable/
docs: https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html
repo: https://github.com/espressif/esp-idf
stars: 19552
domain: robotics
category: embedded
description: Espressif 의 ESP32 계열 공식 개발 프레임워크. FreeRTOS 기반 C/C++ SDK 와 idf.py 빌드 도구, Wi-Fi·BLE 스택을 제공한다.
pricing: oss
tags: [esp-idf, esp32, espressif, freertos, wifi, ble, idf-py]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
ESP-IDF(Espressif IoT Development Framework)는 ESP32 시리즈 칩의 공식 SDK 다. FreeRTOS 위에 드라이버, Wi-Fi·Bluetooth·Thread 스택, TLS, 파일 시스템, OTA 업데이트를 제공하고 CMake 기반 `idf.py` 로 빌드·플래시·모니터링한다. 로봇에서는 Wi-Fi 가 되는 저가 제어 보드나 센서 노드로 쓰며 [micro-ROS](/develop-wiki/robotics/embedded/micro-ros/) 의 ESP-IDF 컴포넌트로 ROS 2 와 연결한다. Apache-2.0.
**v6.1.1 기준(2026-11-16)**. 릴리스 노트는 6.1.1 을 6.1 의 버그 수정 릴리스로 설명하고 설치는 **ESP-IDF Installation Manager(EIM)** 를 권장한다. 메이저 업(5→6)에서 API·빌드 변경이 있으므로 이전 튜토리얼은 마이그레이션 가이드와 함께 읽는다.

## 설치
공식 권장: EIM 으로 해당 버전을 내려받아 설치한다(OS별 GUI·CLI). 설치 후 환경 스크립트를 불러온다.
```bash
. $IDF_PATH/export.sh            # 환경 변수·도구 경로 설정(설치 위치에 맞게 경로 조정)
idf.py --version
```
소스 클론(`git clone --recursive`)과 `install.sh` 방식도 문서에 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `idf.py` | `set-target`, `build`, `flash`, `monitor`, `menuconfig` 통합 CLI |
| Component | 재사용 가능한 코드 단위. `CMakeLists.txt` 로 정의 |
| Component Manager | `idf_component.yml` 로 레지스트리 컴포넌트 의존성 관리 |
| `app_main` | 사용자 앱 진입점. FreeRTOS 태스크로 실행 |
| `sdkconfig` / menuconfig | Kconfig 기반 설정 |
| 타깃 | `esp32`, `esp32s3`, `esp32c3` 등 칩 선택 |
| 파티션 테이블 | 플래시 영역(앱, OTA, NVS) 배치 |

## 기본 사용법
프로젝트 빌드·플래시:
```bash
idf.py set-target esp32
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor   # 종료: Ctrl+]
```
최소 앱:
```c
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"

static const char *TAG = "demo";

void app_main(void)
{
    int n = 0;
    while (1) {
        ESP_LOGI(TAG, "tick %d", n++);
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
```

## 자주 쓰는 패턴
- **Wi-Fi·MQTT 연결**: 이벤트 루프와 `esp_wifi`, `esp-mqtt` 컴포넌트로 클라우드·호스트와 통신한다.
- **듀얼 코어 분리**: `xTaskCreatePinnedToCore` 로 통신과 제어 태스크를 코어에 고정한다.
- **OTA 업데이트**: 파티션 테이블에 OTA 슬롯을 두고 무선으로 펌웨어를 갱신한다.
- **컴포넌트 재사용**: `idf.py add-dependency` 로 레지스트리 컴포넌트를 추가한다.
- **PlatformIO 병행**: `framework = espidf` 로 [PlatformIO](/develop-wiki/robotics/embedded/platformio/) 에서 같은 SDK 를 쓸 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: ESP32 계열의 모든 하드웨어 기능과 Wi-Fi·BLE 스택을 제대로 쓰고 싶을 때.
- 피할 때(대안): 빠른 스케치 프로토타입은 [Arduino](/develop-wiki/robotics/embedded/arduino/) ESP32 코어, 칩 벤더 중립 RTOS 는 [Zephyr](/develop-wiki/robotics/embedded/zephyr/).

## 공식 문서
- [Get Started](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html) · [API 레퍼런스](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/index.html)
- [릴리스](https://github.com/espressif/esp-idf/releases)
