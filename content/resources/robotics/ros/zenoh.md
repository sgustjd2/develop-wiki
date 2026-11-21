---
name: Zenoh (rmw_zenoh)
url: https://zenoh.io
docs: https://zenoh.io/docs/getting-started/first-app/
repo: https://github.com/eclipse-zenoh/zenoh
stars: 3360
domain: robotics
category: ros
description: pub/sub·쿼리·저장을 통합한 저지연 네트워크 프로토콜. ROS 2 에서는 rmw_zenoh 로 DDS 를 대체해 광역망·무선·클라우드 연결에 쓴다.
pricing: oss
tags: [zenoh, rmw, pubsub, middleware, edge, rust]
languages: [rust, cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Zenoh 는 pub/sub, 분산 쿼리, 저장을 하나의 키 표현식(key expression) 모델로 묶은 프로토콜로, Rust 로 구현되어 있고 C·C++·Python·Kotlin 등 바인딩이 있다. 멀티캐스트에 의존하지 않고 라우터/피어 토폴로지로 로봇-클라우드·다수 로봇 구성을 다룬다. 라이선스는 EPL-2.0 OR Apache-2.0 이다(GitHub API 는 NOASSERTION, LICENSE 파일로 확인). 최신 릴리스는 1.10.2(2026-10-28).

ROS 2 쪽 구현은 별도 저장소 `ros2/rmw_zenoh`(Apache-2.0, 별 511)의 `rmw_zenoh_cpp` 이며 Lyrical 바이너리는 0.10.8 이다. 공식 문서에서 DDS 가 아닌 RMW 로 소개된다.

## 설치
```bash
sudo apt update && sudo apt install ros-lyrical-rmw-zenoh-cpp   # <DISTRO> 치환
```
Zenoh 자체(라우터 `zenohd`)는 공식 릴리스 바이너리나 Docker 를, 앱 라이브러리는 Rust 는 Cargo 의존성(`zenoh`), Python 은 `pip install eclipse-zenoh` 를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Session | 앱이 Zenoh 네트워크에 참여하는 단위 |
| Key expression | `robot/1/camera/**` 같은 계층 키. 와일드카드 구독 |
| Publisher / Subscriber | 키에 값을 쓰고 읽기 |
| Queryable / get | 요청-응답과 저장소 조회 |
| Router / Peer / Client | 토폴로지 모드. rmw_zenoh 는 노드 디스커버리에 라우터를 사용 |
| ROS 매핑 | 토픽·서비스가 키 표현식으로 변환. 라우터가 없으면 노드끼리 발견하지 못함 |

## 기본 사용법
ROS 2 에서(터미널 1에서 라우터, 2에서 노드):
```bash
ros2 run rmw_zenoh_cpp rmw_zenohd                 # 터미널 1
export RMW_IMPLEMENTATION=rmw_zenoh_cpp           # 터미널 2~
ros2 daemon stop                                   # 다른 RMW 로 뜬 daemon 정리
ros2 run demo_nodes_cpp talker
```
Python 바인딩 pub/sub(`pip install eclipse-zenoh`):
```python
import zenoh, time
s = zenoh.open(zenoh.Config())
sub = s.declare_subscriber("demo/hello", lambda sample: print(sample.payload.to_string()))
s.put("demo/hello", "hi")
time.sleep(1)
s.close()
```

## 자주 쓰는 패턴
- **원격 로봇 ↔ 서버**: 로봇마다 라우터를 두고 라우터끼리 TCP/QUIC 로 연결해 멀티캐스트 없이 그래프 공유.
- **설정 교체**: `ZENOH_ROUTER_CONFIG_URI`, `ZENOH_SESSION_CONFIG_URI`, `ZENOH_CONFIG_OVERRIDE` 로 라우터·세션 설정 지정.
- **라우터 점검**: `ZENOH_ROUTER_CHECK_ATTEMPTS` 로 라우터 연결 대기 횟수 제어.
- **대용량 메시지**: Lyrical 의 `rosidl::Buffer` 기능은 rmw_zenoh 에서도 쓸 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: Wi-Fi·셀룰러·클라우드로 이어지는 구성, 멀티캐스트가 막힌 네트워크, 다수 로봇.
- 피할 때: 단일 로봇·유선 LAN 에서 기본값으로 충분하면 [Fast DDS](/develop-wiki/robotics/ros/fast-dds/). 벤더 혼용은 보장되지 않는다. 라우터 프로세스 운영이 추가된다. 코어 [ROS 2](/develop-wiki/robotics/ros/ros2/), 언어 [Rust](/develop-wiki/languages/rust/).

## 공식 문서
- [Zenoh 문서](https://zenoh.io/docs/getting-started/first-app/) · [ROS 2 에서 Zenoh 사용](https://docs.ros.org/en/lyrical/Get-Started/Installation/RMW-Implementations/Non-DDS-Implementations/Working-with-Zenoh.html) · [rmw_zenoh README](https://github.com/ros2/rmw_zenoh)
