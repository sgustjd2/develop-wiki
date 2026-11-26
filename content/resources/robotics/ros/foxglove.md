---
name: Foxglove
url: https://foxglove.dev
docs: https://docs.foxglove.dev/docs/introduction
repo: https://github.com/foxglove/foxglove-sdk
stars: 328
domain: robotics
category: ros
description: 로봇·피지컬 AI 데이터를 실시간 스트리밍하거나 MCAP 로 기록해 보는 시각화·디버깅 플랫폼. ROS 2 는 foxglove_bridge 로, 자체 코드는 SDK(Python·Rust·C++)로 연결한다.
pricing: freemium
tags: [visualization, mcap, ros2, foxglove-bridge, debugging, logging]
languages: [python, rust, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Foxglove 는 로봇 로그·센서 데이터를 기록하고 시각화하는 플랫폼이다. 공식 문서 기준 구성은 다음과 같다.

| 구성 | 역할 |
| --- | --- |
| Foxglove 앱 | 데스크톱·브라우저에서 3D, 이미지, 플롯, 로그 패널로 재생·디버깅 |
| Foxglove Bridge | ROS 기반 로봇의 라이브 데이터를 앱으로 스트리밍 |
| Foxglove SDK | C++·Python·Rust 코드에서 라이브 스트리밍하거나 MCAP 파일로 저장 |
| Data Platform / Foxlet | 녹화 파일 업로드·색인·검색을 위한 호스팅 저장소와 로봇 측 업로더 |
| MCAP | SDK 가 기록하는 오픈소스 파일 포맷 |

- 이 문서는 **SDK v0.31.0**(2026-11-13)과 ROS 패키지 릴리스 `ros-v3.6.3`(2026-10-21) 시점이다. SDK 저장소(`foxglove/foxglove-sdk`)는 MIT 다. 앱과 Data Platform 은 서비스이며 요금제는 아래와 같다. 이전 앱 저장소 `foxglove/studio` 는 archived 상태다.
- 요금(확인일 기준): Free 는 월 $0(저장 10GB, 사용자 3명, 장치 5대, 프로젝트 1개), Pro 는 월 $20 + 사용량, Enterprise 는 별도 협의, 학교·연구용 Academic 은 $0(.edu·.ac 이메일). 수치는 바뀔 수 있어 [가격 페이지](https://foxglove.dev/pricing)로 확인한다.
- 위치: ROS 2 의 기본 시각화는 [RViz2](/develop-wiki/robotics/ros/rviz2/)이고, 원격·재생·플롯·팀 공유가 필요할 때 Foxglove 를 함께 쓴다.

## 설치
ROS 2 에서는 apt 로 브리지를 설치한다(Humble 이전 배포판은 소스 빌드가 필요하다고 안내).
```bash
sudo apt install ros-$ROS_DISTRO-foxglove-bridge
```
Python SDK 는 패키지 하나다.
```bash
uv add foxglove-sdk      # 또는 pip install foxglove-sdk
```
앱은 [app.foxglove.dev](https://app.foxglove.dev) 에서 계정을 만들어 브라우저로 쓰거나 데스크톱 앱을 내려받는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Foxglove WebSocket | 앱과 브리지·SDK 서버가 쓰는 라이브 연결 프로토콜 |
| 채널 / 스키마 | 토픽에 해당하는 메시지 스트림과 그 데이터 형식. SDK 에 내장 스키마(이미지, 포인트클라우드 등)가 있고 커스텀 직렬화도 가능 |
| MCAP | 여러 채널을 시간순으로 담는 컨테이너 파일. ROS bag 대신 쓸 수 있고 앱에서 바로 연다 |
| 레이아웃 | 패널 배치 설정. 팀 단위로 공유 |
| Device | Data Platform 에 등록되는 로봇. 업로드는 Foxlet 이 담당 |

## 기본 사용법
**1. ROS 2 라이브 연결**
```bash
ros2 launch foxglove_bridge foxglove_bridge_launch.xml
```
앱에서 **Open connection → Foxglove WebSocket** 을 고르고 `ws://localhost:8765`(원격 로봇이면 `ws://ROBOT_IP:8765`)를 입력한다. 공식 튜토리얼의 예시 포트가 8765 다. 파라미터는 `이름:=값` 형식으로 넘긴다.

**2. Python SDK 로 직접 스트리밍·기록**
```python
import time
import foxglove

foxglove.start_server()            # 앱에서 Foxglove WebSocket 으로 접속
while True:
    foxglove.log("/hello", {"time": time.time()})
    time.sleep(0.03)
```
파일로 남기려면 `with foxglove.open_mcap("example.mcap"):` 블록 안에서 같은 `foxglove.log` 를 호출한다.

## 자주 쓰는 패턴
- **RViz2 대체·보완**: 브리지로 연결해 3D·이미지·플롯 패널을 한 화면에 구성하고 레이아웃을 팀에 공유한다.
- **현장 녹화 → 사후 분석**: 로봇에서 MCAP 로 기록해 두었다가 앱에서 열어 재생한다.
- **ROS 없는 시스템**: 임베디드·자체 미들웨어 코드에서 SDK 로 로그를 남긴다.
- **원격 접속**: `FOXGLOVE_DEVICE_TOKEN` 을 설정하고 `remote_access:=true` 로 브리지를 띄우면 직접 네트워크 연결 없이 플랫폼을 거쳐 접속한다(공식 브리지 문서 기준).
- **웹 대시보드가 목적이면**: [rosbridge_suite](/develop-wiki/robotics/ros/rosbridge-suite/) 가 JSON/WebSocket 으로 직접 만드는 웹 UI 에 맞다.

## 언제 쓰나 / 피할 때
- 쓸 때: 센서·카메라 데이터를 팀이 함께 보고 재생해야 할 때, 현장 로그를 클라우드에 모아야 할 때.
- 피할 때(대안): 로컬에서 ROS 토픽만 빠르게 볼 때는 [RViz2](/develop-wiki/robotics/ros/rviz2/), 오프라인 환경에서 앱 자체를 자체 호스팅해야 하면 Enterprise 요금제 범위를 먼저 확인한다.

## 공식 문서
- [소개](https://docs.foxglove.dev/docs/introduction) · [ROS 2 시작하기](https://docs.foxglove.dev/docs/getting-started/frameworks/ros2?modality=live) · [Python 시작하기](https://docs.foxglove.dev/docs/getting-started/python) · [Bridge](https://docs.foxglove.dev/docs/fleet/bridge) · [SDK 저장소](https://github.com/foxglove/foxglove-sdk)
