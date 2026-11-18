---
title: SLAM 개념 — 그래프 SLAM·루프 클로저·센서
aka: [SLAM, Simultaneous Localization and Mapping, GraphSLAM, Pose Graph, Loop Closure, Visual SLAM, LiDAR SLAM]
category: robotics
group: estimation
level: advanced
summary: 지도를 모르는 환경에서 지도와 자기 위치를 동시에 추정하는 문제. 필터형과 그래프 최적화형, 루프 클로저의 역할, 센서별(라이다·카메라·IMU) 특성을 정리한다.
tags: [robotics, slam, graph-slam, loop-closure, lidar, visual-slam]
related: [robotics/particle-filter-mcl, robotics/kalman-filter-ekf, robotics/coordinate-frames-tf, robotics/sensor-fusion-time-sync]
sources:
  - http://robots.stanford.edu/papers/thrun.graphslam.pdf
  - https://www.cs.cmu.edu/~thrun/papers/thrun.mapping-tr.pdf
  - https://en.wikipedia.org/wiki/Simultaneous_localization_and_mapping
  - https://www.ros.org/reps/rep-0105.html
updatedAt: 2026-11-19
---

## 문제

위치를 알려면 지도가 필요하고, 지도를 만들려면 위치를 알아야 한다. 오도메트리만 적분하면 오차가 계속 쌓여(드리프트) 한 바퀴 돌아와도 출발점으로 안 돌아온다. SLAM 은 두 문제를 **동시에** 푸는 것이다. Thrun 의 "Robotic Mapping: A Survey"(2002)는 이 분야를 확률적 기법 중심으로 개관한다.

## 왜 중요한가 (로봇 개발 관점)

- 지도 없는 환경(새 건물, 창고, 지하)에 로봇을 배치하는 첫 단계다. 지도를 만든 뒤에는 [MCL](/develop-wiki/knowledge/robotics/particle-filter-mcl/) 로 재위치한다.
- SLAM 결과가 `map → odom` 변환과 점유 격자 지도를 제공해 내비게이션 스택의 입력이 된다([REP-105](/develop-wiki/knowledge/robotics/coordinate-frames-tf/)).

## 해법 계열

**필터형(EKF-SLAM, FastSLAM)**: 로봇 자세와 랜드마크 위치를 한 상태로 두고 온라인으로 갱신한다. 랜드마크가 늘면 공분산이 제곱으로 커진다. FastSLAM 은 파티클 필터로 경로를 추정하고 랜드마크는 입자별 작은 필터로 푼다.

**그래프형(GraphSLAM, 포즈 그래프)**: 노드 = 로봇 포즈(및 랜드마크), 간선 = "두 포즈 사이 상대 변환 측정"(오도메트리, 루프 클로저). 간선마다 오차를 이차 비용으로 만들고 전체를 비선형 최소제곱으로 푼다. Thrun & Montemerlo 의 GraphSLAM 논문은 SLAM 사후분포를 로그우도 그래프로 만들고 변수 소거로 차원을 줄여 푸는 방식을 소개하며, 이를 오프라인 SLAM 문제의 통합 알고리즘으로 제시한다. 현대 구현(g2o, GTSAM, Ceres 기반)은 이 최적화 틀 위에 있다.

### 루프 클로저

이미 방문한 장소를 다시 알아보는 것이다. 그 순간 포즈 그래프에 "지금 포즈와 과거 포즈가 같은 장소"라는 간선이 추가되고, 최적화가 쌓인 드리프트를 전체 궤적에 나눠 퍼뜨려 보정한다.

아래는 회전을 생략한 2D 위치 포즈 그래프로 효과만 본 장난감 실험이다.

```python
import numpy as np
rng = np.random.default_rng(1)
N = 41; side = 10
steps = [np.array(d, float) for d in ([1,0],[0,1],[-1,0],[0,-1]) for _ in range(side)]
truth = np.vstack([[0,0], np.cumsum(steps, axis=0)])          # 정사각형 한 바퀴, 마지막 점 = 시작점
odo = [s + np.array([0.03, 0.02]) + rng.normal(0, 0.02, 2) for s in steps]   # 편향된 오도메트리
dead = np.vstack([[0,0], np.cumsum(odo, axis=0)])

rows, b = [], []
def add(i, j, meas, wt):                         # 제약: x_j - x_i = meas
    r = np.zeros(N); r[j] = wt; r[i] = -wt; rows.append(r); b.append(meas*wt)
for i in range(N-1): add(i, i+1, odo[i], 1.0)    # 오도메트리 간선
r = np.zeros(N); r[0] = 1e3; rows.append(r); b.append(np.zeros(2))                  # 앵커
r = np.zeros(N); r[N-1] = 10; r[0] = -10; rows.append(r); b.append(np.zeros(2))     # 루프 클로저
X = np.linalg.lstsq(np.array(rows), np.array(b), rcond=None)[0]
```

결과: 데드레코닝은 한 바퀴 뒤 시작점에서 1.38 어긋났다. 루프 클로저 한 개를 넣은 최소제곱은 평균 포즈 오차를 0.708 에서 0.035 로 줄였다(참값 대비). 단일 시드의 장난감 예제이며 실제 SLAM 은 회전 포함 SE(2)/SE(3) 에서 비선형 최적화가 필요하다.

## 센서

| 센서 | 장점 | 단점 | 대표 방식 |
| --- | --- | --- | --- |
| 2D/3D 라이다 | 거리가 정확, 조명 무관 | 비쌈, 반복 구조에서 모호, 유리·검은 면 취약 | 스캔 매칭 + 포즈 그래프 |
| 카메라(단안·스테레오·RGB-D) | 저렴, 풍부한 외형 정보 | 조명·움직임 번짐 민감, 단안은 스케일 모호 | 특징점/직접법 (Visual SLAM) |
| IMU | 고속, 단기 움직임 정확 | 단독 적분 시 빠르게 드리프트 | 비주얼/라이다와 결합 |
| 휠 엔코더 | 단순, 저렴 | 미끄러짐에 취약 | 오도메트리 초기값 |

실전은 두 가지 이상을 결합한다(LiDAR-Inertial, Visual-Inertial). 타임스탬프 정합이 중요하다([센서 퓨전](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/)).

## 언제 쓰나

- 지도가 없거나 자주 변하는 환경에서 지도 작성과 위치 추정이 둘 다 필요할 때.
- 사전 지도를 만든 뒤 한 번 쓰고 끝내면 오프라인 그래프 SLAM, 계속 운영하면 온라인 SLAM 또는 지도 갱신.

## 주의/비용

- **데이터 연관**: 관측이 이미 본 랜드마크인지 새 것인지의 판단이 틀리면 지도가 엉킨다. 가장 어려운 부분이다.
- **잘못된 루프 클로저**: 비슷하게 생긴 두 장소를 같은 곳으로 오인하면 지도 전체가 왜곡된다. 강인 비용함수, 검증, 다중 가설로 방어한다.
- **계산량**: 그래프가 커질수록 최적화가 무겁다. 키프레임, 서브맵, 희소 구조 활용이 필수다.
- **초기화·스케일**: 단안 카메라는 절대 스케일을 모른다. IMU 나 거리 센서가 필요하다.
- **동적 환경**: 움직이는 사람·물체를 정적 구조로 오인하면 위치가 틀어진다.
- 지도 품질은 정량 지표(ATE 등)와 눈으로 모두 확인한다. 한 바퀴 돌아도 닫혀 보이는 지도가 실제 구조와 맞는다는 보장은 없다.
