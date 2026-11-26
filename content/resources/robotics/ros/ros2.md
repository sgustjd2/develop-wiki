---
name: ROS 2
url: https://www.ros.org
docs: https://docs.ros.org/en/lyrical/
repo: https://github.com/ros2/ros2
stars: 6353
domain: robotics
category: ros
description: 노드가 토픽·서비스·액션으로 통신하는 로봇 소프트웨어 미들웨어 프레임워크. 센서·제어·내비게이션 패키지를 조합해 로봇 앱을 만들 때 쓴다.
pricing: oss
tags: [ros2, middleware, dds, lts, colcon, rclcpp, rclpy]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
ROS 2 는 로봇 소프트웨어를 **노드(프로세스)** 단위로 쪼개고, 노드끼리 토픽(발행/구독), 서비스(요청/응답), 액션(오래 걸리는 목표), 파라미터로 통신하게 하는 프레임워크다. 통신 계층은 RMW(ROS Middleware) 인터페이스 뒤에 숨어 있어 DDS 구현(Fast DDS, Cyclone DDS)이나 Zenoh 로 바꿀 수 있다. 운영체제가 아니라 라이브러리·도구·패키지 생태계(내비게이션, 제어, 시각화 …)의 묶음이다. 라이선스는 핵심 코드 대부분 Apache-2.0 이다(패키지별로 다름).

배포판은 매년 5월 23일(World Turtle Day) 무렵 나온다. 홀수 해 5월 배포판은 5년 지원 LTS 가 아니라 약 1.5년 지원 일반 배포판이고, 짝수 해 배포판이 LTS 다. 2026-11 기준 최신 LTS 는 **Lyrical Luth**(2026-05-22)다.

## 설치
현재 배포판과 지원 종료일(docs.ros.org Distributions 표 기준):

| 배포판 | 릴리스 | EOL | 비고 |
| --- | --- | --- | --- |
| Lyrical Luth | 2026-05-22 | 2031-05 | 현재 LTS. Ubuntu 26.04 |
| Kilted Kaiju | 2025-05-23 | 2026-12 | 비 LTS, 곧 종료 |
| Jazzy Jalisco | 2024-05-23 | 2029-05 | LTS. Ubuntu 24.04 |
| Humble Hawksbill | 2022-05-23 | 2027-05 | LTS. Ubuntu 22.04, 종료 임박 |
| Rolling Ridley | 상시 | - | 개발 배포판, 다음 Makoa Mata-mata(2027-05) 준비용 |

Lyrical 지원 플랫폼: Ubuntu 26.04 (amd64·arm64 Tier 1), Windows 11 (Tier 1), RHEL 10 (Tier 2). Ubuntu 24.04·Debian 13 등은 Tier 3(소스 빌드). 최소 요건은 C++20, Python 3.12~3.14.

