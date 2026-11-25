---
name: MoveIt 2
url: https://moveit.ros.org
docs: https://moveit.picknik.ai/main/index.html
repo: https://github.com/moveit/moveit2
stars: 2134
domain: robotics
category: navigation-planning
description: ROS 2 로봇 팔 모션 플래닝 프레임워크. 역기구학, 충돌 회피 경로 계획, 궤적 생성, 파지·Planning Scene 관리를 제공한다.
pricing: oss
tags: [moveit, manipulation, motion-planning, ik, ompl, collision]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
MoveIt 2 는 매니퓰레이터가 "현재 자세에서 목표 자세(또는 말단 위치)로 충돌 없이 가는 궤적"을 계산하고 실행하게 하는 프레임워크다. 로봇 모델(URDF/SRDF)과 Planning Scene(장애물 포함)을 유지하고, 플래너 플러그인([OMPL](/develop-wiki/robotics/navigation-planning/ompl/), Pilz, STOMP, CHOMP 등)과 IK 솔버, 궤적 후처리(시간 매개변수화)를 조합한다. BSD-3-Clause. ROS 2 Lyrical 바이너리 버전은 2.15.2 다(rosdistro 기준). README 상 `main` 은 개발 브랜치이고 humble/jazzy/kilted 는 안정 브랜치다.

## 설치
```bash
sudo apt install ros-lyrical-moveit
```
로봇별 설정은 **MoveIt Setup Assistant**(`ros2 launch moveit_setup_assistant setup_assistant.launch.py`)로 SRDF·컨트롤러·launch 파일을 생성한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `move_group` | 계획·실행 요청을 받는 중심 노드 |
| Planning Group | SRDF 로 정의한 관절 묶음(예: `arm`, `gripper`) |
| Planning Scene | 로봇 상태 + 월드 장애물(박스, 메시, OctoMap) |
| Planning Pipeline | 요청 어댑터 → 플래너(OMPL/Pilz/…) → 후처리 어댑터 |
| MoveGroupInterface | C++ 고수준 API. `moveit_py` 는 Python 바인딩 |
| MoveIt Servo | 실시간 텔레옵(트위스트·조인트 속도 입력) |
| MoveIt Task Constructor | 접근→파지→이동 같은 다단계 작업을 스테이지로 구성 |
| 컨트롤러 인터페이스 | 궤적을 [ros2_control](/develop-wiki/robotics/ros/ros2-control/) 등으로 전달 |

## 기본 사용법
C++ MoveGroupInterface 로 이름 붙은 자세로 이동(그룹명 `arm` 은 예시):
```cpp
#include <moveit/move_group_interface/move_group_interface.hpp>
#include <rclcpp/rclcpp.hpp>

int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  rclcpp::NodeOptions opts;
  opts.automatically_declare_parameters_from_overrides(true);
  auto node = rclcpp::Node::make_shared("demo_move", opts);
  rclcpp::executors::SingleThreadedExecutor exec;
  exec.add_node(node);
  std::thread spinner([&exec] { exec.spin(); });   // 상태 수신을 위해 필요

  moveit::planning_interface::MoveGroupInterface group(node, "arm");
  group.setNamedTarget("ready");                   // SRDF 에 정의된 자세
  moveit::planning_interface::MoveGroupInterface::Plan plan;
  if (group.plan(plan) == moveit::core::MoveItErrorCode::SUCCESS)
    group.execute(plan);

  rclcpp::shutdown();
  spinner.join();
}
```
헤더 확장자(`.hpp`/`.h`)는 배포판·버전에 따라 다르니 설치된 헤더를 확인한다.

## 자주 쓰는 패턴
- **장애물 추가**: `PlanningSceneInterface::applyCollisionObject` 로 책상·벽을 등록하면 플래너가 회피.
- **카르테시안 직선 경로**: `computeCartesianPath` 로 말단을 직선 이동(용접·삽입).
- **플래너 선택**: 자유 공간은 OMPL, 직선·원호는 Pilz, 매끈한 궤적은 CHOMP/STOMP 등으로 파이프라인별 설정.
- **실시간 조작**: MoveIt Servo 로 조이스틱·VR 입력을 속도 명령으로 변환.
- **시뮬레이션 먼저**: mock hardware 또는 Gazebo + [RViz2](/develop-wiki/robotics/ros/rviz2/) 의 MotionPlanning 플러그인으로 확인 후 실기.

## 언제 쓰나 / 피할 때
- 쓸 때: 6축 팔·듀얼 암·모바일 매니퓰레이터의 충돌 회피 계획, 픽앤플레이스.
- 피할 때: 이동 로봇 주행은 [Nav2](/develop-wiki/robotics/navigation-planning/nav2/). 관절 1~2개짜리 단순 구동, 학습 기반 정책으로만 제어하는 경우는 과하다. 코어 [ROS 2](/develop-wiki/robotics/ros/ros2/).

## 공식 문서
- [MoveIt 문서](https://moveit.picknik.ai/main/index.html) · [첫 프로젝트 튜토리얼](https://moveit.picknik.ai/main/doc/tutorials/your_first_project/your_first_project.html) · [GitHub](https://github.com/moveit/moveit2)
