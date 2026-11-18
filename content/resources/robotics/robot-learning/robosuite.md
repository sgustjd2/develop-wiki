---
name: robosuite
url: https://robosuite.ai
docs: https://robosuite.ai/docs/overview.html
repo: https://github.com/ARISE-Initiative/robosuite
stars: 2715
domain: robotics
category: robot-learning
description: MuJoCo 기반 로봇 조작 학습 시뮬레이션 프레임워크. 표준 벤치마크 환경과 다양한 로봇·컨트롤러·원격조종 장치를 제공해 재현 가능한 연구에 쓴다.
pricing: oss
tags: [robosuite, mujoco, manipulation, benchmark, imitation-learning, reinforcement-learning]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
robosuite 는 Stanford SVL 과 UT RPL 이 주도하는 ARISE Initiative 의 조작(manipulation) 학습용 시뮬레이션 프레임워크다. [MuJoCo](/develop-wiki/robotics/simulation/mujoco/) 위에서 Lift·Stack·Door 같은 벤치마크 환경과 Panda·UR5e 등 로봇 모델, 오퍼레이션 스페이스·조인트 컨트롤러를 제공한다. 모듈식이라 로봇·그리퍼·아레나·물체를 조합해 새 태스크를 만들 수 있다. MIT 라이선스.
**v1.5.2 기준(2025-12-24)**. v1.5 에서 휴머노이드를 포함한 다양한 로봇, 합성(composite) 컨트롤러(전신 제어 포함), 더 많은 원격조종 장치, 사실적 렌더링이 추가됐다. v1.4 부터 MuJoCo 공식 Python 바인딩을 쓴다. 최근 푸시는 2026-07 로, 릴리스 주기는 느린 편이다.

## 설치
```bash
pip install robosuite
python -m robosuite.demos.demo_random_action   # 설치 확인(랜덤 액션 데모)
```
소스 설치와 mjviewer/렌더링 요구사항은 공식 문서를 참고한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `suite.make` | 환경 이름과 로봇 등을 받아 환경 인스턴스를 만드는 팩토리 |
| Environment | `reset`/`step` 인터페이스를 가진 태스크(Lift, Stack, Door …) |
| Robot / Gripper | 로봇 모델과 엔드이펙터를 조합 |
| Controller | 오퍼레이션 스페이스(OSC)·조인트 제어 등. v1.5 는 합성 컨트롤러 구성 |
| Observation | 프로프리오셉션 + 오브젝트 상태 + 카메라 이미지(옵션) |
| Arena / Object | 테이블 등 작업 공간과 조작 대상 |
| Demo / Teleop | 키보드·SpaceMouse 등으로 시연 수집 |

## 기본 사용법
Lift 환경에서 무작위 행동 실행:
```python
import numpy as np
import robosuite as suite

env = suite.make(
    env_name="Lift",
    robots="Panda",
    has_renderer=False,
    has_offscreen_renderer=False,
    use_camera_obs=False,
)
obs = env.reset()
low, high = env.action_spec
for _ in range(100):
    action = np.random.uniform(low, high)
    obs, reward, done, info = env.step(action)
env.close()
```
카메라 관측이 필요하면 `has_offscreen_renderer=True`, `use_camera_obs=True`, `camera_names=...` 를 지정한다. 반환 형식은 설치 버전의 문서로 확인한다.

## 자주 쓰는 패턴
- **벤치마크 비교**: 같은 환경에서 RL·모방학습 알고리즘을 재현 가능하게 비교한다.
- **시연 수집**: 원격조종으로 시연을 저장해 [LeRobot](/develop-wiki/robotics/robot-learning/lerobot/) 류 모방학습 파이프라인의 입력으로 변환해 쓴다.
- **로봇 교체**: `robots=["Panda", "Panda"]` 처럼 바꿔 양팔·다른 로봇으로 같은 태스크를 확장한다.
- **Gym 래핑**: `reset`/`step` 형태를 [Gymnasium](/develop-wiki/robotics/robot-learning/gymnasium/) 인터페이스로 감싸 [Stable-Baselines3](/develop-wiki/robotics/robot-learning/stable-baselines3/) 에 연결한다(래퍼는 직접 작성).
- **도메인 랜덤화**: 조명·질량·마찰 등을 랜덤화하는 모디파이어로 일반화를 시험한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 조작 정책 연구의 표준 벤치마크가 필요하고 MuJoCo 기반 CPU 시뮬레이션으로 충분할 때.
- 피할 때(대안): 수천 환경 병렬 학습은 [ManiSkill](/develop-wiki/robotics/robot-learning/maniskill/)·[Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/), 실로봇 데이터 중심 흐름은 [LeRobot](/develop-wiki/robotics/robot-learning/lerobot/).

## 공식 문서
- [개요](https://robosuite.ai/docs/overview.html) · [GitHub](https://github.com/ARISE-Initiative/robosuite)
- [릴리스](https://github.com/ARISE-Initiative/robosuite/releases)
