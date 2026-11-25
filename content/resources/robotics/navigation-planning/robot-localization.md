---
name: robot_localization
url: https://docs.ros.org/en/lyrical/p/robot_localization/
docs: https://docs.ros.org/en/lyrical/p/robot_localization/
repo: https://github.com/cra-ros-pkg/robot_localization
stars: 1991
domain: robotics
category: navigation-planning
description: 오도메트리·IMU·GPS 등 여러 센서를 칼만 필터(EKF/UKF)로 융합해 로봇의 위치·자세를 추정하는 ROS 패키지.
pricing: oss
tags: [localization, ekf, ukf, sensor-fusion, imu, gps, odometry]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
robot_localization 은 서로 다른 센서의 오도메트리(`nav_msgs/Odometry`), IMU, 포즈, 트위스트 메시지를 받아 15차원 상태(위치·자세·선속도·각속도·선가속도)를 추정한다. `ekf_node`(확장 칼만), `ukf_node`(무향 칼만), GPS 좌표를 로컬 프레임으로 바꾸는 `navsat_transform_node` 로 구성된다. 저장소 LICENSE 는 BSD 계열(Charles River Analytics, 일부 UT Austin 수정 BSD). GitHub API 는 NOASSERTION. ROS 2 Lyrical 버전 3.11.0, `lyrical-devel` 브랜치가 있고 2026-11 에도 푸시가 이어진다.

## 설치
```bash
sudo apt install ros-lyrical-robot-localization
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `odom` 프레임 필터 | 바퀴 오도메트리·IMU 융합으로 연속적이고 부드러운 `odom → base_link` 발행 |
| `map` 프레임 필터 | 위에 GPS·AMCL·SLAM 포즈를 추가해 `map → odom` 보정 |
| `odomN`, `imuN`, `poseN`, `twistN` | 입력 센서 선언. N 은 0부터 |
| `*_config` | 15개 불리언으로 센서의 어떤 상태를 융합할지 선택 |
| `two_d_mode` | 평면 로봇이면 z·roll·pitch 를 0 으로 고정 |
| `*_differential`, `*_relative` | 절대값 대신 변화량으로 융합 |
| 공분산 | 센서 메시지의 공분산이 신뢰도를 결정. 틀리면 필터가 한쪽에 쏠림 |

## 기본 사용법
`ekf.yaml` — 바퀴 오도메트리의 속도와 IMU 의 yaw·각속도만 융합하는 2D 설정:
```yaml
ekf_filter_node:
  ros__parameters:
    frequency: 30.0
    two_d_mode: true
    map_frame: map
    odom_frame: odom
    base_link_frame: base_link
    world_frame: odom
    odom0: /wheel/odometry
    odom0_config: [false, false, false,  false, false, false,
                   true,  true,  false,  false, false, true,
                   false, false, false]
    imu0: /imu/data
    imu0_config: [false, false, false,  false, false, true,
                  false, false, false,  false, false, true,
                  false, false, false]
```
```bash
ros2 run robot_localization ekf_node --ros-args --params-file ekf.yaml
```
설정 배열 순서는 x,y,z / roll,pitch,yaw / vx,vy,vz / vroll,vpitch,vyaw / ax,ay,az 이다.

## 자주 쓰는 패턴
- **필터 2개 구성**: `odom` 용(연속성) + `map` 용(GPS·절대 보정) 필터 분리.
- **GPS 융합**: `navsat_transform_node` 로 `NavSatFix` 를 오도메트리로 변환해 두 번째 필터에 입력.
- **같은 변수를 중복 입력하지 않기**: 바퀴 yaw 와 IMU yaw 를 모두 절대값으로 넣으면 서로 충돌한다. 한 센서는 속도, 다른 센서는 자세로 역할을 나눈다.
- **Nav2 연동**: 필터가 발행하는 `odom → base_link` TF 와 `/odometry/filtered` 를 [Nav2](/develop-wiki/robotics/navigation-planning/nav2/) 가 사용.
- `diagnostics` 와 `print_diagnostics` 로 입력 누락·공분산 문제를 점검.

## 언제 쓰나 / 피할 때
- 쓸 때: 바퀴 슬립·IMU 드리프트를 서로 보완해 안정적인 odom 을 만들 때, GPS 와 결합해 실외 위치를 낼 때.
- 피할 때: 지도 기반 전역 위치 추정(라이다 스캔 매칭)은 AMCL, SLAM([slam_toolbox](/develop-wiki/robotics/perception/slam-toolbox/), [RTAB-Map](/develop-wiki/robotics/perception/rtabmap/)). 비선형이 매우 강하거나 시각-관성 오도메트리가 필요하면 전용 VIO 를 검토한다. 코어 [ROS 2](/develop-wiki/robotics/ros/ros2/).

## 공식 문서
- [패키지 문서(Lyrical)](https://docs.ros.org/en/lyrical/p/robot_localization/) · [GitHub](https://github.com/cra-ros-pkg/robot_localization)