```bash
# Ubuntu 26.04 — 공식 문서의 apt 저장소 설정(ros-apt-source)을 마친 뒤
sudo apt update
sudo apt install ros-lyrical-desktop ros-dev-tools
source /opt/ros/lyrical/setup.bash
ros2 run demo_nodes_cpp talker     # 다른 터미널에서 listener
```
저장소 등록 절차는 배포판별로 바뀌므로 반드시 [설치 문서](https://docs.ros.org/en/lyrical/Get-Started/Installation.html)를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Node | 하나의 기능을 맡는 실행 단위. 한 프로세스에 여러 노드(Composition)도 가능 |
| Topic | 이름·메시지 타입이 있는 발행/구독 스트림. 센서 데이터, 상태 |
| Service | 짧은 요청-응답 RPC |
| Action | 목표(goal)-피드백-결과로 구성된 장시간 작업. 취소 가능 (예: 목적지 이동) |
| Parameter | 노드 설정값. 런타임 변경, YAML 로 로드 |
| QoS | reliability, durability, history, depth 등 통신 품질 정책. 발행·구독 쌍이 호환돼야 연결 |
| RMW | 미들웨어 추상화. `RMW_IMPLEMENTATION` 환경 변수로 선택. Lyrical 문서 기준 기본값은 Fast DDS |
| Lifecycle node | configure → activate 상태 기계를 가진 관리형 노드 |
| TF2 | 좌표 프레임 사이 변환 트리를 관리 |
| ROS_DOMAIN_ID | 같은 네트워크에서 그래프를 분리하는 번호 |

## 기본 사용법
Python 노드(rclpy) 하나로 발행과 구독을 한다.
```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class Echo(Node):
    def __init__(self):
        super().__init__("echo")
        self.pub = self.create_publisher(String, "chatter", 10)
        self.create_subscription(String, "chatter", self.on_msg, 10)
        self.create_timer(1.0, self.tick)
        self.n = 0

    def tick(self):
        self.pub.publish(String(data=f"hello {self.n}"))
        self.n += 1

    def on_msg(self, msg):
        self.get_logger().info(f"heard: {msg.data}")

rclpy.init()
rclpy.spin(Echo())
```
launch 파일(Python)로 노드 두 개를 띄운다.
```python
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(package="demo_nodes_cpp", executable="talker"),
        Node(package="demo_nodes_cpp", executable="listener"),
    ])
```
자주 쓰는 CLI: `ros2 topic list|echo|hz`, `ros2 node info`, `ros2 service call`, `ros2 action send_goal`, `ros2 param get`, `ros2 bag record -a`, `ros2 doctor`.

## 자주 쓰는 패턴
- **QoS 맞추기**: 센서 스트림은 `SensorDataQoS`(best effort), 한 번 보내고 늦게 붙는 구독자에게도 필요한 데이터(지도 등)는 transient local.
- **Composition**: 노드를 한 프로세스의 컴포넌트로 올려 복사 없는 intra-process 통신으로 지연을 줄인다.
- **YAML 파라미터 + launch**: 설정을 코드에서 분리하고 로봇별로 파일만 교체.
- **rosbag2**: 현장 데이터를 기록하고 재생하며 알고리즘을 오프라인 검증.
- **네임스페이스·remap**: 같은 노드를 여러 대 로봇에 재사용.
- Lyrical 신규: Events executor 콜백 그룹, rclpy `AsyncNode`(asyncio), `rosidl::Buffer` 로 복사 없이 대용량 메시지 전달(Fast DDS·rmw_zenoh), launch 의 메시지별 로그 심각도.

## 언제 쓰나 / 피할 때
- 쓸 때: 센서·구동기가 여럿이고 [Nav2](/develop-wiki/robotics/navigation-planning/nav2/), [MoveIt 2](/develop-wiki/robotics/navigation-planning/moveit2/), [ros2_control](/develop-wiki/robotics/ros/ros2-control/) 같은 기존 패키지를 재사용할 때. C++ 은 [/develop-wiki/languages/cpp/](/develop-wiki/languages/cpp/), Python 은 [/develop-wiki/languages/python/](/develop-wiki/languages/python/) 참고.
- 피할 때: 단일 마이크로컨트롤러 펌웨어나 단순 스크립트 로봇은 과하다. 하드 실시간 제어 루프는 ROS 노드 밖(RTOS·ros2_control 실시간 루프)에 둔다. 배포판은 5월마다 바뀌고 ABI·메시지 호환이 배포판 간 보장되지 않으므로 한 로봇은 한 배포판으로 통일한다.

## 공식 문서
- [Lyrical 문서](https://docs.ros.org/en/lyrical/) · [릴리스 목록](https://docs.ros.org/en/rolling/Releases.html) · [Lyrical 지원 플랫폼](https://docs.ros.org/en/lyrical/Releases/lyrical/supported-platforms.html) · [REP-2000](https://reps.openrobotics.org/rep-2000/) · [First Steps](https://docs.ros.org/en/lyrical/First-Steps.html) · [RMW 구현](https://docs.ros.org/en/lyrical/Get-Started/Installation/RMW-Implementations.html)
