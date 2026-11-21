---
name: slam_toolbox
url: https://github.com/SteveMacenski/slam_toolbox
docs: https://docs.ros.org/en/ros2_packages/lyrical/api/slam_toolbox/
repo: https://github.com/SteveMacenski/slam_toolbox
stars: 2725
domain: robotics
category: perception
description: 2D 라이다 SLAM ROS 2 패키지. 온라인(async/sync) 매핑, 지도 저장·재개, 루프 클로저, 로컬라이제이션 모드를 제공하며 Nav2 문서에서 SLAM 으로 쓰는 패키지다.
pricing: oss
tags: [slam, lidar, 2d, mapping, localization, nav2]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
slam_toolbox 는 2D 라이다 스캔과 오도메트리로 점유 격자 지도를 만들고 `map → odom` 변환을 발행하는 SLAM 패키지다(Karto 기반 그래프 SLAM, Ceres 최적화). 매핑 중에 지도를 직렬화해 저장하고 나중에 이어서 매핑하거나, 저장한 지도에서 로컬라이제이션만 할 수 있다. 라이선스는 LGPL-2.1. 2026-11 기준 릴리스 2.10.0(2026-07), `lyrical`/`kilted`/`jazzy` 브랜치가 유지되고 Lyrical 패키지는 2.10.0-2 다.

## 설치
```bash
sudo apt install ros-lyrical-slam-toolbox
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| online async | 최신 스캔을 처리하고 밀린 스캔은 버림. 실시간 로봇의 기본 |
| online sync | 모든 스캔을 처리. 오프라인·느린 재생에 적합 |
| offline | 저장한 데이터로 지도 생성 |
| lifelong / localization | 저장된 포즈 그래프 위에서 위치 추정, 필요 시 지도 확장 |
| 루프 클로저 | 이전에 본 장소를 인식해 누적 오차 보정 |
| 파라미터 | `resolution`, `max_laser_range`, `minimum_travel_distance`, `do_loop_closing`, `mode` |
| 플러그인 RViz 패널 | 지도 저장·직렬화·인터랙티브 편집 |

## 기본 사용법
```bash
ros2 launch slam_toolbox online_async_launch.py \
  slam_params_file:=$HOME/mapper_params_online_async.yaml use_sim_time:=false
```
파라미터 파일 예(요지):
```yaml
slam_toolbox:
  ros__parameters:
    odom_frame: odom
    map_frame: map
    base_frame: base_footprint
    scan_topic: /scan
    mode: mapping            # 저장된 지도로 위치 추정만 하려면 localization
    resolution: 0.05
    max_laser_range: 12.0
    do_loop_closing: true
```
지도를 Nav2 용으로 저장: `ros2 run nav2_map_server map_saver_cli -f my_map` (포즈 그래프 저장은 RViz 패널의 Serialize Map).

## 자주 쓰는 패턴
- **Nav2 와 동시 실행**: SLAM 으로 지도를 만들면서 [Nav2](/develop-wiki/robotics/navigation-planning/nav2/) 로 주행(탐사). 이미 지도가 있으면 localization 모드 또는 AMCL.
- **오도메트리 품질 확보**: 바퀴 오도메트리는 [robot_localization](/develop-wiki/robotics/navigation-planning/robot-localization/) 으로 융합해 입력.
- **TF 프레임 점검**: `base_frame`, `odom_frame` 불일치가 가장 흔한 오류.
- **시뮬레이션**: `use_sim_time:=true` 를 모든 노드에서 일치시킨다.

## 언제 쓰나 / 피할 때
- 쓸 때: 2D 라이다가 있는 실내 이동 로봇의 지도 작성과 위치 추정.
- 피할 때: 3D 라이다·RGB-D·시각 SLAM 은 [RTAB-Map](/develop-wiki/robotics/perception/rtabmap/) 등. 라이다 없이 카메라만 있으면 시각 SLAM 을 본다.
- **보류한 대안**: Cartographer 는 저장소 마지막 푸시가 2024-01 이라 정체 상태로 보고 항목을 만들지 않았다(Apache-2.0, 별 8013). ORB-SLAM3 는 GPL-3.0 이며 마지막 푸시 2024-07 이라 같은 이유로 제외했다.

## 공식 문서
- [패키지 문서(Lyrical)](https://docs.ros.org/en/ros2_packages/lyrical/api/slam_toolbox/) · [GitHub README](https://github.com/SteveMacenski/slam_toolbox)
