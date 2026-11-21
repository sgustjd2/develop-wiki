---
name: ros2_control
url: https://control.ros.org
docs: https://control.ros.org
repo: https://github.com/ros-controls/ros2_control
stars: 1069
domain: robotics
category: ros
description: 로봇 하드웨어 인터페이스와 컨트롤러를 분리해 실시간 제어 루프를 구성하는 ROS 2 제어 프레임워크. 관절·그리퍼·바퀴 구동 제어에 쓴다.
pricing: oss
tags: [control, hardware-interface, controller-manager, realtime, ros2]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
ros2_control 은 "하드웨어에 읽고 쓰는 계층"과 "제어 알고리즘 계층"을 플러그인으로 분리한다. Controller Manager 가 주기 루프(read → update → write)를 돌리며 컨트롤러를 로드·활성화하므로, 같은 컨트롤러를 시뮬레이션과 실제 로봇에서 재사용할 수 있다. Apache-2.0. ROS 2 Lyrical 바이너리 버전은 6.13.0 이다(rosdistro 기준).

## 설치
```bash
sudo apt install ros-lyrical-ros2-control ros-lyrical-ros2-controllers
```
`ros2_controllers` 는 joint_state_broadcaster, joint_trajectory_controller, diff_drive_controller 등 표준 컨트롤러 모음이다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Hardware Interface | URDF `<ros2_control>` 태그로 선언하는 하드웨어 플러그인(System/Sensor/Actuator). command·state interface 를 노출 |
| Command / State interface | 예: `joint1/position`(명령), `joint1/velocity`(상태) |
| Controller | state 를 읽어 command 를 계산하는 플러그인 |
| Controller Manager | 하드웨어·컨트롤러 수명주기, 제어 루프 실행, 리소스 충돌 관리 |
| Broadcaster | 상태를 토픽으로 발행(joint_states 등) |
| Chained controller | 컨트롤러 출력을 다른 컨트롤러 입력으로 연결 |

## 기본 사용법
컨트롤러 설정 YAML:
```yaml
controller_manager:
  ros__parameters:
    update_rate: 100
    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster
    arm_controller:
      type: joint_trajectory_controller/JointTrajectoryController

arm_controller:
  ros__parameters:
    joints: [joint1, joint2]
    command_interfaces: [position]
    state_interfaces: [position, velocity]
```
실행 중인 controller_manager 에 컨트롤러를 올리고 확인:
```bash
ros2 run controller_manager spawner joint_state_broadcaster
ros2 run controller_manager spawner arm_controller
ros2 control list_controllers
ros2 control list_hardware_interfaces
```

## 자주 쓰는 패턴
- **mock hardware**: 실기 없이 `mock_components/GenericSystem` 으로 제어 스택을 먼저 검증.
- **시뮬레이션 전환**: URDF 의 하드웨어 플러그인만 Gazebo 용으로 교체.
- **MoveIt 연동**: [MoveIt 2](/develop-wiki/robotics/navigation-planning/moveit2/) 가 joint_trajectory_controller 로 궤적 전달.
- **launch 에서 spawner 사용**: 시작 순서(broadcaster 먼저)를 launch 로 고정.
- 제어 루프는 실시간 스케줄링(RT 커널·우선순위) 설정과 함께 운영한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모터·관절 드라이버를 ROS 2 에 표준 방식으로 연결하고 싶을 때. 구현 언어는 [C++](/develop-wiki/languages/cpp/).
- 피할 때: 드라이버가 토픽 하나로 충분한 단순 로봇, 또는 이미 벤더 제어기가 완결형일 때. 코어는 [ROS 2](/develop-wiki/robotics/ros/ros2/).

## 공식 문서
- [ros2_control 문서](https://control.ros.org) · [GitHub](https://github.com/ros-controls/ros2_control)
