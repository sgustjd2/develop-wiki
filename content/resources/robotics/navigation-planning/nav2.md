---
name: Nav2
url: https://nav2.org
docs: https://docs.nav2.org/lyrical/index.html
repo: https://github.com/ros-navigation/navigation2
stars: 5119
domain: robotics
category: navigation-planning
description: ROS 2 의 이동 로봇 내비게이션 스택. 지도 기반 위치 추정, 경로 계획, 장애물 회피 제어, 행동 트리 기반 복구 동작을 제공한다.
pricing: oss
tags: [nav2, navigation, costmap, amcl, behavior-tree, mobile-robot]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Nav2 는 "A 지점에서 B 지점으로 안전하게 이동"을 위한 ROS 2 패키지 묶음이다. 목표 하나를 받으면 플래너 서버가 전역 경로를, 컨트롤러 서버가 지역 경로 추종과 장애물 회피를, 행동 서버가 후진·회전·대기 같은 복구 동작을 맡고, 이 흐름을 **행동 트리(BT Navigator)** 가 조율한다. 각 단계는 플러그인이라 알고리즘을 YAML 로 교체한다.

라이선스는 패키지별로 다르다(저장소 LICENSE: Apache-2.0, BSD-3-Clause, LGPL-2.1-or-later 혼합. GitHub API 는 NOASSERTION). ROS 2 Lyrical 바이너리 버전은 1.5.3 이고 `lyrical` 브랜치가 있다(Jazzy·Humble 브랜치도 유지).

## 설치
```bash
sudo apt install ros-lyrical-navigation2 ros-lyrical-nav2-bringup
```
시뮬레이션 데모는 TurtleBot3 패키지와 Gazebo 가 추가로 필요하다(문서의 Getting Started 참고).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `nav2_bt_navigator` | `NavigateToPose` 등 액션을 받아 행동 트리를 실행하는 오케스트레이터 |
| Planner Server | 전역 경로 생성 플러그인(NavFn, Smac 2D/Hybrid/Lattice, ThetaStar) |
| Controller Server | 경로 추종 플러그인(DWB, MPPI, Regulated Pure Pursuit, Rotation Shim 등) |
| Costmap 2D | 전역·지역 비용 지도. 레이어(static, obstacle, voxel, inflation)로 구성 |
| Behavior Server | spin, backup, wait, drive-on-heading 등 복구 동작 |
| Smoother / Route Server | 경로 평활화, 사전 정의된 그래프 경로 |
| Map Server / AMCL | 지도 제공, 파티클 필터 위치 추정. SLAM 이면 [slam_toolbox](/develop-wiki/robotics/perception/slam-toolbox/) 와 조합 |
| Lifecycle Manager | 서버들을 순서대로 configure/activate |
| Collision Monitor | 속도 명령을 최종 검사해 충돌 직전 감속·정지 |

## 기본 사용법
Python 으로 목표 지점 주행(`nav2_simple_commander`):
```python
import rclpy
from geometry_msgs.msg import PoseStamped
from nav2_simple_commander.robot_navigator import BasicNavigator

rclpy.init()
nav = BasicNavigator()
nav.waitUntilNav2Active()

goal = PoseStamped()
goal.header.frame_id = "map"
goal.header.stamp = nav.get_clock().now().to_msg()
goal.pose.position.x, goal.pose.position.y = 2.0, 0.5
goal.pose.orientation.w = 1.0

nav.goToPose(goal)
while not nav.isTaskComplete():
    pass                      # nav.getFeedback() 로 진행 확인
print(nav.getResult())
rclpy.shutdown()
```
파라미터 YAML 에서 컨트롤러 교체(요지):
```yaml
controller_server:
  ros__parameters:
    controller_plugins: ["FollowPath"]
    FollowPath:
      plugin: "nav2_mppi_controller::MPPIController"
```

## 자주 쓰는 패턴
- **먼저 TF·오도메트리 확인**: `map → odom → base_link` 체인과 `/odom`, 센서 토픽이 정상이어야 한다. 위치 추정은 [robot_localization](/develop-wiki/robotics/navigation-planning/robot-localization/) 로 센서 융합.
- **행동 트리 커스터마이즈**: 기본 XML 트리를 복사해 재시도·복구 순서를 바꾸고, 필요하면 [BehaviorTree.CPP](/develop-wiki/robotics/navigation-planning/behavior-tree-cpp/) 노드를 플러그인으로 추가.
- **다중 지점 주행**: `followWaypoints`, `goThroughPoses`.
- **시각화**: [RViz2](/develop-wiki/robotics/ros/rviz2/) 에서 `2D Pose Estimate`/`Goal Pose`, costmap 확인.
- **로봇에 맞는 footprint·inflation 반경** 이 가장 흔한 튜닝 지점이다.

## 언제 쓰나 / 피할 때
- 쓸 때: 바퀴형 이동 로봇(차동·옴니·카 라이크)의 실내외 자율 주행. 코어는 [ROS 2](/develop-wiki/robotics/ros/ros2/).
- 피할 때: 매니퓰레이터 동작 계획은 [MoveIt 2](/develop-wiki/robotics/navigation-planning/moveit2/). 지도 없이 단순 추종이면 직접 구현이 더 가볍다. 드론·수중 로봇은 별도 스택을 본다.

## 공식 문서
- [Nav2 문서(Lyrical)](https://docs.nav2.org/lyrical/index.html) · [Getting Started](https://docs.nav2.org/lyrical/getting_started/index.html) · [튜토리얼](https://docs.nav2.org/lyrical/tutorials/index.html) · [API 문서](https://api.nav2.org)
