---
name: Fast DDS
url: https://www.eprosima.com/middleware/fast-dds
docs: https://fast-dds.docs.eprosima.com/en/latest/
repo: https://github.com/eProsima/Fast-DDS
stars: 2955
domain: robotics
category: ros
description: eProsima 가 만든 C++ DDS(RTPS) 구현. ROS 2 의 기본 RMW(rmw_fastrtps)로 쓰이며 공유 메모리·디스커버리 서버 등을 제공한다.
pricing: oss
tags: [dds, rtps, rmw, eprosima, middleware, shared-memory]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Fast DDS 는 OMG DDS 표준과 RTPS 와이어 프로토콜을 구현한 C++ 라이브러리로 eProsima 가 개발한다. ROS 2 는 이를 `rmw_fastrtps_cpp` 로 감싸 쓰며, Lyrical 문서 기준 **기본 RMW 벤더**다. 라이선스는 Apache-2.0.

ROS 2 사용자는 보통 Fast DDS API 를 직접 쓰지 않고 XML 프로파일·환경 변수로 동작만 조정한다. 최신 릴리스는 v3.6.2(2026-07), ROS 2 Lyrical 바이너리도 3.6.2 계열이다.

## 설치
ROS 2 데스크톱 설치에 이미 포함된다. 명시적으로 선택하려면:
```bash
sudo apt install ros-lyrical-rmw-fastrtps-cpp   # 보통 desktop 에 포함
export RMW_IMPLEMENTATION=rmw_fastrtps_cpp
```
ROS 와 무관하게 쓰려면 소스 빌드(CMake) 또는 공식 문서의 패키지 안내를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Domain / DomainParticipant | 같은 도메인 ID 의 참여자끼리 통신. ROS 의 `ROS_DOMAIN_ID` 에 대응 |
| Publisher / Subscriber, DataWriter / DataReader | 토픽 단위 송수신 엔드포인트 |
| QoS | reliability, durability, history, deadline 등. ROS 2 QoS 프로파일이 여기에 매핑 |
| 디스커버리 | 기본은 멀티캐스트 simple discovery. Discovery Server 로 유니캐스트 중앙 방식 전환 가능 |
| 전송(transport) | UDPv4/v6, TCP, 공유 메모리(SHM). 같은 호스트 노드끼리는 SHM 으로 복사 비용 절감 |
| XML 프로파일 | `FASTRTPS_DEFAULT_PROFILES_FILE` 로 전송·QoS·디스커버리 설정 로드 |

## 기본 사용법
ROS 2 에서 사용하는 형태(대부분의 경우 설정은 환경 변수 두세 개):
```bash
export RMW_IMPLEMENTATION=rmw_fastrtps_cpp
export ROS_DOMAIN_ID=7
ros2 run demo_nodes_cpp talker
```
Discovery Server 로 멀티캐스트 없는 네트워크에서 쓰기:
```bash
fastdds discovery --server-id 0 --port 11811        # 서버 프로세스
export ROS_DISCOVERY_SERVER=127.0.0.1:11811         # 각 노드 터미널
ros2 run demo_nodes_cpp listener
```
XML 로 SHM 을 끄고 UDP 만 쓰는 프로파일(요지):
```xml
<profiles xmlns="http://www.eprosima.com">
  <transport_descriptors>
    <transport_descriptor><transport_id>udp</transport_id><type>UDPv4</type></transport_descriptor>
  </transport_descriptors>
  <participant profile_name="udp_only" is_default_profile="true">
    <rtps><userTransports><transport_id>udp</transport_id></userTransports>
          <useBuiltinTransports>false</useBuiltinTransports></rtps>
  </participant>
</profiles>
```

## 자주 쓰는 패턴
- **Wi-Fi·클라우드 환경**: 멀티캐스트가 막히면 Discovery Server 또는 Zenoh([rmw_zenoh](/develop-wiki/robotics/ros/zenoh/))를 검토한다.
- **대용량 센서 데이터**: 같은 머신에서 SHM 전송과 loaned message 로 복사를 줄인다.
- **노드 간 QoS 불일치 디버깅**: `ros2 topic info -v` 로 양쪽 QoS 를 확인.
- **다른 RMW 와 혼용 금지**: 벤더 간 상호 운용은 보장되지 않는다. 한 시스템은 하나로 통일.

## 언제 쓰나 / 피할 때
- 쓸 때: ROS 2 기본값으로 충분한 일반 로봇, SHM 으로 같은 호스트 지연을 줄이고 싶을 때.
- 피할 때: 멀티캐스트 없는 광역망·원격 로봇은 [Zenoh](/develop-wiki/robotics/ros/zenoh/), DDS 계열 중 다른 구현을 비교하려면 [Cyclone DDS](/develop-wiki/robotics/ros/cyclonedds/). 코어: [ROS 2](/develop-wiki/robotics/ros/ros2/). 구현 언어는 [C++](/develop-wiki/languages/cpp/).

## 공식 문서
- [Fast DDS 문서](https://fast-dds.docs.eprosima.com/en/latest/) · [ROS 2 에서 Fast DDS 사용](https://docs.ros.org/en/lyrical/Get-Started/Installation/RMW-Implementations/DDS-Implementations/Working-with-eProsima-Fast-DDS.html) · [GitHub](https://github.com/eProsima/Fast-DDS)
