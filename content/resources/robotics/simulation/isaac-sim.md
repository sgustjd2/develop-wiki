---
name: NVIDIA Isaac Sim
url: https://developer.nvidia.com/isaac/sim
docs: https://docs.isaacsim.omniverse.nvidia.com/latest/index.html
repo: https://github.com/isaac-sim/IsaacSim
stars: 4523
domain: robotics
category: simulation
description: Omniverse·OpenUSD 기반 NVIDIA 로봇 시뮬레이터. RTX 센서 렌더링과 합성 데이터, ROS 2 연동을 제공하며 RTX GPU 가 필요하다.
pricing: free
tags: [nvidia, isaac-sim, omniverse, openusd, rtx, synthetic-data, ros2]
languages: [python, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Isaac Sim 은 NVIDIA Omniverse Kit 위에 만든 로봇 시뮬레이션 플랫폼이다. 장면은 OpenUSD 로 표현하고, PhysX 기반 GPU 가속 물리와 RTX 레이트레이싱 카메라·라이다 같은 센서, URDF·MJCF·CAD 임포터, 합성 데이터 생성(Replicator), ROS 2 브리지를 한데 제공한다.
**v6.2.0 기준(2026-10 GA)**. 라이선스가 둘로 나뉜다. 저장소의 Isaac Sim 소스는 Apache-2.0 이지만, 빌드·실행에 필요한 Omniverse Kit SDK, 3D 모델·텍스처 같은 추가 구성요소는 NVIDIA 의 "Isaac Sim Additional Software and Materials License" 를 따른다(저장소 LICENSE 에 명시). 그래서 `pricing` 은 완전한 oss 가 아니라 free(사용 무료·일부 구성요소 NVIDIA 조건)로 분류했다. 상업 이용 조건은 해당 약관 원문을 확인할 것.
로봇 학습 프레임워크 [Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/) 은 Isaac Sim 을 물리·렌더 백엔드 중 하나로 쓸 수 있다.

## 설치
요구사항(저장소 README 기준, 요약): Windows 11 또는 Ubuntu 22.04/24.04, **RTX GPU 필수**. 로컬 워크스테이션 최소 RTX 4080(권장 RTX 5080·RTX 5880 Ada), 데이터센터 최소 A40. 드라이버·상세 GPU 목록은 NVIDIA 기술 요구사항 문서를 따른다. Python 3.12, Linux 는 GLIBC 2.35+ 필요. 설치 중 Kit 확장을 내려받으므로 인터넷이 필요하다.

pip 설치(전용 가상환경 권장 — Newton·Warp·MuJoCo 등 의존성을 고정 버전으로 끌어옴):
```bash
python3.12 -m venv env_isaacsim && source env_isaacsim/bin/activate
pip install --upgrade pip
pip install torch==2.11.0 --index-url https://download.pytorch.org/whl/cu128   # CUDA 13 이면 cu130
pip install "isaacsim[all,extscache]==6.2.0.0" --extra-index-url https://pypi.nvidia.com
```
소스 빌드(`build.sh`), 컨테이너(NVIDIA Container Toolkit), 바이너리 다운로드 방식도 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| OpenUSD(USD) | 장면·로봇·소재를 담는 파일 포맷이자 데이터 모델. 모든 에셋이 prim 계층으로 존재 |
| Omniverse Kit | Isaac Sim 이 얹힌 확장(extension) 기반 앱 런타임 |
| `SimulationApp` | 파이썬 스크립트에서 Isaac Sim 을 기동(GUI 또는 headless)하는 진입점 |
| PhysX | 기본 GPU 가속 물리 엔진 |
| RTX 센서 | 레이트레이싱 기반 카메라·라이다 |
| Replicator | 도메인 랜덤화와 라벨링된 합성 데이터 생성 파이프라인 |
| ROS 2 브리지 | OmniGraph 노드로 토픽·TF·센서 데이터를 ROS 2 와 교환 |

## 기본 사용법
pip 설치 후 GUI 로 첫 실행(처음에는 확장 캐시 때문에 오래 걸릴 수 있음):
```bash
isaacsim            # 전체 앱 실행
```
파이썬에서 headless 로 기동(경로·모듈 이름은 6.x 문서의 해당 버전을 확인):
```python
from isaacsim import SimulationApp
app = SimulationApp({"headless": True})   # 다른 isaacsim 모듈 import 보다 먼저 호출

# ... 여기서부터 isaacsim.* 모듈을 import 하여 월드·로봇 구성 ...

app.close()
```
세부 API(월드 구성, 로봇 로드, 센서)는 버전마다 모듈명이 바뀌어 왔으므로 6.2 공식 튜토리얼의 코드를 기준으로 삼는다.

## 자주 쓰는 패턴
- **에셋 임포트**: URDF·MJCF 를 USD 로 변환해 불러온 뒤 조인트 드라이브·충돌 형상을 튜닝한다.
- **합성 데이터**: Replicator 로 조명·텍스처·위치를 랜덤화해 학습용 이미지와 라벨을 대량 생성한다.
- **ROS 2 연동**: OmniGraph 의 ROS 2 노드로 카메라·라이다·오도메트리를 퍼블리시하고 cmd_vel 을 구독한다.
- **RL 학습**: 직접 쓰기보다 [Isaac Lab](/develop-wiki/robotics/robot-learning/isaac-lab/) 의 환경·학습 스크립트를 얹어 쓴다.
- **클라우드·원격**: 컨테이너 + 헤드리스로 GPU 서버에서 돌리고 스트리밍으로 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 카메라·라이다 중심 인식 파이프라인의 현실감 있는 시뮬레이션, 합성 데이터 생성, NVIDIA 하드웨어(Jetson 등) 대상 디지털 트윈.
- 피할 때(대안): RTX GPU 가 없거나 가벼운 ROS 2 통합 테스트는 [Gazebo](/develop-wiki/robotics/simulation/gazebo/), 접촉 물리·학습 속도 위주는 [MuJoCo](/develop-wiki/robotics/simulation/mujoco/), 순수 오픈소스 라이선스 요구는 위 이중 라이선스를 검토.

## 공식 문서
- [Isaac Sim 문서](https://docs.isaacsim.omniverse.nvidia.com/latest/index.html) · [Python 환경 설치](https://docs.isaacsim.omniverse.nvidia.com/latest/installation/install_python.html)
- [릴리스 노트(6.2.0)](https://docs.isaacsim.omniverse.nvidia.com/6.2.0/overview/release_notes.html) · [GitHub](https://github.com/isaac-sim/IsaacSim)
