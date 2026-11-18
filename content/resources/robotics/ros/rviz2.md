---
name: RViz2
url: https://github.com/ros2/rviz
docs: https://docs.ros.org/en/lyrical/Developer-Tools/Visualization/RViz/RViz-User-Guide/RViz-User-Guide.html
repo: https://github.com/ros2/rviz
stars: 502
domain: robotics
category: ros
description: ROS 2 의 3D 시각화 도구. TF, 센서 데이터, 지도, 경로, 로봇 모델을 디스플레이 플러그인으로 한 화면에 보여준다.
pricing: oss
tags: [rviz, visualization, tf, debugging, ros2]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
RViz2 는 ROS 토픽을 구독해 3D 뷰에 그려주는 Qt·OGRE 기반 GUI 로, 로봇 개발의 기본 디버깅 창이다. 데이터를 가공하지 않고 "노드가 지금 무엇을 보고 계획하는지"를 확인하는 용도이며, 새 시각화는 플러그인으로 추가한다. 저장소 라이선스는 BSD 계열(GitHub 표기 BSD-3-Clause-Clear). ROS 2 Lyrical 의 rviz 패키지는 15.2.7.

## 설치
`ros-lyrical-desktop` 에 포함된다. 단독 설치:
```bash
sudo apt install ros-lyrical-rviz2
rviz2
rviz2 -d my_config.rviz     # 저장한 설정 파일 사용
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Fixed Frame | 모든 데이터를 이 TF 프레임 기준으로 표시. 틀리면 "No transform" 오류 |
| Display | 데이터 종류별 렌더러(TF, RobotModel, LaserScan, PointCloud2, Map, Path, Marker …) |
| Panel / Tool | 시점 이동, `2D Pose Estimate`, `2D Goal Pose`, `Publish Point` 등 |
| Marker / MarkerArray | 코드에서 도형·텍스트를 그려 디버깅 |
| 설정 파일 | `.rviz` 로 디스플레이 구성 저장 |

## 기본 사용법
코드에서 디버그용 구를 그리는 Marker 발행(Python):
```python
import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker

class Dbg(Node):
    def __init__(self):
        super().__init__("dbg")
        self.pub = self.create_publisher(Marker, "debug_marker", 1)
        self.create_timer(0.5, self.tick)

    def tick(self):
        m = Marker()
        m.header.frame_id = "map"
        m.header.stamp = self.get_clock().now().to_msg()
        m.type, m.action = Marker.SPHERE, Marker.ADD
        m.pose.orientation.w = 1.0
        m.scale.x = m.scale.y = m.scale.z = 0.3
        m.color.r, m.color.a = 1.0, 1.0
        self.pub.publish(m)

rclpy.init(); rclpy.spin(Dbg())
```
RViz2 에서 `Add → Marker` 로 `debug_marker` 토픽을 선택한다.

## 자주 쓰는 패턴
- 시뮬레이션/실기 공통으로 `use_sim_time:=true` 를 맞추지 않으면 타임스탬프 불일치로 아무것도 안 보인다.
- 센서 토픽 QoS 는 best effort 인 경우가 많아 Display 의 Reliability 를 맞춘다.
- Nav2 에서는 `2D Pose Estimate` 로 초기 위치, `2D Goal Pose` 로 목표 지정([Nav2](/develop-wiki/robotics/navigation-planning/nav2/)).
- `.rviz` 설정을 launch 의 `arguments=['-d', ...]` 로 함께 띄운다.

## 언제 쓰나 / 피할 때
- 쓸 때: 개발 중 TF·센서·계획 결과 확인, 데모 시연.
- 피할 때: 원격·웹 대시보드, 로그 재생·플롯이 필요하면 Foxglove(foxglove_bridge, MIT)나 rosbridge 같은 별도 도구가 낫다. 코어는 [ROS 2](/develop-wiki/robotics/ros/ros2/).

## 공식 문서
- [RViz 사용자 가이드](https://docs.ros.org/en/lyrical/Developer-Tools/Visualization/RViz/RViz-User-Guide/RViz-User-Guide.html) · [GitHub](https://github.com/ros2/rviz)
