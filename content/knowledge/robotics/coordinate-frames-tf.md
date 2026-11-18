---
title: 좌표계와 변환 행렬, TF
aka: [Coordinate Frames, Homogeneous Transform, SE(3), tf2, REP-103, REP-105]
category: robotics
group: kinematics
level: beginner
summary: 로봇 소프트웨어의 모든 위치는 어떤 프레임 기준인지가 붙는다. 동차 변환 행렬로 프레임을 잇고, ROS 는 REP-103·105 관례와 tf2 트리로 이를 관리한다.
tags: [robotics, ros, tf2, transform, frames, rep-105]
related: [robotics/rotation-representations, robotics/forward-inverse-kinematics-jacobian, robotics/sensor-fusion-time-sync, robotics/slam-concepts]
sources:
  - https://www.ros.org/reps/rep-0103.html
  - https://www.ros.org/reps/rep-0105.html
  - https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Tf2.html
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
updatedAt: 2026-11-19
---

## 문제

"장애물이 (2, 1) 에 있다"는 말은 기준 프레임 없이는 의미가 없다. 로봇에는 카메라, 라이다, 바퀴 중심, 그리퍼, 지도 같은 프레임이 수십 개 있고, 센서마다 자기 프레임으로 값을 낸다. 프레임을 잘못 섞으면 코드는 돌아가는데 로봇이 엉뚱한 곳으로 간다. 로봇 버그 중 가장 흔하고 눈에 안 띄는 부류다.

## 왜 중요한가 (로봇 개발 관점)

- 센서 융합, 경로 계획, 조작은 전부 "프레임 A 의 점을 프레임 B 로" 변환하는 일 위에서 돈다.
- 변환 방향(A→B 인지 B→A 인지)을 한 번 뒤집으면 오류가 눈으로 보이지 않고 위치만 어긋난다.
- 팀 간 코드 재사용 가능 여부가 프레임 관례를 지키는지에 달려 있다.

## 해법 1 — 동차 변환 행렬

회전 R(3x3)과 이동 p(3x1)를 4x4 행렬 하나로 묶는다(Modern Robotics 3장의 SE(3)). 점 하나는 (x, y, z, 1) 로 늘려 곱한다.

- 표기 `T_a_b` 는 "b 프레임에서 잰 좌표를 a 프레임 좌표로 바꾼다"로 읽는다. 곧 a 에서 본 b 의 자세다.
- 연결은 곱셈이다. `T_a_c = T_a_b @ T_b_c`. 이웃한 아래첨자가 맞물려 지워지게 쓰면 실수가 준다.
- 역은 `[Rᵀ, -Rᵀp]`. 일반 행렬 역산보다 싸고 안정적이다.
- 곱셈 순서는 바꿀 수 없다(비가환). 회전 후 이동과 이동 후 회전은 다른 결과다.

```python
import numpy as np
def se2(x, y, th):
    c, s = np.cos(th), np.sin(th)
    return np.array([[c, -s, x], [s, c, y], [0, 0, 1.0]])

T_map_base  = se2(5.0, 2.0, np.pi/2)        # 로컬라이저 추정
T_odom_base = se2(4.8, 1.0, np.pi/2 - 0.1)  # 오도메트리(드리프트 포함)
T_map_odom  = T_map_base @ np.linalg.inv(T_odom_base)   # 로컬라이저가 실제로 발행하는 것
assert np.allclose(T_map_base, T_map_odom @ T_odom_base)
```

(2D 예시로 실행해 검증했다. 3D 는 4x4 로 확장될 뿐 구조는 같다.)

## 해법 2 — ROS 관례 (REP-103, REP-105)

