---
name: colcon
url: https://colcon.readthedocs.io
docs: https://colcon.readthedocs.io/en/released/
repo: https://github.com/colcon/colcon-core
stars: 135
domain: robotics
category: ros
description: 여러 패키지로 이뤄진 ROS 2 워크스페이스를 한 번에 빌드·테스트하는 CLI. ament_cmake·ament_python·CMake 패키지를 의존성 순서대로 처리한다.
pricing: oss
tags: [build, ros2, workspace, ament, cmake, test]
languages: [python, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
colcon 은 `src/` 아래 여러 패키지를 찾아 의존성 순서로 병렬 빌드하고 `install/` 에 결과를 모으는 빌드 도구다. ROS 2 의 표준 빌드 도구이며 ament_cmake, ament_python, 일반 CMake 등 빌드 타입을 확장으로 처리한다. Python 으로 작성됐고 Apache-2.0. 최신 태그는 0.21.3 이다(2026-11 확인).

## 설치
Ubuntu 설치 문서는 `sudo apt install ros-dev-tools` 를 개발 도구 설치로 안내한다. 단독 설치는 `pip install colcon-common-extensions` 또는 `sudo apt install python3-colcon-common-extensions`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 워크스페이스 | `src/`, `build/`, `install/`, `log/` 구조 |
| underlay / overlay | 이미 source 한 기존 환경 위에 새 워크스페이스를 덧씌움 |
| `--symlink-install` | Python·launch·YAML 등 설치 파일을 심볼릭 링크로 연결해 재빌드 없이 수정 반영 |
| `--packages-select` / `--packages-up-to` | 일부 패키지 또는 의존 포함 빌드 |
| `colcon test` | 패키지 테스트 실행, `colcon test-result` 로 요약 |
| `COLCON_DEFAULTS_FILE` | 기본 인자를 yaml 로 고정 |

## 기본 사용법
```bash
source /opt/ros/lyrical/setup.bash
mkdir -p ~/ws/src && cd ~/ws
git clone <패키지 저장소> src/my_pkg
rosdep install --from-paths src --ignore-src -y     # 의존성 설치
colcon build --symlink-install --cmake-args -DCMAKE_BUILD_TYPE=Release
source install/setup.bash
colcon test --packages-select my_pkg && colcon test-result --verbose
```

## 자주 쓰는 패턴
- 개발 중 `--symlink-install` 로 Python 노드·launch 수정 즉시 반영.
- `--event-handlers console_direct+` 로 빌드 로그를 실시간 확인.
- CI 에서 `colcon build --packages-up-to <pkg>` 로 필요한 부분만 빌드.
- `compile_commands.json` 은 `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON` 로 생성해 IDE 연동.
- 빌드가 꼬이면 `rm -rf build install log` 후 재빌드.

## 언제 쓰나 / 피할 때
- 쓸 때: [ROS 2](/develop-wiki/robotics/ros/ros2/) 패키지 개발·소스 빌드(배포판 저장소 포함).
- 피할 때: 순수 CMake·Cargo 단일 프로젝트는 각자의 빌드 도구로 충분하다.

## 공식 문서
- [colcon 문서](https://colcon.readthedocs.io/en/released/) · [ROS 2 colcon 튜토리얼](https://docs.ros.org/en/lyrical/ROS-Framework/client-libraries/Working-with-Client-Libraries/Colcon-Tutorial.html)
