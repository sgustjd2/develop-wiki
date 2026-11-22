---
name: Underactuated Robotics (MIT)
url: https://underactuated.mit.edu
docs: https://underactuated.mit.edu/index.html
repo: https://github.com/RussTedrake/underactuated
stars: 1047
domain: robotics
category: learning
description: Russ Tedrake 의 MIT 강의 노트. 비선형 동역학, 궤적 최적화, LQR, 모션 플래닝을 웹으로 무료 공개하며 Drake 기반 노트북 예제를 제공한다.
pricing: free
tags: [control, optimization, trajectory-optimization, lqr, drake, course]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
*Underactuated Robotics: Algorithms for Walking, Running, Swimming, Flying, and Manipulation* 은 MIT 강의(Russ Tedrake)의 온라인 노트다. 액추에이터 수가 자유도보다 적은(보행·비행·조작) 시스템의 동역학과 제어를 다루며, 진자부터 쿼드로터·다리 로봇까지 모델 시스템으로 시작해 LQR, 궤적 최적화, 모션 플래닝, 강화학습으로 이어진다. 웹 노트가 주 버전이고 PDF 는 자동 생성본이라 갱신이 드물다. 강의 영상은 YouTube 에 있다. 웹 첫 화면은 2024 봄 학기 기준 안내를 보여주므로 최신 학기와 차이가 있을 수 있다. 무료 열람이고 저장소 라이선스는 GitHub 에서 NOASSERTION 으로 표시되므로 코드 재사용 시 LICENSE 를 확인한다.

## 설치
노트는 브라우저로 읽는다. 예제는 [Drake](https://drake.mit.edu) 와 Python 을 쓴다.
```bash
pip install drake          # Drake 의 pip 패키지(지원 OS·Python 버전은 Drake 문서 확인)
git clone https://github.com/RussTedrake/underactuated.git   # 노트북 예제
```
저장소 README 의 설치 안내에 따라 의존성을 맞추고, 노트의 각 장에 연결된 Colab/노트북을 연다.

## 핵심 개념
| 장(예) | 내용 |
| --- | --- |
| 1 | 완전구동 vs 부족구동, 비홀로노믹 제약 |
| 2–3 | 진자, 아크로봇, 카트-폴, 쿼드로터 |
| 4–5 | 보행과 달리기(수동 보행), 단순 모델 |
| LQR·최적제어 | 선형화, 도달 가능성, 동적 프로그래밍 |
| 궤적 최적화 | 직접 콜로케이션, 슈팅, 비선형 계획 |
| 모션 플래닝 | 샘플링 기반, 안전 증명 |
| 제어 Lyapunov | 안정성 증명, 영역 확장 |

## 기본 사용법
수식 설명 → 파이썬 노트북 실습의 순서를 따른다. 단진자를 수치 적분해 보는 최소 예(Drake 없이도 개념 확인):
```python
import numpy as np
from scipy.integrate import solve_ivp

g, l, b = 9.81, 1.0, 0.1
def pendulum(t, x):             # x = [theta, theta_dot]
    return [x[1], -(g / l) * np.sin(x[0]) - b * x[1]]

sol = solve_ivp(pendulum, [0, 10], [np.pi - 0.1, 0.0], max_step=0.01)
print(sol.y[0][-1])
```
이후 노트 2장의 에너지 셰이핑·LQR 안정화로 같은 시스템을 제어하는 과정을 따라간다.

## 자주 쓰는 패턴
- **강의 영상 + 노트 병행**: 영상으로 직관, 노트로 수식·코드.
- **Drake 시뮬레이션**: 노트의 예제를 모델만 바꿔 자기 로봇에 적용.
- **연습문제 풀이**: 각 장 끝 Exercises 를 직접 구현.
- **ROS 와의 선**: 제어 알고리즘 이론은 여기서, 실제 실행 프레임은 [ros2_control](/develop-wiki/robotics/ros/ros2-control/) 에서 구현.

## 언제 쓰나 / 피할 때
- 쓸 때: 최적 제어·궤적 최적화·비선형 시스템을 이론과 코드로 배우고 싶은 중급 이상 학습자. 언어 [Python](/develop-wiki/languages/python/).
- 피할 때: 처음 로봇 팔 수학을 접한다면 [Modern Robotics](/develop-wiki/robotics/learning/modern-robotics/) 를 먼저. ROS 사용법은 [ROS 2 공식 문서](/develop-wiki/robotics/learning/ros2-documentation/).

## 공식 문서
- [강의 노트](https://underactuated.mit.edu/) · [노트 저장소](https://github.com/RussTedrake/underactuated) · [Drake](https://drake.mit.edu)
