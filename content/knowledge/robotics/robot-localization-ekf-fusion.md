---
title: robot_localization — EKF 센서 융합 구성
aka: [robot_localization, ekf_node, ukf_node, navsat_transform_node, EKF fusion config]
category: robotics
group: estimation
level: intermediate
summary: robot_localization 의 EKF 노드는 오도메트리·IMU·GPS 등을 15차원 상태에 합친다. 센서마다 어떤 변수를 쓸지 15개 불리언으로 고르고, odom 용과 map 용 두 인스턴스로 연속성과 전역 정합을 나눈다.
tags: [robotics, ros2, robot-localization, ekf, sensor-fusion, imu, odometry, gps, tf]
related: [robotics/kalman-filter-ekf, robotics/sensor-fusion-time-sync, robotics/coordinate-frames-tf, robotics/particle-filter-mcl, robotics/nav2-architecture, robotics/slam-concepts]
sources:
  - https://github.com/cra-ros-pkg/robot_localization/blob/ros2/doc/state_estimation_nodes.rst
  - https://github.com/cra-ros-pkg/robot_localization/blob/ros2/doc/preparing_sensor_data.rst
  - https://github.com/cra-ros-pkg/robot_localization/blob/ros2/doc/integrating_gps.rst
  - https://www.ros.org/reps/rep-0105.html
  - https://www.ros.org/reps/rep-0103.html
updatedAt: 2026-11-19
---

> 출처 메모: 패키지 문서(ros2 브랜치 `doc/*.rst`)를 직접 읽었다. 패키지 저자의 논문(Moore & Stouch, 2014)과 EKF 내부 수식(상태 전이 야코비안) 구현은 읽지 않았다. 아래 YAML 은 문서의 파라미터 이름을 따른 설명용이며 ROS 2 배포판별 파라미터 철자·기본값은 해당 버전 문서를 확인한다.

## 문제

이동 로봇에는 서로 다른 성질의 위치 정보가 여럿 있다. 휠 오도메트리는 매끄럽지만 드리프트하고, GPS 는 드리프트가 없지만 튀며, IMU 는 빠르지만 적분하면 틀어진다. 이들을 직접 이어 붙이면 좌표가 불연속하거나 프레임 규약(REP-105)이 깨진다. 칼만 필터 이론([칼만 필터와 EKF](/develop-wiki/knowledge/robotics/kalman-filter-ekf/))은 알아도, 실제 현장의 어려움은 "어떤 센서의 어떤 변수를 어떤 프레임으로" 넣을지의 **구성** 에 있다.

## 해법: 15차원 상태와 센서별 마스크

문서의 `ekf_localization_node`(배포판에 따라 노드 실행 파일 이름이 다를 수 있다)는 전방향 운동 모델로 상태를 예측하고 센서로 보정한다. 상태는 위치 3, 자세 3, 선속도 3, 각속도 3, 선가속도 3 의 15 차원이다. 센서마다 15 개 불리언 설정(`odom0_config` 등)으로 그 센서에서 **어떤 변수를 융합할지** 고른다. 순서는 X, Y, Z, roll, pitch, yaw, Ẋ, Ẏ, Ż, roll̊, pitch̊, yaẘ, Ẍ, Ÿ, Z̈ 이다. 설정은 센서의 `frame_id` 기준이다.

```yaml
# 휠 오도메트리에서 전진 속도와 yaw 속도만 사용 (위치는 적분값이라 제외)
odom0: wheel/odometry
odom0_config: [false, false, false,   # x y z
               false, false, false,   # roll pitch yaw
               true,  false, false,   # vx vy vz
               false, false, true,    # vroll vpitch vyaw
               false, false, false]   # ax ay az
```

```ts
const NAMES = ['x','y','z','roll','pitch','yaw','vx','vy','vz','vroll','vpitch','vyaw','ax','ay','az'] as const;
export const fused = (cfg: boolean[]) => NAMES.filter((_, i) => cfg[i]);
// 위 YAML -> ['vx', 'vyaw']
```

### 프레임 설정: odom 인스턴스와 map 인스턴스

문서가 권하는 구성은 다음이다.

