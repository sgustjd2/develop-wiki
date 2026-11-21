---
name: Zephyr RTOS
url: https://zephyrproject.org
docs: https://docs.zephyrproject.org/latest/develop/getting_started/index.html
repo: https://github.com/zephyrproject-rtos/zephyr
stars: 17153
domain: robotics
category: embedded
description: Linux Foundation 이 관리하는 오픈소스 RTOS. 수백 종 보드를 Devicetree·Kconfig·west 로 통일해 지원하며 로봇 펌웨어 개발에 쓴다.
pricing: oss
tags: [zephyr, rtos, devicetree, kconfig, west, microcontroller]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Zephyr 는 Linux Foundation 산하의 확장 가능한 RTOS 로 Apache-2.0 이다. 커널, 드라이버, 네트워크(BLE·Thread·IP), 파일 시스템, 보안 기능을 한 저장소에 담고, 하드웨어는 Devicetree 로 기술하며 기능은 Kconfig 로 켜고 끈다. 빌드·워크스페이스 관리는 `west` 가 맡는다. Arm·RISC-V·Xtensa 등 폭넓은 아키텍처와 보드를 지원한다.
**v4.5.0 기준(2026-10-28)**. 6개월 안팎 주기로 메이저 릴리스가 나오며 API 가 마이너 단위로 바뀌므로 문서 버전을 맞춘다. [micro-ROS](/develop-wiki/robotics/embedded/micro-ros/) 는 Zephyr 용 전용 모듈을 제공한다.

## 설치
Zephyr SDK(툴체인)·west·파이썬 의존성이 필요하다. 개요(자세한 OS별 단계는 공식 Getting Started):
```bash
python3 -m venv ~/zephyr-venv && source ~/zephyr-venv/bin/activate
pip install west
west init ~/zephyrproject && cd ~/zephyrproject
west update && west zephyr-export
pip install -r zephyr/scripts/requirements.txt
west sdk install                   # Zephyr SDK(툴체인) 설치
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| west | 멀티 저장소 워크스페이스·빌드·플래시 도구(`west build/flash`) |
| Devicetree | 보드·SoC 하드웨어를 기술(`.dts`/`.overlay`). 코드는 노드 레이블로 접근 |
| Kconfig(`prj.conf`) | 기능 옵션(`CONFIG_GPIO=y`) 활성화·튜닝 |
| 보드 | `-b <board>` 로 지정. 에뮬레이터(`native_sim`)도 있음 |
| 커널 객체 | 스레드, 세마포어, 큐, 타이머, 워크큐 |
| 모듈 | 외부 코드(HAL, micro-ROS 등)를 west 매니페스트로 편입 |
| Twister | 테스트 실행·보고 도구 |

## 기본 사용법
LED 깜빡이기(보드의 `led0` 별칭 사용, `prj.conf` 에 `CONFIG_GPIO=y`):
```c
#include <zephyr/kernel.h>
#include <zephyr/drivers/gpio.h>

static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(DT_ALIAS(led0), gpios);

int main(void)
{
    if (!gpio_is_ready_dt(&led)) { return 0; }
    gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);
    while (1) {
        gpio_pin_toggle_dt(&led);
        k_msleep(500);
    }
}
```
빌드·플래시:
```bash
west build -p always -b <보드> samples/basic/blinky   # 또는 내 앱 디렉터리
west flash
```

## 자주 쓰는 패턴
- **오버레이로 하드웨어 변경**: 앱의 `boards/<보드>.overlay` 에 핀·장치를 정의해 코드 수정 없이 보드를 바꾼다.
- **스레드 분리**: 센서 샘플링·제어 루프·통신을 `K_THREAD_DEFINE` 스레드로 나누고 메시지 큐로 연결한다.
- **`native_sim` 테스트**: 하드웨어 없이 호스트에서 로직을 실행·단위 테스트한다.
- **로봇 통신**: CAN·UART·이더넷 드라이버와 micro-ROS 모듈로 ROS 2 에 연결한다.
- **버전 고정**: `west.yml` 매니페스트로 Zephyr·모듈 리비전을 고정해 재현 가능한 빌드를 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 MCU 보드에 걸쳐 이식성이 필요하고 Linux 스러운 빌드·드라이버 모델을 원할 때.
- 피할 때(대안): 아주 작은 스케줄러만 필요하면 [FreeRTOS](/develop-wiki/robotics/embedded/freertos/), Espressif 칩 전용이면 [ESP-IDF](/develop-wiki/robotics/embedded/esp-idf/), Rust 비동기 스타일은 [Embassy](/develop-wiki/robotics/embedded/embassy/).

## 공식 문서
- [Getting Started](https://docs.zephyrproject.org/latest/develop/getting_started/index.html) · [문서 홈](https://docs.zephyrproject.org/latest/)
- [릴리스](https://github.com/zephyrproject-rtos/zephyr/releases)
