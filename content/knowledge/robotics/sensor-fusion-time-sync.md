---
title: 센서 퓨전 파이프라인과 시간 동기화
aka: [Sensor Fusion Pipeline, Time Synchronization, Timestamp, message_filters, ApproximateTime, Hardware Trigger, PTP]
category: robotics
group: software
level: intermediate
summary: 카메라·라이다·IMU 처럼 주기와 지연이 다른 센서를 하나의 상태로 합칠 때 필요한 타임스탬프 규약, 근사 시간 매칭, 보간, 하드웨어 동기화를 정리한다.
tags: [robotics, sensor-fusion, timestamp, synchronization, message-filters, ros2]
related: [robotics/kalman-filter-ekf, robotics/coordinate-frames-tf, robotics/ros2-communication-qos, robotics/realtime-dds-latency, robotics/slam-concepts]
sources:
  - https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Tf2.html
  - https://www.ros.org/reps/rep-0103.html
  - https://github.com/ros2/message_filters
  - https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html
updatedAt: 2026-11-19
---

## 문제

카메라는 30 Hz 에 처리 지연이 40 ms 이고, 라이다는 10 Hz, IMU 는 200 Hz 라고 하자. "같은 순간"의 데이터를 합치려면 **측정된 시각**이 맞아야 한다. 그런데 소프트웨어가 받은 시각(도착 시각)은 센서 내부 처리, 전송 지연, 큐잉 때문에 측정 시각과 다르다. 빠르게 움직이는 로봇에서 수십 ms 어긋나면 위치가 센티미터에서 미터 단위로 틀어진다.

## 왜 중요한가 (로봇 개발 관점)

- SLAM, 비주얼-관성 오도메트리, 센서 융합 정확도가 시간 정합에 직접 묶여 있다. 필터가 아무리 좋아도 입력 시각이 틀리면 편향된 값이 나온다.
- tf2 는 "그 시각의 변환"을 묻는 설계라, 메시지 `header.stamp` 가 신뢰할 수 있어야 의미가 있다([tf2](/develop-wiki/knowledge/robotics/coordinate-frames-tf/)).

## 해법

### 1. 타임스탬프 규약

- `header.stamp` = **측정(노출) 시각**. 드라이버가 도착 시각을 그대로 넣으면 지연이 숨어든다.
- `frame_id` = 측정이 표현된 프레임. 시각과 프레임이 한 세트로 데이터에 붙는다.
- 센서·드라이버·수신 PC 의 시계를 맞춘다(같은 PC 면 쉬움, 여러 기기면 NTP/PTP 같은 시계 동기화가 필요).

### 2. 주기가 다른 센서 매칭

- **근사 시간 매칭(ApproximateTime)**: 메시지 타임스탬프 차이가 허용치(slop) 이내인 것끼리 한 세트로 묶는다. ROS 2 의 `message_filters` 가 제공하는 방식이다. slop 이 작으면 짝이 줄고, 크면 어긋난 데이터가 짝지어진다.
- **보간**: 주기가 빠른 센서(IMU)는 느린 센서(카메라) 시각에 맞춰 보간한다.
- **상태 보간**: 필터 상태를 시간 순서로 보관해 두고 늦게 온 측정이 오면 그 시각으로 되돌려 재적용한다.

### 시뮬레이션 실험

카메라 30 Hz(처리 지연 45 ms), IMU 200 Hz, 참 각도 sin(t) 로 가정했다.

```python
bad  = [yaw[nearest(imu, t_exposure + 0.045)] for t_exposure in cam_stamp]   # 도착 시각으로 IMU 를 붙임
good = [np.interp(t_exposure, imu, yaw)       for t_exposure in cam_stamp]   # 노출 시각 + 선형 보간
```

결과: 도착 시각으로 맞추면 각도 RMS 오차 0.031 rad(약 1.8도), 노출 시각 + 보간은 2e-6 rad 였다. 지연 45 ms 와 각속도가 곱해진 오차이므로 회전이 빠를수록 커진다.

근사 매칭 slop 실험(카메라 150 프레임, 라이다 오프셋 13 ms + 카메라 지연 45 ms 를 두고): slop 5 ms → 1쌍, 20 ms → 50쌍, 60 ms → 150쌍. slop 은 데이터 오프셋을 숨기려 키울 값이 아니라 센서의 지터 크기에 맞춰 정하는 값이라는 점을 보여 준다.

### 3. 하드웨어 동기화

- 카메라와 라이다·IMU 에 공통 트리거 신호를 주어 같은 순간에 측정한다.
- GPS 의 PPS 신호나 PTP 로 기기 시계를 마이크로초 단위로 맞춘다.
- 소프트웨어 타임스탬프만으로 충분한지 정확도 요구(수 ms vs 수 μs)로 판단한다.

## 파이프라인 구조 예

```
드라이버(측정 시각 스탬프) → 전처리(왜곡 보정, 필터) → 시간 정합(보간/근사 매칭)
→ 상태 추정(EKF/그래프) → 출력(odom, 자세) + tf 발행
```

라이다는 한 스캔 동안 로봇이 움직이므로 점마다 시간이 다르다. 스캔 내 모션 보정(deskew)에 IMU/오도메트리를 쓴다.

## 언제 쓰나

- 둘 이상의 센서로 한 상태를 추정할 때([칼만 필터](/develop-wiki/knowledge/robotics/kalman-filter-ekf/), [SLAM](/develop-wiki/knowledge/robotics/slam-concepts/)).
- 카메라 + 라이다 점군 색칠(투영), 스테레오 카메라 쌍.

## 주의/비용

- 메시지가 일부러 늦게 오거나 순서가 뒤바뀔 수 있다(QoS reliable 재전송, 네트워크 지연). 큐 크기를 충분히 두고 시간 순 정렬을 가정하지 않는다([QoS](/develop-wiki/knowledge/robotics/ros2-communication-qos/)).
- 근사 매칭은 짝을 만들어 줄 뿐 보정은 아니다. 짝지어진 두 데이터의 시각 차이만큼은 여전히 남는다.
- 시스템 시계가 점프(NTP 보정)하면 타임스탬프가 어긋난다. 시뮬레이션 시간(`use_sim_time`)과 실제 시간을 섞지 않는다.
- 큐/보간을 쓰면 출력 지연이 늘어난다. 지연 허용 한계와 정확도 사이의 트레이드오프다.
- 센서 외부 보정(프레임 간 위치·회전)과 시간 오프셋 보정은 별개로 해야 한다.
