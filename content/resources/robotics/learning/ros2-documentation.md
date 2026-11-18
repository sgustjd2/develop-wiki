---
name: ROS 2 공식 문서·튜토리얼
url: https://docs.ros.org/en/lyrical/
docs: https://docs.ros.org/en/lyrical/First-Steps.html
repo: https://github.com/ros2/ros2_documentation
stars: 1072
domain: robotics
category: learning
description: Open Robotics 가 운영하는 ROS 2 공식 문서. 설치, First Steps 학습 경로, 개념, 튜토리얼, 배포판 릴리스 노트를 배포판별로 제공한다.
pricing: free
tags: [ros2, tutorial, documentation, learning-path, release-notes]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
docs.ros.org 는 ROS 2 의 1차 학습·참조 자료다. 배포판별 URL(`/en/lyrical/`, `/en/jazzy/`, `/en/humble/`, `/en/rolling/`)로 나뉘어 있어 **사용하는 배포판의 문서를 보는 것**이 중요하다. 문서 소스(`ros2_documentation`)는 CC-BY-4.0 이라 무료로 읽고 공유·인용할 수 있다. 한국어 공식 번역은 확인하지 못했다.

2026-11 기준 현재 LTS 는 Lyrical Luth(EOL 2031-05)이고 Jazzy(2029-05), Humble(2027-05)이 지원 중이다. Lyrical 문서는 사이트 구조가 개편되어 `Get-Started`, `ROS-Framework`, `Developer-Tools` 같은 상위 구분을 쓴다. 예전 블로그·강의 링크가 `Tutorials/...` 경로로 깨져 있을 수 있다.

## 설치
읽기만 하는 자료라 설치는 없다. 실습을 위한 환경은 문서의 설치 가이드를 따른다.
- [Lyrical 설치 개요](https://docs.ros.org/en/lyrical/Get-Started/Installation.html) · [Ubuntu 패키지 설치](https://docs.ros.org/en/lyrical/Get-Started/Installation/Ubuntu-Install-Debs.html)
- Lyrical 은 Ubuntu 26.04(Tier 1), Windows 11(Tier 1), RHEL 10(Tier 2)을 지원한다. 학습용이면 Docker 컨테이너(공식 `ros` 이미지)도 방법이다.

## 핵심 개념
| 문서 영역 | 내용 |
| --- | --- |
| First Steps | 환경 설정 → Turtlesim → CLI 도구까지 입문 학습 경로 |
| Get-Started / Installation | 플랫폼별 설치, RMW(DDS·Zenoh) 선택 |
| ROS-Framework | 노드, 토픽·서비스·액션, 파라미터, QoS, 클라이언트 라이브러리 튜토리얼(colcon, 워크스페이스, 패키지, 인터페이스, tf2 등) |
| Developer-Tools | RViz·rqt, 디버깅, 빌드·릴리스, rosbag |
| Releases | 배포판 변경 요약, 지원 플랫폼, 타임라인 |
| Concepts / About | 설계 문서, 용어집 |
| 패키지 문서 | `docs.ros.org/en/lyrical/p/<package>/` 형태로 개별 패키지 문서 |

## 기본 사용법
학습 순서 제안(공식 경로 기반, 자기 일정에 맞춰 조정):
1. [First Steps](https://docs.ros.org/en/lyrical/First-Steps.html) 로 환경 설정과 Turtlesim, `ros2 topic/node/service` CLI 체험.
2. 워크스페이스·패키지 만들기, [colcon 튜토리얼](https://docs.ros.org/en/lyrical/ROS-Framework/client-libraries/Working-with-Client-Libraries/Colcon-Tutorial.html), 간단한 publisher/subscriber 를 [Python](/develop-wiki/languages/python/) 과 [C++](/develop-wiki/languages/cpp/) 로 작성.
3. 커스텀 인터페이스(msg/srv/action), 파라미터, launch, tf2.
4. 주제별 패키지로 확장: [Nav2](/develop-wiki/robotics/navigation-planning/nav2/), [MoveIt 2](/develop-wiki/robotics/navigation-planning/moveit2/), [ros2_control](/develop-wiki/robotics/ros/ros2-control/).

## 자주 쓰는 패턴
- 버전 표시(왼쪽 아래 "v:")를 확인해 배포판을 맞춘다. 검색 결과는 종종 옛 배포판 문서로 연결된다.
- 패키지 API 는 `docs.ros.org/en/ros2_packages/<distro>/api/<package>/` 에서 확인한다(예: slam_toolbox).
- 릴리스 노트의 "Supported Platforms" 표로 OS 와 Tier 를 확인한 후 설치 계획.
- 동작이 이상하면 `ros2 doctor` 와 문서의 Troubleshooting 을 먼저 본다.
- 개별 패키지(Nav2, MoveIt, ros2_control)는 자체 문서 사이트가 더 자세하다.

## 언제 쓰나 / 피할 때
- 쓸 때: ROS 2 입문, 설치, 개념·API 확인, 릴리스·지원 일정 확인. 코어 소개는 [ROS 2](/develop-wiki/robotics/ros/ros2/).
- 피할 때: 로봇 기구학·제어 이론 같은 일반 로보틱스 수학은 다루지 않는다 → [Modern Robotics](/develop-wiki/robotics/learning/modern-robotics/), [Underactuated Robotics](/develop-wiki/robotics/learning/underactuated-robotics/). 영상 강의 형태는 [Articulated Robotics](/develop-wiki/robotics/learning/articulated-robotics/).

## 공식 문서
- [Lyrical 문서](https://docs.ros.org/en/lyrical/) · [릴리스 목록](https://docs.ros.org/en/lyrical/Releases.html) · [REP-2000](https://reps.openrobotics.org/rep-2000/) · [문서 저장소](https://github.com/ros2/ros2_documentation)
