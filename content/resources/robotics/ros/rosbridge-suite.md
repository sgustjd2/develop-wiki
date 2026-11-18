---
name: rosbridge_suite
url: https://robotwebtools.github.io
docs: https://github.com/RobotWebTools/rosbridge_suite/blob/ros2/ROSBRIDGE_PROTOCOL.md
repo: https://github.com/RobotWebTools/rosbridge_suite
stars: 1254
domain: robotics
category: ros
description: ROS 에 JSON API 를 열어 주는 rosbridge v2 프로토콜 서버. WebSocket 으로 웹 브라우저·비 ROS 프로그램이 토픽 발행·구독과 서비스 호출을 할 수 있다.
pricing: oss
tags: [ros2, websocket, json, web, bridge, rosapi]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
rosbridge_suite 는 ROS 노드로 실행되어 JSON 메시지를 ROS 토픽·서비스·액션 호출로 바꿔 주는 서버다. 웹 페이지, 모바일 앱, ROS 가 설치되지 않은 프로그램도 WebSocket(또는 TCP)으로 로봇과 통신한다.

- 이 문서는 `ros2` 브랜치 패키지 **4.2.1** 기준이다(저장소 태그 `4.2.1`). 기본 브랜치 `ros2` 는 Jazzy 이후를, `humble` 브랜치는 Humble 을 추적한다고 README 가 설명한다. 라이선스는 BSD-3-Clause 다.
- 구성 패키지: `rosbridge_library`(프로토콜 구현), `rosbridge_server`(WebSocket 서버), `rosapi`(토픽·서비스 목록 조회), `rosbridge_msgs`.
- 대안: 프로토콜이 가볍고 브라우저용 클라이언트 [roslibjs](https://github.com/RobotWebTools/roslibjs)(최신 2.1.0)가 짝으로 쓰인다. 시각화·재생 중심이면 [Foxglove](/develop-wiki/robotics/ros/foxglove/), 3D 디버깅은 [RViz2](/develop-wiki/robotics/ros/rviz2/).

## 설치
```bash
sudo apt install ros-$ROS_DISTRO-rosbridge-suite
```
배포판별 패키지 버전은 [ROS Index](https://index.ros.org/p/rosbridge_suite/)에서 확인한다. 소스로 쓰려면 워크스페이스 `src/` 에 저장소를 clone 한 뒤 `colcon build` 한다([colcon](/develop-wiki/robotics/ros/colcon/)).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `op` | 모든 메시지의 동작 필드: `advertise`, `publish`, `subscribe`, `call_service` 등 |
| rosbridge v2 프로토콜 | JSON 기반 요청·응답 규격. 저장소의 `ROSBRIDGE_PROTOCOL.md` 가 명세 |
| `rosbridge_websocket` | 서버 노드. launch 인자 `port` 기본값 9090 |
| rosapi | 토픽·서비스·파라미터 목록을 조회하는 보조 노드(launch 파일이 함께 실행) |
| glob 인자 | `topics_glob`, `services_glob` 등으로 외부에 노출할 이름을 제한 |

## 기본 사용법
서버 실행:
```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```
클라이언트(WebSocket `ws://localhost:9090`)가 보내는 JSON 예시는 명세의 필드 규칙을 따른다.
```json
{"op": "subscribe", "id": "sub1", "topic": "/foo", "type": "std_msgs/msg/String"}
{"op": "advertise", "topic": "/foo", "type": "std_msgs/msg/String"}
{"op": "publish", "topic": "/foo", "msg": {"data": "hello"}}
{"op": "call_service", "id": "call1", "service": "/add_two_ints", "args": {"a": 1, "b": 2}}
```
`/foo`, `/add_two_ints` 는 예시 이름이다. 브라우저에서는 roslibjs 로 같은 주소에 연결한다.

## 자주 쓰는 패턴
- **웹 대시보드**: roslibjs 로 토픽을 구독해 차트·조이스틱 UI 를 만든다.
- **노출 범위 제한**: `topics_glob:=[...]` 등으로 필요한 토픽·서비스만 허용한다. launch 파일의 glob 인자 기본값은 빈 문자열이므로 네트워크에 노출할 때는 범위를 직접 정해 둔다.
- **TLS**: launch 인자 `ssl:=true` 와 `certfile`, `keyfile` 을 지정한다.
- **큰 메시지**: `max_message_size`(기본 10000000), `use_compression` 으로 조정한다. 이미지·포인트클라우드는 대역폭 부담이 크다.

## 언제 쓰나 / 피할 때
- 쓸 때: 웹·모바일 UI 가 ROS 와 JSON 으로 통신해야 할 때, ROS 설치 없이 외부 시스템을 붙일 때.
- 피할 때(대안): launch 인자에서 확인되는 보안 설정은 TLS 와 glob 뿐이므로, 신뢰할 수 없는 네트워크에 직접 열지 말고 앞단에 인증 프록시 등을 둔다. 고대역 스트림 시각화는 Foxglove 브리지, ROS 노드 간 통신은 일반 DDS.

## 공식 문서
- [저장소 README](https://github.com/RobotWebTools/rosbridge_suite) · [프로토콜 명세](https://github.com/RobotWebTools/rosbridge_suite/blob/ros2/ROSBRIDGE_PROTOCOL.md) · [ROS Index](https://index.ros.org/p/rosbridge_suite/)
