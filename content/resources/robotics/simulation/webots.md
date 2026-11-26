---
name: Webots
url: https://cyberbotics.com
docs: https://cyberbotics.com/doc/guide/index
repo: https://github.com/cyberbotics/webots
stars: 4779
domain: robotics
category: simulation
description: 이동 로봇·매니퓰레이터를 다루는 크로스 플랫폼 오픈소스 로봇 시뮬레이터. 컨트롤러를 여러 언어로 작성하고 ROS 2 와 연동할 수 있다.
pricing: oss
tags: [webots, simulation, ode, ros2, cyberbotics, education]
languages: [python, cpp, java]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Webots 는 Cyberbotics 가 개발하는 데스크톱 로봇 시뮬레이터로 Apache-2.0 으로 공개돼 있다. 월드는 `.wbt` 파일로, 로봇은 PROTO 로 정의하고, 컨트롤러는 Python·C·C++·Java·MATLAB 로 쓴다. 설치형 앱이라 시작이 빠르고 교육·연구용 예제 로봇이 많다.
GitHub 최신 **정식 릴리스는 R2025a(2025-02-04)** 로 확인했다(그 이후는 nightly 빌드만 존재). 저장소는 2026-11 에도 커밋이 이어지므로 개발은 활발하지만, 정식 버전 번호 기준 최신성은 직접 릴리스 페이지에서 다시 확인하자.

## 설치
공식 설치 파일(Windows·macOS·Linux)을 받아 설치하거나 Linux 는 `.deb`/tar 아카이브를 쓴다. 소스 빌드도 가능하다.
```bash
# 설치 후 실행
webots                       # GUI
webots --mode=fast --no-rendering world.wbt   # 렌더링 없이 빠르게
```
Python 컨트롤러는 설치본이 제공하는 `controller` 모듈을 쓴다(별도 pip 설치 없이 Webots 가 환경을 준비).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| World(`.wbt`) | 장면 트리. 노드로 로봇·물체·조명을 구성 |
| PROTO | 재사용 가능한 노드 템플릿. 로봇 모델을 파라미터화 |
| Robot 노드 / Controller | 각 로봇에 컨트롤러 프로그램을 지정 |
| Device | 모터·센서·카메라 등. 이름으로 `getDevice` 해서 사용 |
| Supervisor | 시뮬레이션 자체를 조작(위치 이동, 리셋)하는 특수 권한 로봇 |
| `webots_ros2` | Webots 와 ROS 2 를 연결하는 패키지 |
| 물리 | ODE 기반(Webots 가 수정한 버전) |

## 기본 사용법
Webots 의 Python 컨트롤러 기본형(로봇 시간 스텝 루프):
```python
from controller import Robot

robot = Robot()
timestep = int(robot.getBasicTimeStep())
motor = robot.getDevice("motor")          # 월드의 장치 이름
motor.setPosition(float("inf"))           # 속도 제어 모드
motor.setVelocity(2.0)

while robot.step(timestep) != -1:         # 시뮬 종료 시 -1
    pass
```
장치 이름은 사용하는 로봇 모델에 맞게 바꾼다. 새 월드·컨트롤러는 메뉴 Wizards 로 생성하면 뼈대가 만들어진다.

## 자주 쓰는 패턴
- **센서 활성화**: 카메라·거리 센서는 `device.enable(timestep)` 후 `robot.step` 안에서 값을 읽는다.
- **ROS 2 연동**: `webots_ros2` 의 드라이버 노드를 런치 파일에서 띄워 토픽으로 제어한다.
- **외부 컨트롤러**: 컨트롤러를 Webots 밖 프로세스로 실행(extern)해 IDE 디버깅·CI 에 쓴다.
- **Supervisor 로 자동화**: 시나리오 리셋, 물체 스폰, 결과 기록을 스크립트화한다.
- **헤드리스 실행**: `--no-rendering --mode=fast --batch` 같은 CLI 옵션으로 배치 실험을 돌린다(옵션은 사용자 가이드 확인).

## 언제 쓰나 / 피할 때
- 쓸 때: 교육·경진대회, 모바일·휴머노이드 로봇 컨트롤러 개발, 설치 한 번으로 바로 쓰는 가벼운 시뮬레이터가 필요할 때.
- 피할 때(대안): 대규모 병렬 학습은 [MuJoCo](/develop-wiki/robotics/simulation/mujoco/)·[Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/), ROS 2 생태계 표준 통합은 [Gazebo](/develop-wiki/robotics/simulation/gazebo/).

## 공식 문서
- [사용자 가이드](https://cyberbotics.com/doc/guide/index) · [Reference Manual](https://cyberbotics.com/doc/reference/index)
- [webots_ros2](https://github.com/cyberbotics/webots_ros2) · [릴리스](https://github.com/cyberbotics/webots/releases)
