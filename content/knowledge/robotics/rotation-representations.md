---
title: 회전 표현 — 오일러각·쿼터니언·회전 행렬과 짐벌락
aka: [Rotation Representations, Euler Angles, Quaternion, Rotation Matrix, Gimbal Lock, SO(3)]
category: robotics
group: kinematics
level: intermediate
summary: 3D 회전을 오일러각, 회전 행렬, 쿼터니언으로 표현하는 방법과 각각의 특이점·중복·수치 오차 차이, 짐벌락이 왜 생기는지 정리한다.
tags: [robotics, rotation, quaternion, euler, gimbal-lock, ros]
related: [robotics/coordinate-frames-tf, robotics/forward-inverse-kinematics-jacobian, robotics/kalman-filter-ekf, cs-fundamentals/number-representation]
sources:
  - https://www.ros.org/reps/rep-0103.html
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
  - https://en.wikipedia.org/wiki/Gimbal_lock
  - https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Tf2.html
updatedAt: 2026-11-19
---

## 문제

3D 회전은 자유도가 3인데, 표현법마다 숫자를 3개, 4개, 9개 쓴다. 표현을 잘못 고르면 특정 자세에서 계산이 망가지거나(짐벌락), 보간이 뚝뚝 끊기거나, 누적 오차로 "회전 행렬이 아닌 것"이 된다. 센서(IMU), 제어, 시각화가 서로 다른 표현을 쓰므로 변환이 일상이다.

## 왜 중요한가 (로봇 개발 관점)

- IMU 는 쿼터니언, 사람 눈에 읽기 쉬운 로그는 roll/pitch/yaw, 렌더러는 행렬을 쓴다. 경계에서 변환 실수가 곧 버그가 된다.
- 드론·휴머노이드는 pitch 가 ±90도 근처까지 가므로 오일러각 기반 제어는 위험하다.
- ROS 는 REP-103 에서 메시지 표현의 선호 순서를 정해 두었다(아래).

## 세 가지 표현

| 표현 | 숫자 | 특이점 | 합성 | 장점 | 단점 |
| --- | --- | --- | --- | --- | --- |
| 오일러각 (예 ZYX) | 3 | **있음**(짐벌락) | 직접 불가, 행렬로 변환 | 사람이 읽기 쉬움 | 순서 관례만 24가지, 각도 랩어라운드 |
| 회전 행렬 R | 9 (직교, det=+1) | 없음 | 행렬 곱 | 점 변환이 곱 한 번 | 중복이 큼, 누적 오차로 직교성 상실 |
| 단위 쿼터니언 | 4 (노름 1) | 없음 | 해밀턴 곱 | 작고 보간(slerp) 자연스러움 | q 와 -q 가 같은 회전, 직관 어려움 |

REP-103 은 메시지에서 쿼터니언을 가장 선호하고, 그다음 회전 행렬, 고정축 roll-pitch-yaw, 마지막으로 오일러각 순으로 권한다. 오일러각은 "유효한 관례가 24가지"라는 이유로 권장하지 않는다. 같은 (roll, pitch, yaw) 숫자라도 합성 순서에 따라 다른 자세가 된다.

## 짐벌락

ZYX(yaw→pitch→roll) 관례에서 pitch 가 ±90도이면 roll 축과 yaw 축이 한 직선으로 겹친다. 이때 (yaw, roll) 은 따로 정해지지 않고 차이(또는 합)만 의미를 가진다. 자유도 하나가 사라진 것이다. 고장난 짐벌이 아니라 "각 3개로 자세를 나타내는 모든 방식에는 어딘가 이런 점이 있다"는 위상 문제다(Wikipedia 짐벌락).

```python
import numpy as np
def rz(a): c,s=np.cos(a),np.sin(a); return np.array([[c,-s,0],[s,c,0],[0,0,1]])
def ry(a): c,s=np.cos(a),np.sin(a); return np.array([[c,0,s],[0,1,0],[-s,0,c]])
def rx(a): c,s=np.cos(a),np.sin(a); return np.array([[1,0,0],[0,c,-s],[0,s,c]])
R = lambda yaw, pitch, roll: rz(yaw) @ ry(pitch) @ rx(roll)

h = np.pi/2   # pitch = 90도
print(np.allclose(R(0.3, h, 0.1), R(0.5, h, 0.3)))    # True  - yaw-roll 차이가 같으면 같은 자세
print(np.allclose(R(0.3, 0, 0.1), R(0.5, 0, 0.3)))    # False - pitch 0 이면 구분됨
```

(실행해 확인했다.) 짐벌락 근처에서는 각도 → 자세 변환은 되지만 **자세 → 각도 역변환이 불안정**하다. 자세 오차를 오일러각 차이로 계산하는 제어기가 여기서 튄다.

## 쿼터니언 사용법

- 축 `n`(단위벡터), 각 θ 이면 `q = (cos θ/2, sin θ/2 · n)`.
- 합성은 쿼터니언 곱이고 행렬 곱과 같은 결과를 준다(실행해 `q_to_R(q1*q2) == Rz*Ry` 확인).
- 두 자세 사이 보간은 slerp 으로 각속도가 일정하게 간다. 행렬 성분을 선형 보간하면 회전이 아니게 된다.
- **정규화**: 곱을 반복하면 노름이 1에서 벗어난다. 실험에서 1e-4 rad 회전을 10만 번 곱했을 때 노름 오차가 7e-13 이었다. 작지만 필터에서 수 시간 돌리면 쌓이므로 주기적으로 `q /= |q|` 를 한다.
- `q` 와 `-q` 는 같은 회전이다(실행으로 확인). 두 쿼터니언을 비교하거나 보간하기 전에 내적이 음수이면 부호를 맞춘다. 안 하면 긴 쪽 호로 돌아간다.

## 언제 쓰나

- 저장·전송·필터 상태: 쿼터니언(ROS `geometry_msgs/Quaternion`, IMU, tf).
- 점 많이 변환(포인트 클라우드): 회전 행렬이나 4x4 로 한 번 만들어 재사용.
- 사람에게 보여주는 값, 설정 파일: roll-pitch-yaw 로 변환해서 표시하되 내부 계산에는 쓰지 않는다.
- 수식 전개·미분이 필요한 이론(Modern Robotics 는 지수 좌표/스크류 이론을 쓴다. 부록 B 에 오일러각·쿼터니언을 별도 정리한다).

## 주의/비용

- ROS 에서 롤·피치·요 변환 함수가 어떤 관례(ZYX 외부 축 vs 내부 축)인지 문서로 확인한다. 라이브러리마다 다르다.
- 각도 차이는 `(-π, π]` 로 감싸서(wrap) 계산한다. 359도와 1도의 차이는 358도가 아니라 -2도다.
- 쿼터니언 요소 순서가 `(w,x,y,z)` 인지 `(x,y,z,w)` 인지 라이브러리마다 다르다. ROS 메시지는 `x,y,z,w` 순이다. 이 순서 혼동이 흔한 버그다.
- 쿼터니언으로 제어 오차(작은 회전의 3차원 벡터)를 만들 때는 `q_err = q_des * q_cur⁻¹` 의 벡터부를 쓰고 부호를 정한다. 오일러각 뺄셈으로 대체하지 않는다.
- 좌표 프레임 컨텍스트는 [좌표계와 TF](/develop-wiki/knowledge/robotics/coordinate-frames-tf/) 참고.
