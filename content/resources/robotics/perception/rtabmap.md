---
name: RTAB-Map
url: https://introlab.github.io/rtabmap/
docs: https://introlab.github.io/rtabmap/
repo: https://github.com/introlab/rtabmap
stars: 4126
domain: robotics
category: perception
description: RGB-D·스테레오·라이다 입력을 쓰는 그래프 기반 SLAM. 외관 기반 루프 클로저와 메모리 관리로 대규모 장시간 매핑에 쓰고 ROS 2 래퍼를 제공한다.
pricing: oss
tags: [slam, rgbd, stereo, lidar, loop-closure, 3d-mapping]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
RTAB-Map(Real-Time Appearance-Based Mapping)은 시각 단어 기반 루프 클로저 감지와 그래프 최적화로 지도를 만드는 SLAM 이다. RGB-D, 스테레오, 3D 라이다 입력을 받아 3D 점군·점유 격자·메시를 만들 수 있고, 작업 메모리·장기 메모리 구조로 대규모 환경의 실시간성을 유지한다. 라이선스는 3-clause BSD(저장소 LICENSE, GitHub API 는 NOASSERTION). 최신 릴리스 0.24.2(2026-10-25), ROS 2 Lyrical 패키지(rtabmap 0.23.14, rtabmap_ros 0.23.13)는 한 단계 뒤다.

ROS 2 래퍼는 별도 저장소 [rtabmap_ros](https://github.com/introlab/rtabmap_ros)(BSD-3-Clause)이며 `lyrical-devel` 브랜치가 있다.

## 설치
```bash
sudo apt install ros-lyrical-rtabmap-ros      # rtabmap 라이브러리 + ROS 2 패키지
```
standalone(앱·라이브러리)은 저장소의 빌드 안내(CMake)나 릴리스 바이너리를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `rtabmap_slam` | SLAM 코어 노드 (`rtabmap`) |
| `rtabmap_odom` | 시각·라이다 오도메트리(rgbd_odometry, icp_odometry, stereo_odometry) |
| `rtabmap_sync` | RGB·Depth·CameraInfo·Odom 동기화 |
| `rtabmap_viz` | 전용 GUI. RViz 플러그인도 있음 |
| 데이터베이스 `~/.ros/rtabmap.db` | 매핑 결과(그래프, 이미지, 점군) 저장. 재사용·후처리 |
| Mapping / Localization 모드 | 새 지도 작성 vs 기존 DB 로 위치 추정 |
| 루프 클로저 | 시각 단어 유사도로 장소 재인식 |

## 기본 사용법
RGB-D 카메라로 매핑(토픽 이름은 카메라에 맞게 변경):
```bash
ros2 launch rtabmap_launch rtabmap.launch.py \
  rgb_topic:=/camera/color/image_raw \
  depth_topic:=/camera/aligned_depth_to_color/image_raw \
  camera_info_topic:=/camera/color/camera_info \
  frame_id:=base_link approx_sync:=true \
  args:="--delete_db_on_start"
```
`--delete_db_on_start` 를 빼면 기존 DB 위에 이어서 매핑한다. 위치 추정만 하려면 localization 모드(launch 의 `localization:=true`)로 같은 DB 를 쓴다.

## 자주 쓰는 패턴
- **오도메트리 분리**: 바퀴 오도메트리를 쓰면 `visual_odometry:=false` 로 두고 외부 odom 을 입력, 시각 오도메트리는 슬립이 큰 로봇에 쓴다.
- **라이다 + 카메라**: 라이다 ICP 오도메트리와 카메라 루프 클로저를 결합.
- **2D 지도 생성**: 3D 데이터에서 `/map` 점유 격자를 만들어 [Nav2](/develop-wiki/robotics/navigation-planning/nav2/) 에 공급.
- **DB 내보내기**: `rtabmap-databaseViewer`, `rtabmap-export` 로 점군·메시 추출 후 [Open3D](/develop-wiki/robotics/perception/open3d/) 등에서 후처리.
- **카메라 동기화·캘리브레이션** 문제가 가장 흔한 실패 원인이다([OpenCV](/develop-wiki/robotics/perception/opencv/) 캘리브레이션 참고).

## 언제 쓰나 / 피할 때
- 쓸 때: RGB-D·스테레오 카메라 기반 3D 매핑, 장시간·대규모 환경, 라이다와 카메라 혼합.
- 피할 때: 2D 라이다만 쓰는 단순 실내 지도는 [slam_toolbox](/develop-wiki/robotics/perception/slam-toolbox/) 가 설정이 단순하다. GPL 시각 SLAM(ORB-SLAM3 등)을 대체로 검토할 때는 라이선스를 별도로 확인한다.

## 공식 문서
- [RTAB-Map 위키](https://introlab.github.io/rtabmap/) · [rtabmap_ros](https://github.com/introlab/rtabmap_ros) · [GitHub](https://github.com/introlab/rtabmap)
