---
name: Modern Robotics (Lynch & Park)
url: https://modernrobotics.northwestern.edu
docs: https://hades.mech.northwestern.edu/index.php/Modern_Robotics
repo: https://github.com/NxRLab/ModernRobotics
stars: 3080
domain: robotics
category: learning
description: Lynch·Park 의 로봇 기구학·동역학·제어 교재. 무료 프리프린트 PDF, 강의 영상, 연습문제, 코드 라이브러리, Coursera 온라인 강좌가 있다.
pricing: freemium
tags: [textbook, kinematics, dynamics, screw-theory, coursera, manipulation]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Kevin Lynch 와 Frank Park 의 *Modern Robotics: Mechanics, Planning, and Control*(Cambridge University Press, 2017)은 스크류 이론과 지수 좌표(product of exponentials)로 로봇 팔의 기구학, 동역학, 궤적 계획, 운동 제어, 파지·모바일 조작을 통일된 방식으로 다룬다. 공식 위키가 **무료 프리프린트 PDF**, 강의 영상, 연습문제, 슬라이드를 제공하고, 인쇄본은 구매한다. 위키는 한국어 번역본(acorn 출판)이 있다고 안내한다(온라인 자료는 영어라 `koreanDocs` 는 false 다).

가격: 프리프린트·영상·코드는 무료, 인쇄본은 유료, Coursera 강좌의 수료증은 Coursera 정책에 따른다(청강·수료증 조건은 사이트에서 확인). 그래서 `freemium` 으로 표기했다.

## 설치
자료는 읽고 보는 형태다. 코드 라이브러리(MIT)는 Python·MATLAB·Mathematica 로 제공된다.
```bash
pip install modern_robotics     # PyPI 배포 패키지(설치 전 PyPI 에서 확인)
```
저장소 [NxRLab/ModernRobotics](https://github.com/NxRLab/ModernRobotics) 에서 소스를 받을 수도 있다. 코드는 교육용으로 가독성을 우선했고 효율·견고성은 목표가 아니라고 저장소가 밝힌다.

## 핵심 개념
| 장 | 주제 |
| --- | --- |
| 2–3 | 구성 공간, 자유도, 강체 운동(SO(3), SE(3)) |
| 4 | 순기구학, product of exponentials |
| 5 | 속도 기구학, 야코비안, 특이점 |
| 6 | 역기구학 수치 해법 |
| 8 | 개루프·폐루프 동역학(뉴턴-오일러, 라그랑지) |
| 9–11 | 궤적 생성, 운동 계획, 로봇 제어 |
| 12–13 | 파지·조작, 바퀴 이동 로봇 |

## 기본 사용법
순기구학(2링크 평면 팔)을 코드로 확인하는 예(`modern_robotics` 라이브러리):
```python
import numpy as np
import modern_robotics as mr

M = np.array([[1,0,0,2],[0,1,0,0],[0,0,1,0],[0,0,0,1]])     # 홈 자세 말단
Slist = np.array([[0,0,1, 0,0,0],
                  [0,0,1, 0,-1,0]]).T                         # 관절 스크류 축
T = mr.FKinSpace(M, Slist, np.array([np.pi/2, 0.0]))
print(np.round(T, 3))
```
학습 방법: 책의 1~4장을 읽으며 영상과 연습문제를 풀고, 라이브러리의 `FKinSpace`, `JacobianSpace`, `IKinSpace` 로 결과를 검산한다.

## 자주 쓰는 패턴
- **Coursera 6개 강좌 연계**: 책 순서를 따라 영상 + 퀴즈 + 프로그래밍 과제로 진행(청강 가능 여부는 확인).
- **ROS 와 병행**: 책의 변환·야코비안 개념을 [MoveIt 2](/develop-wiki/robotics/navigation-planning/moveit2/) 의 IK·플래닝 설정을 이해하는 데 연결한다.
- **직접 구현**: 라이브러리 함수 대신 numpy 로 자체 구현해 보고 비교.
- 쓰는 변환 규약(space vs body frame)을 처음부터 일관되게 유지한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 로봇 팔의 수학적 기반(변환·야코비안·동역학)을 체계적으로 배울 때, 석사 수준 로보틱스 입문.
- 피할 때: ROS 도구 사용법·패키지 설정이 목적이면 [ROS 2 공식 문서](/develop-wiki/robotics/learning/ros2-documentation/). 다리 로봇·비선형 제어 심화는 [Underactuated Robotics](/develop-wiki/robotics/learning/underactuated-robotics/).

## 공식 문서
- [교재 공식 위키(프리프린트·영상)](https://hades.mech.northwestern.edu/index.php/Modern_Robotics) · [강의 영상·Coursera 안내](https://modernrobotics.northwestern.edu) · [Coursera 전문 과정](https://www.coursera.org/specializations/modernrobotics) · [코드 라이브러리](https://github.com/NxRLab/ModernRobotics)
