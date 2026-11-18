---
name: micro-ROS
url: https://micro.ros.org
docs: https://micro.ros.org
repo: https://github.com/micro-ROS/micro_ros_setup
stars: 530
domain: robotics
category: embedded
description: ROS 2 를 마이크로컨트롤러에서 쓰게 해 주는 클라이언트 스택. Micro XRCE-DDS 로 에이전트를 거쳐 MCU 노드를 ROS 2 그래프에 연결한다.
pricing: oss
tags: [micro-ros, ros2, rclc, xrce-dds, rtos, microcontroller]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
micro-ROS 는 RAM·CPU 가 제한된 MCU 에서 ROS 2 노드(퍼블리셔·서브스크라이버·서비스·파라미터)를 실행하게 하는 프로젝트다. MCU 쪽은 C 클라이언트 라이브러리 `rclc` 와 Micro XRCE-DDS 클라이언트를 쓰고, 호스트 쪽 **micro-ROS Agent** 가 MCU 와 시리얼·UDP 로 통신하며 DDS 그래프에 대신 참여한다. 따라서 MCU 가 일반 ROS 2 토픽으로 보인다. 지원 RTOS 는 FreeRTOS, Zephyr 등이며 Apache-2.0.
`micro_ros_setup`(이 항목의 repo)이 최신 **6.1.0(2026-08-11)** 이고 저장소에 `humble`, `jazzy`, `kilted`, `lyrical`, `rolling` 브랜치가 있어 최근 ROS 2 배포판을 따라간다(릴리스 노트는 CI·링크·의존성 수정 위주). README 는 이 패키지가 "기본 지원"이며 보드별 정식 통합은 플랫폼 전용 컴포넌트(ESP-IDF 용 `micro_ros_espidf_component`, Zephyr 용 `micro_ros_zephyr_module`, STM32CubeMX 용 유틸 등)를 권한다고 밝힌다. 공식 문서 사이트(micro.ros.org)의 세부 경로는 개편됐을 수 있어 홈에서 따라가는 편이 안전하다.

## 설치
호스트에 ROS 2 가 설치돼 있다고 가정하고 `micro_ros_setup` 을 워크스페이스에 빌드한다.
```bash
source /opt/ros/$ROS_DISTRO/setup.bash
mkdir uros_ws && cd uros_ws
git clone -b $ROS_DISTRO https://github.com/micro-ROS/micro_ros_setup.git src/micro_ros_setup
rosdep update && rosdep install --from-paths src --ignore-src -y
colcon build && source install/local_setup.bash
```
또는 eProsima 가 배포하는 micro-ROS Docker 이미지(클라이언트·에이전트·예제 포함)로 시작할 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| micro-ROS Client | MCU 에서 도는 `rclc` + Micro XRCE-DDS 클라이언트 |
| micro-ROS Agent | 호스트의 브리지 프로세스. XRCE-DDS ↔ DDS 변환 |
| `rclc` | ROS 2 C 클라이언트 API(노드·퍼블리셔·타이머·executor) |
| Executor | 정적 메모리 기반 콜백 스케줄러 |
| Transport | 시리얼(UART/USB)·UDP·CAN 등 MCU↔에이전트 링크 |
| 정적 메모리 | 힙 사용을 줄이는 설계. 메시지 버퍼 크기를 미리 지정 |
| 플랫폼 컴포넌트 | ESP-IDF·Zephyr·STM32CubeMX·Arduino 용 통합 패키지 |

## 기본 사용법
펌웨어 워크스페이스 생성 → 빌드 → 플래시 → 에이전트 실행(명령 형태는 저장소 README):
```bash
ros2 run micro_ros_setup create_firmware_ws.sh freertos nucleo_f446re
ros2 run micro_ros_setup configure_firmware.sh int32_publisher -t serial
ros2 run micro_ros_setup build_firmware.sh
ros2 run micro_ros_setup flash_firmware.sh

ros2 run micro_ros_setup create_agent_ws.sh && ros2 run micro_ros_setup build_agent.sh
source install/local_setup.bash
ros2 run micro_ros_agent micro_ros_agent serial --dev /dev/ttyUSB0
```
MCU 쪽 퍼블리셔의 핵심 코드(`rclc`):
```c
rcl_allocator_t allocator = rcl_get_default_allocator();
rclc_support_t support;
rclc_support_init(&support, 0, NULL, &allocator);
rcl_node_t node;
rclc_node_init_default(&node, "mcu_node", "", &support);
rcl_publisher_t pub;
rclc_publisher_init_default(&pub, &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(std_msgs, msg, Int32), "mcu_counter");
std_msgs__msg__Int32 msg = { .data = 0 };
rcl_publish(&pub, &msg, NULL);   // 타이머 콜백 등에서 주기적으로 호출
```
호스트에서 `ros2 topic echo /mcu_counter` 로 확인한다.

## 자주 쓰는 패턴
- **모터·센서 노드화**: 엔코더·IMU 값을 토픽으로 올리고 `cmd_vel` 을 구독해 모터를 구동한다.
- **보드별 정식 컴포넌트 사용**: ESP32 는 [ESP-IDF](/develop-wiki/robotics/embedded/esp-idf/) 컴포넌트, Zephyr 보드는 [Zephyr](/develop-wiki/robotics/embedded/zephyr/) 모듈을 쓴다.
- **재연결 처리**: 에이전트와 연결이 끊겨도 복구하도록 상태 머신(대기·연결·실행)을 둔다.
- **QoS**: 센서 스트림은 best-effort, 명령은 reliable 로 선택한다.
- **메모리 예산**: 퍼블리셔·구독 수와 메시지 크기에 맞춰 컴파일 시점 설정을 조정한다.

## 언제 쓰나 / 피할 때
- 쓸 때: MCU 위 저수준 제어(모터 드라이버, 센서 노드)를 ROS 2 그래프에 직접 노출하고 싶을 때.
- 피할 때(대안): 단순 시리얼 프로토콜로 충분하면 [PlatformIO](/develop-wiki/robotics/embedded/platformio/)·[Arduino](/develop-wiki/robotics/embedded/arduino/) 로 직접 통신 구현. 리소스가 충분한 보드는 SBC 에서 일반 ROS 2 노드를 돌린다.

## 공식 문서
- [micro-ROS 사이트](https://micro.ros.org) · [micro_ros_setup README](https://github.com/micro-ROS/micro_ros_setup)
- [ESP-IDF 컴포넌트](https://github.com/micro-ROS/micro_ros_espidf_component) · [Zephyr 모듈](https://github.com/micro-ROS/micro_ros_zephyr_module)
