---
name: FreeRTOS
url: https://www.freertos.org
docs: https://www.freertos.org/Documentation/00-Overview
repo: https://github.com/FreeRTOS/FreeRTOS-Kernel
stars: 4677
domain: robotics
category: embedded
description: 가장 널리 쓰이는 소형 실시간 OS 커널. 태스크·큐·세마포어·타이머를 제공하며 ESP-IDF 등 많은 MCU SDK 의 기반이다.
pricing: oss
tags: [freertos, rtos, kernel, microcontroller, aws, task-scheduler]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
FreeRTOS 는 마이크로컨트롤러용 실시간 커널로, 우선순위 기반 선점형 스케줄러와 태스크 간 통신 객체(큐, 세마포어, 뮤텍스, 이벤트 그룹, 스트림 버퍼, 소프트웨어 타이머)를 제공한다. 핵심 커널은 수 개의 C 파일로 작고, 아키텍처별 포트가 있다. MIT 라이선스이며 AWS 가 유지한다.
**커널 V11.3.3 기준(2026-10-30)**. 저장소 `FreeRTOS-Kernel` 은 커널과 포트만 담고, 데모·라이브러리는 `FreeRTOS/FreeRTOS` 상위 저장소에 있다. [ESP-IDF](/develop-wiki/robotics/embedded/esp-idf/)·STM32Cube 등 벤더 SDK 가 내부에서 FreeRTOS 를 쓰는 경우가 많고, [micro-ROS](/develop-wiki/robotics/embedded/micro-ros/) 도 FreeRTOS 를 지원한다.

## 설치
커널은 소스 포함 방식이다. 보통 벤더 SDK 에 이미 들어 있거나, 다음처럼 서브모듈/소스로 추가한다.
```bash
git clone https://github.com/FreeRTOS/FreeRTOS-Kernel.git
# 사용할 포트 디렉터리(portable/<컴파일러>/<아키텍처>)와 힙 구현(portable/MemMang/heap_4.c)을 빌드에 포함
```
프로젝트마다 `FreeRTOSConfig.h` 로 틱 주파수, 힙 크기, 우선순위 수 등을 설정한다. 처음에는 대상 보드용 데모 프로젝트에서 시작하는 편이 쉽다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Task | 독립 스택을 가진 실행 단위. 우선순위로 스케줄 |
| Scheduler | `vTaskStartScheduler` 후 선점형 스케줄 시작 |
| Queue | 태스크·ISR 간 데이터 전달(`xQueueSend/Receive`) |
| Semaphore / Mutex | 동기화와 자원 보호(우선순위 상속 뮤텍스 포함) |
| Event group / Notification | 가벼운 신호 전달(`xTaskNotify`) |
| Software timer | 타이머 서비스 태스크에서 콜백 실행 |
| 힙 구현 | `heap_1`~`heap_5`. 메모리 할당 전략 선택 |
| `...FromISR` API | 인터럽트 안에서 쓰는 전용 함수 |

## 기본 사용법
두 태스크가 큐로 데이터를 주고받기:
```c
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"

static QueueHandle_t q;

static void producer(void *arg) {
    int v = 0;
    for (;;) {
        xQueueSend(q, &v, portMAX_DELAY);
        v++;
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

static void consumer(void *arg) {
    int v;
    for (;;) {
        if (xQueueReceive(q, &v, portMAX_DELAY) == pdPASS) {
            /* v 처리: 센서값 기록, 제어 명령 등 */
        }
    }
}

void app_start(void) {
    q = xQueueCreate(8, sizeof(int));
    xTaskCreate(producer, "prod", configMINIMAL_STACK_SIZE, NULL, 1, NULL);
    xTaskCreate(consumer, "cons", configMINIMAL_STACK_SIZE, NULL, 2, NULL);
    vTaskStartScheduler();   // 반환되지 않음
}
```

## 자주 쓰는 패턴
- **주기 제어 루프**: `vTaskDelayUntil` 로 고정 주기(예: 1 kHz 모터 제어)를 유지한다.
- **ISR → 태스크 위임**: 인터럽트에서는 `xQueueSendFromISR`/`vTaskNotifyGiveFromISR` 로 신호만 보내고 처리는 태스크에서 한다.
- **스택 크기 점검**: `uxTaskGetStackHighWaterMark` 로 여유를 확인하고 `configCHECK_FOR_STACK_OVERFLOW` 를 켠다.
- **우선순위 설계**: 제어 루프 > 통신 > 로깅 순으로 두고, 공유 자원은 뮤텍스를 쓴다.
- **정적 할당**: `xTaskCreateStatic` 으로 힙 파편화를 피한다(안전 중시 시스템).

## 언제 쓰나 / 피할 때
- 쓸 때: 작고 검증된 커널로 태스크·큐 정도만 필요할 때, 벤더 SDK 가 이미 FreeRTOS 기반일 때.
- 피할 때(대안): 드라이버·네트워크·보드 이식성까지 통합된 환경은 [Zephyr](/develop-wiki/robotics/embedded/zephyr/), 단일 루프로 충분한 취미 프로젝트는 [Arduino](/develop-wiki/robotics/embedded/arduino/).

## 공식 문서
- [FreeRTOS 문서](https://www.freertos.org/Documentation/00-Overview) · [GitHub(Kernel)](https://github.com/FreeRTOS/FreeRTOS-Kernel)
- [릴리스](https://github.com/FreeRTOS/FreeRTOS-Kernel/releases)