**REP-103 (단위·축)**
- SI 단위: 미터, 킬로그램, 초, 각도는 라디안.
- 모든 프레임은 오른손 좌표계. 몸체 기준 x 앞, y 왼쪽, z 위.
- 카메라 `_optical` 프레임은 다르다. z 앞, x 오른쪽, y 아래. 카메라 이미지 좌표와 맞추기 위해서다.
- 지리 좌표는 ENU(x 동, y 북, z 위)가 기본이고, NED 가 필요하면 `_ned` 접미 프레임을 따로 둔다.
- yaw 는 반시계 방향으로 증가하고 동쪽이 0 이다. 나침반 방위(북 0, 시계 방향)와 다르니 드라이버가 변환해서 내보내야 한다.

**REP-105 (이동 로봇의 표준 프레임)**

| 프레임 | 성격 | 용도 |
| --- | --- | --- |
| `base_link` | 로봇 몸체에 고정 | 기준점 |
| `odom` | 월드 고정, **연속적**이나 드리프트가 무한히 쌓임 | 단기 정밀 제어, 지역 장애물 |
| `map` | 월드 고정, 드리프트 없음, 하지만 **불연속(점프)** 가능 | 장기 목표, 전역 계획 |
| `earth` | ECEF 원점 | 다중 로봇이 서로 다른 map 을 쓸 때 |

- 트리의 부모는 하나뿐이라 `map → odom → base_link` 로 잇는다. 로컬라이저는 `map → base_link` 를 직접 내지 않고 `map → odom` 을 낸다(위 코드의 `T_map_odom`).
- 그래서 제어기는 연속적인 `odom` 에서, 목표 지정은 `map` 에서 한다.

## 해법 3 — tf2

- tf2 는 시간에 따라 변하는 프레임 트리를 버퍼에 쌓아 두고, 임의의 두 프레임 사이 변환을 임의의 시각에 대해 물어볼 수 있게 한다("5초 전 head 는 world 에서 어디였나").
- 정적 변환(센서 장착 위치)은 한 번만 발행하는 `static` 브로드캐스터를 쓴다. 이력이 저장되지 않는다.
- 문서가 경고하는 함정이 있다. `geometry_msgs/Transform` 은 "프레임을 옮기는" 관점이고, 데이터를 옮기는 관점의 변환은 그 역이다. 디버깅할 때 부호가 반대로 보여도 이상한 게 아니다.
- 메시지의 `header.stamp` 와 `frame_id` 로 "언제, 어떤 프레임 기준"인지가 따라다닌다. 시간 맞추기는 [센서 퓨전과 시간 동기화](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/) 참고.

## 언제 쓰나

- 센서 값을 로봇 몸체/지도 기준으로 옮길 때(라이다 점을 `base_link` 로, 장애물을 `map` 으로).
- 매니퓰레이터의 링크 사슬을 이어 말단 위치를 얻을 때([순기구학](/develop-wiki/knowledge/robotics/forward-inverse-kinematics-jacobian/)).
- 여러 로봇·센서 데이터를 한 지도에 합칠 때.

## 주의/비용

- 변환 방향과 프레임 이름 혼동이 제일 흔한 오류다. 변수 이름을 `p_map`, `T_map_base` 처럼 프레임을 포함해 짓는다.
- REP-105 는 `odom` 이 연속이어야 한다고 못 박는다. 지도 보정 결과를 `odom` 을 직접 점프시키는 방식으로 반영하면 제어기가 튄다.
- 큰 좌표를 float32 로 저장하면 정밀도가 떨어진다. REP-105 는 센티미터 정밀도 기준 odom 원점에서 대략 83km 가 한계라고 적는다. 장거리 주행이면 원점 재설정이 필요하다.
- 부동소수점 누적으로 회전 행렬이 직교성을 잃는다. 장기 적분은 쿼터니언 정규화나 재직교화를 한다([회전 표현](/develop-wiki/knowledge/robotics/rotation-representations/)).
- tf 룩업은 버퍼에 그 시각 데이터가 아직 없으면 실패한다. 지연된 센서에서 "extrapolation" 오류가 나는 이유다.
