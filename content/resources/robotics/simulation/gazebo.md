---
name: Gazebo
url: https://gazebosim.org
docs: https://gazebosim.org/docs/latest/getstarted/
repo: https://github.com/gazebosim/gz-sim
stars: 1597
domain: robotics
category: simulation
description: ROS 2와 함께 가장 널리 쓰이는 오픈소스 로봇 시뮬레이터. SDFormat 월드·센서·플러그인 기반이며 ros_gz 로 ROS 2 와 연결한다.
pricing: oss
tags: [gazebo, gz-sim, simulation, ros2, sdformat, ros_gz]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Gazebo(구 Ignition Gazebo, 저장소 `gz-sim`)는 물리 엔진·센서 모델·3D 렌더링을 묶은 로봇 시뮬레이터다. 월드와 로봇은 SDFormat(SDF) XML 로 기술하고, 기능은 ECS(엔티티-컴포넌트-시스템) 구조의 시스템 플러그인으로 확장한다. 통신은 Gazebo Transport(토픽 pub/sub)를 쓰며, ROS 2 와는 `ros_gz` 브리지 패키지로 토픽·서비스를 매핑한다.
**Jetty(gz-sim 10, LTS) 기준**. 릴리스 이름은 알파벳 순이며 Harmonic(LTS, ROS 2 Jazzy 짝), Ionic(ROS 2 Kilted 짝), Jetty(LTS, ROS 2 Lyrical 짝)가 현재 지원 대상이다. 버전 조합은 공식 "Installing Gazebo with ROS" 표로 확인한다. 옛 "Gazebo Classic"(gazebo11)은 별개의 구세대 제품이다. 단일 GPU 대규모 병렬 학습이 목적이면 [MuJoCo](/develop-wiki/robotics/simulation/mujoco/) 계열이나 [Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/) 이 더 맞다.

## 설치
Ubuntu 24.04/26.04 에서 Jetty 바이너리(공식 저장소 `packages.osrfoundation.org` 등록 후):
```bash
sudo apt-get update
sudo apt-get install gz-jetty        # 메타패키지. GUI 없는 서버만: gz-sim10-server
gz sim shapes.sdf                    # 설치 확인
```
ROS 2 연동은 ROS 배포판에 맞는 짝을 쓴다(예: Jazzy + Harmonic). macOS(arm64)·소스 빌드도 공식 문서에 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| SDFormat(SDF) | 월드·모델·링크·조인트·센서를 기술하는 XML 포맷. URDF 보다 시뮬레이션 요소가 풍부 |
| World / Model | 월드는 물리·조명·모델 집합, 모델은 링크와 조인트로 이루어진 로봇·물체 |
| System 플러그인 | 물리, 센서, 사용자 커맨드, 디퍼렌셜 드라이브 등 기능 단위(ECS 시스템) |
| Gazebo Transport | 프로세스 간 토픽·서비스 통신. `gz topic`, `gz service` CLI 제공 |
| 물리 엔진 | 기본 DART, 플러그인으로 다른 엔진 선택 가능 |
| `ros_gz_bridge` | Gazebo 토픽과 ROS 2 토픽 사이 메시지 변환·전달 |
| Fuel | 모델·월드 공유 온라인 저장소 |

## 기본 사용법
월드 실행과 토픽 확인:
```bash
gz sim -r empty.sdf          # -r: 시작 즉시 실행
gz topic -l                  # 토픽 목록
gz topic -e -t /stats        # 시뮬레이션 통계 구독
```
최소 SDF 월드(직접 작성, 박스 하나):
```xml
<sdf version="1.9">
  <world name="demo">
    <model name="box">
      <pose>0 0 0.5 0 0 0</pose>
      <link name="link">
        <collision name="c"><geometry><box><size>1 1 1</size></box></geometry></collision>
        <visual name="v"><geometry><box><size>1 1 1</size></box></geometry></visual>
      </link>
    </model>
  </world>
</sdf>
```
`gz sim -r demo.sdf` 로 열 수 있다. 바닥(ground plane)·조명·물리 시스템 설정이 없는 최소 예시이므로, 실제 작업은 공식 예제 월드(`shapes.sdf` 등)를 복사해 시작점으로 삼는다.

## 자주 쓰는 패턴
- **ROS 2 브리지**: `ros2 run ros_gz_bridge parameter_bridge /cmd_vel@geometry_msgs/msg/Twist]gz.msgs.Twist` 처럼 `토픽@ROS타입[Gazebo타입` 문법으로 방향·타입을 지정한다. 많을 때는 YAML 설정 파일을 쓴다.
- **ros_gz_sim 으로 스폰**: 런치 파일에서 `ros_gz_sim` 의 `create` 노드로 URDF/SDF 로봇을 런타임에 생성한다.
- **헤드리스 CI**: `gz sim -s -r world.sdf`(서버만)로 GPU·디스플레이 없이 테스트한다.
- **센서 플러그인**: 라이다·카메라·IMU 를 SDF 의 `<sensor>` 로 선언하고 토픽을 ROS 로 브리지한다.
- **URDF 변환**: ROS 로봇 URDF 를 SDF 로 변환해(`gz sdf -p`) 쓰거나 `ros_gz_sim` 이 URDF 를 직접 받게 한다.

## 언제 쓰나 / 피할 때
- 쓸 때: ROS 2 노드·내비게이션 스택(Nav2 등)의 통합 테스트, 모바일 로봇·드론·매니퓰레이터 시뮬레이션, 오픈소스 Apache-2.0 환경이 필요할 때.
- 피할 때(대안): 접촉이 많은 조작·강화학습 대규모 병렬화는 [MuJoCo](/develop-wiki/robotics/simulation/mujoco/)(MJX/Warp)·[Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/), 사진 수준 렌더링·합성 데이터는 [Isaac Sim](/develop-wiki/robotics/simulation/isaac-sim/).

## 공식 문서
- [Getting Started](https://gazebosim.org/docs/latest/getstarted/) · [Ubuntu 설치](https://gazebosim.org/docs/latest/install_ubuntu/) · [ROS 와 함께 설치](https://gazebosim.org/docs/latest/ros_installation/)
- [저장소](https://github.com/gazebosim/gz-sim)
