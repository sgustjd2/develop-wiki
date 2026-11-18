---
name: Articulated Robotics
url: https://articulatedrobotics.xyz
docs: https://articulatedrobotics.xyz/tutorials/
domain: robotics
category: learning
description: Josh Newans 의 ROS 로봇 제작 튜토리얼 사이트·유튜브 채널. URDF, ros2_control, 센서, 내비게이션까지 모바일 로봇을 직접 만드는 과정을 보여준다.
pricing: free
tags: [ros2, tutorial, video, mobile-robot, urdf, diy]
languages: [python, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Articulated Robotics 는 ROS 로 모바일 로봇을 처음부터 만드는 과정을 유튜브 영상과 텍스트 튜토리얼로 공개하는 개인 프로젝트다. 설계(URDF, 시뮬레이션) → 하드웨어(모터 제어, 마이크로컨트롤러) → 소프트웨어(ros2_control, 센서, SLAM·Nav2) 순서의 "Build a Mobile Robot with ROS" 시리즈가 중심이고, Docker, 좌표 변환, 기하 팁 같은 보조 튜토리얼도 있다. 시청·열람은 무료이며 후원(Patreon)은 선택이다.

사이트 튜토리얼 개요 페이지는 "Beta site test" 로 표시돼 있고 모든 영상이 최신 배포판(Lyrical)을 기준으로 갱신됐는지는 확인하지 못했다. 영상의 명령과 파라미터는 **자신의 배포판 문서와 대조**해서 쓴다. 저장소·라이선스 정보는 확인하지 않았다.

## 설치
설치할 것은 없고 영상과 문서를 본다. 실습 환경은 [ROS 2 공식 문서](/develop-wiki/robotics/learning/ros2-documentation/) 의 설치 가이드대로 만든다. 사이트의 Docker 튜토리얼로 컨테이너 개발 환경을 구성할 수 있다.

## 핵심 개념
| 시리즈·주제 | 다루는 내용 |
| --- | --- |
| Getting Ready to build a ROS robot | ROS 개념, 도구, 환경 준비 |
| Build a Mobile Robot with ROS | URDF 로 로봇 모델링, 시뮬레이션, 하드웨어 연결, 제어, 센서, SLAM, 내비게이션 |
| Docker for Robotics | 컨테이너로 ROS 개발 환경 구성 |
| Coordinate Transforms For Robotics | 프레임·변환 개념과 tf |
| Geometry Tips | 회전·쿼터니언 등 기하 요령 |

## 기본 사용법
따라 하는 방법:
1. 영상 한 편을 보고, 같은 단계를 **자기 배포판**에서 구현한다.
2. 코드가 안 맞으면 [ROS 2 문서](https://docs.ros.org/en/lyrical/) 의 해당 배포판 페이지에서 인터페이스·파라미터명을 확인한다.
3. 로봇 모델이 생기면 [RViz2](/develop-wiki/robotics/ros/rviz2/) 로 확인하고, 구동은 [ros2_control](/develop-wiki/robotics/ros/ros2-control/) 로 연결한다.
4. 마지막에 [slam_toolbox](/develop-wiki/robotics/perception/slam-toolbox/) 와 [Nav2](/develop-wiki/robotics/navigation-planning/nav2/) 로 지도·주행을 붙인다.

## 자주 쓰는 패턴
- **한 번에 하나만 바꾸기**: 영상과 다른 배포판을 쓰면 오류 원인이 늘어난다. 처음에는 영상과 같은 환경을 쓰고 이후 이식한다.
- **시뮬레이션 우선**: 하드웨어 없이도 URDF·제어 구간까지 진행 가능하다.
- **커뮤니티 활용**: 사이트에 Discourse 포럼과 GitHub 링크가 있다.
- **이론 보완**: 변환·야코비안이 막히면 [Modern Robotics](/develop-wiki/robotics/learning/modern-robotics/) 를 병행.

## 언제 쓰나 / 피할 때
- 쓸 때: 영상 중심으로 첫 모바일 로봇을 만들며 ROS 를 익히려는 입문자·메이커.
- 피할 때: 최신 배포판 기준의 정확한 API 참조가 필요하면 공식 문서가 우선이다. 이론·논문 수준의 깊이는 다루지 않는다.

## 공식 문서
- [튜토리얼 개요](https://articulatedrobotics.xyz/tutorials/) · [YouTube 채널](https://www.youtube.com/@ArticulatedRobotics) · [사이트](https://articulatedrobotics.xyz)