1. 연속 데이터만 융합하는 인스턴스(오도메트리, IMU, 연속적인 시각 오도메트리 등). `world_frame` 을 `odom_frame` 으로 둔다. 지역 계획과 제어는 이 프레임에서 한다.
2. GPS 처럼 불연속하게 튈 수 있는 전역 데이터까지 융합하는 인스턴스. `world_frame` 을 `map_frame` 으로 두고, `odom → base_link` 변환은 다른 곳(보통 위 1번 인스턴스)이 내야 한다.

GPS 의 위도·경도는 `navsat_transform_node` 가 로봇의 시작 자세에 맞춘 프레임으로 바꿔 준다. 이때 GPS 입력의 `_differential` 은 false 여야 한다. 단일 인스턴스에 다 넣어도 되지만, 문서는 GPS 를 포함한 추정이 불연속하므로 내비게이션 모듈이 쓰기에는 부적합할 수 있다고 경고한다. 지도 기반 위치 추정은 [AMCL](/develop-wiki/knowledge/robotics/particle-filter-mcl/)이 `map → odom` 을 맡는 구성과 짝지어 쓰이기도 한다.

### 입력 데이터 규칙

- REP-103(단위·축 부호), REP-105(프레임) 를 지킨다. 로봇이 반시계로 돌면 yaw 속도는 양수여야 한다.
- 오도메트리에서 위치와 선속도가 함께 오면 **속도를 융합**, 자세와 각속도가 함께 오면 **자세를 융합**하라는 것이 문서의 일반 권고다.
- IMU 가속도는 조심한다. 수평으로 놓은 IMU 는 Z 축에 +9.81 m/s² 를 읽는다고 가정한다. `imuN_remove_gravitational_acceleration` 으로 중력 제거 여부를 정한다.
- **공분산이 중요하다.** 원치 않는 변수를 "분산을 키워" 무시하지 말고 해당 불리언을 false 로 둔다. (스칼라 칼만 이득을 직접 계산하면 사전 분산 1 에서 R 이 1, 100, 1e4, 1e6 일 때 이득이 0.5, 9.9e-3, 1e-4, 1e-6 으로 줄어들 뿐 0 이 되지 않는다.)
- 센서 주기보다 `frequency` 가 낮으면 `*_queue_size` 를 키워 사이에 도착한 측정을 모두 쓴다. `sensor_timeout` 이 지나면 보정 없이 예측만 한다.
- 평면 로봇이면 `two_d_mode: true` 로 Z·roll·pitch 와 그 속도·가속도에 0 을 융합해 공분산이 터지는 것을 막는다.
- `_differential`(측정 차분을 속도로 변환)은 절대 자세를 쓰면 그 변수의 공분산이 무한히 커질 수 있어 방향 데이터에는 주의가 필요하다. 시작값을 0 으로 맞추려면 `_relative` 를 쓴다.

## 언제 쓰나

- 휠 오도메트리 + IMU 로 매끄러운 `odom → base_link` 를 만들 때.
- GPS 를 더해 실외 `map` 프레임 추정을 만들 때(이중 인스턴스).
- Nav2 같은 스택에 입력할 오도메트리를 정리할 때([Nav2 구조](/develop-wiki/knowledge/robotics/nav2-architecture/)).

## 주의/비용

- **구성 오류가 가장 흔한 실패 원인이다.** 프레임 ID, 부호, 변수 선택, 공분산 값이 하나만 틀려도 추정이 날아간다. 진단 출력(`print_diagnostics`)과 센서별 단독 시험으로 하나씩 켠다.
- 선형화 근사에 기대는 EKF 이므로 자세 오차가 클 때는 정확도가 떨어진다. UKF 노드(`ukf_localization_node`)는 야코비안 없이 시그마 포인트로 처리한다.
- 두 인스턴스가 같은 TF 를 중복 발행하지 않도록 `publish_tf` 와 `base_link_output_frame` 을 확인한다.
- 이 패키지의 필터는 지도(랜드마크)를 만들지 않는다. SLAM 이 아니다([SLAM 개념](/develop-wiki/knowledge/robotics/slam-concepts/)).
- 시간 동기 문제(타임스탬프 지연, 센서 간 오프셋)는 설정으로 감춰지지 않는다([시간 동기](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/)).
