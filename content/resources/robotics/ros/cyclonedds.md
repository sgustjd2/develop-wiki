---
name: Eclipse Cyclone DDS
url: https://cyclonedds.io
docs: https://cyclonedds.io/docs/
repo: https://github.com/eclipse-cyclonedds/cyclonedds
stars: 1370
domain: robotics
category: ros
description: Eclipse 재단의 C 기반 DDS 구현. ROS 2 에서 rmw_cyclonedds_cpp 로 선택할 수 있고 가볍고 설정이 단순하다.
pricing: oss
tags: [dds, rtps, rmw, eclipse, middleware, iceoryx]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Eclipse Cyclone DDS 는 Eclipse Foundation 의 DDS 구현으로, 코어는 C 이고 C++·Python 바인딩이 있다. ROS 2 에서는 `rmw_cyclonedds_cpp` 로 쓰며 널리 쓰이는 대안 RMW 다(기본값은 [Fast DDS](/develop-wiki/robotics/ros/fast-dds/)). 라이선스는 EPL-2.0 또는 EDL-1.0 중 선택(저장소 LICENSE 기준, GitHub API 는 NOASSERTION 으로 표시).

2026-11 기준 최신 릴리스는 11.1.0(2026-11-09)이고, ROS 2 Lyrical 바이너리(`cyclonedds` 11.0.1, `rmw_cyclonedds_cpp` 4.1.6)는 11.0.x 계열이다.

## 설치
```bash
sudo apt install ros-lyrical-rmw-cyclonedds-cpp
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
ros2 run demo_nodes_cpp talker
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `CYCLONEDDS_URI` | XML 설정 파일 경로 또는 인라인 XML. 네트워크 인터페이스·디스커버리 지정 |
| 네트워크 인터페이스 | 여러 NIC 환경에서 `<NetworkInterface>` 로 통신 NIC 고정 |
| 디스커버리 | 기본 멀티캐스트 SPDP. `<Peers>` 로 유니캐스트 피어 지정 |
| 공유 메모리 | iceoryx 연동으로 같은 호스트 zero-copy(별도 빌드·설정 필요) |
| QoS | DDS 표준 QoS. ROS 2 프로파일이 매핑 |

## 기본 사용법
특정 NIC 만 쓰고 멀티캐스트를 끄는 설정:
```bash
export CYCLONEDDS_URI='<CycloneDDS><Domain><General>
  <Interfaces><NetworkInterface name="wlan0"/></Interfaces>
  <AllowMulticast>false</AllowMulticast></General>
  <Discovery><Peers><Peer address="192.168.0.10"/></Peers></Discovery>
</Domain></CycloneDDS>'
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
ros2 run demo_nodes_cpp listener
```

## 자주 쓰는 패턴
- **멀티 NIC 로봇**: 이더넷/Wi-Fi 가 섞이면 인터페이스를 명시해 디스커버리 혼선을 막는다.
- **Wi-Fi 에서 멀티캐스트 문제**: 피어 목록을 명시한 유니캐스트 디스커버리.
- **RMW 비교 테스트**: 같은 launch 에서 `RMW_IMPLEMENTATION` 만 바꿔 지연·손실을 비교한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 기본 RMW 에서 디스커버리·대역폭 문제가 있어 다른 DDS 로 바꿔 보고 싶을 때, 단순한 설정을 선호할 때.
- 피할 때: 원격·광역망 중심이면 [Zenoh](/develop-wiki/robotics/ros/zenoh/). 코어는 [ROS 2](/develop-wiki/robotics/ros/ros2/).

## 공식 문서
- [Cyclone DDS 문서](https://cyclonedds.io/docs/) · [ROS 2 에서 Cyclone DDS 사용](https://docs.ros.org/en/lyrical/Get-Started/Installation/RMW-Implementations/DDS-Implementations/Working-with-Eclipse-CycloneDDS.html) · [GitHub](https://github.com/eclipse-cyclonedds/cyclonedds)
