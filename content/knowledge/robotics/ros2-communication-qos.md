---
title: ROS 2 통신 모델과 QoS
aka: [ROS 2 Topics, Services, Actions, Parameters, QoS, Quality of Service, Executors, Callback Groups]
category: robotics
group: software
level: intermediate
summary: ROS 2 노드가 토픽·서비스·액션으로 통신하는 방식과, 신뢰성·내구성·히스토리 같은 QoS 정책이 퍼블리셔-구독자 연결을 어떻게 맺고 끊는지 정리한다.
tags: [robotics, ros2, qos, topics, services, actions, dds]
related: [robotics/realtime-dds-latency, robotics/sensor-fusion-time-sync, robotics/coordinate-frames-tf, cs-fundamentals/tcp-vs-udp]
sources:
  - https://docs.ros.org/en/jazzy/Concepts/Basic/About-Topics.html
  - https://docs.ros.org/en/jazzy/Concepts/Basic/About-Services.html
  - https://docs.ros.org/en/jazzy/Concepts/Basic/About-Actions.html
  - https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html
  - https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Executors.html
updatedAt: 2026-11-19
---

## 문제

로봇 소프트웨어는 센서 드라이버, 인식, 계획, 제어가 서로 다른 프로세스·기기에서 돈다. 이들을 직접 소켓으로 엮으면 결합이 강해지고 교체가 어렵다. 또 통신 요구가 제각각이다. 라이다는 최신 값만 중요하고, 지도는 늦게 켜진 노드도 받아야 하고, "목적지로 이동" 같은 긴 작업은 진행 상황과 취소가 필요하다.

## 왜 중요한가 (로봇 개발 관점)

- "토픽에 데이터가 안 온다"의 가장 흔한 원인이 QoS 불일치다(에러 없이 그냥 연결이 안 맺어진다).
- 어떤 통신 방식을 고르느냐가 안전성(취소 가능?), 지연, 디버깅 난이도를 정한다.

## 네 가지 인터페이스 (ROS 2 문서)

| | 토픽 | 서비스 | 액션 | 파라미터 |
| --- | --- | --- | --- | --- |
| 모델 | 발행/구독 | 요청/응답(RPC) | 목표/피드백/결과 | 노드별 설정 값 |
| 방향 | 단방향, 다대다 | 클라이언트 → 서버 | 클라이언트 ↔ 서버 | 노드가 소유 |
| 지속 시간 | 연속 스트림 | **빨리 끝나야** | **오래 걸리는** 작업 | 설정 변경 |
| 취소/진행 | 없음 | 없음 | 취소·피드백 있음 | - |
| 서버 수 | 퍼블리셔 0개 이상 | 이름당 서버 하나 | 이름당 서버 하나 | - |
| 예 | 센서, 상태, 속도 명령 | "맵 저장", "모드 전환" | "A 지점까지 이동", 팔 궤적 실행 | PID 이득, 임계값 |

문서의 지침을 요약하면 다음과 같다.
- 토픽은 연속 데이터 스트림용이다. 발행자와 구독자는 서로를 몰라도 되고(익명), 메시지 타입은 엄격하다(IMU 각속도는 rad/s 로 의미까지 고정).
- 서비스는 클라이언트가 결과를 기다리므로 빨리 끝나는 계산에만 쓰고, 오래 걸리거나 도중에 취소가 필요한 일에는 쓰지 않는다.
- 액션은 설정·모니터링 오버헤드가 있으므로 정말 긴 작업에만 쓴다. 짧은 호출은 서비스로 한다.
- 서비스·액션은 서버가 둘 이상 같은 이름에 있으면 어느 서버가 받을지 정의돼 있지 않다.

## QoS

정책 여러 개가 모여 프로파일을 이룬다. 발행자와 구독자가 각자 프로파일을 지정한다.

| 정책 | 값 | 의미 |
| --- | --- | --- |
| History / Depth | keep last(N) / keep all | 보관할 샘플 수 |
| Reliability | reliable / best effort | 재전송 여부 |
| Durability | volatile / transient local | 늦게 참여한 구독자에게 과거 샘플을 줄지 |
| Deadline | 기간 | 연속 메시지 간 최대 간격 |
| Lifespan | 기간 | 이보다 오래된 메시지는 조용히 폐기 |
| Liveliness | automatic / manual + lease | 발행자가 살아 있다는 신호 |

기본값은 keep last 10, reliable, volatile 이다. 센서 데이터 프로파일은 best effort 와 작은 큐로, 최신 값이 중요하고 일부 손실은 감수하는 경우를 위한 것이다. 서비스 기본은 reliable + volatile 이고, volatile 이어야 재시작한 서버가 오래된 요청을 받지 않는다. 파라미터는 서비스 기반이라 비슷하되 큐가 크다.

### 호환성: Request vs Offered

구독자가 "최소 이만큼"을 요청하고 발행자가 "최대 이만큼"을 제공하며, **모든 정책에서 요청이 제공보다 엄격하지 않아야** 연결된다.

| 발행자 | 구독자 | reliability | durability |
| --- | --- | --- | --- |
| best effort / volatile | reliable | **연결 안 됨** | - |
| reliable | best effort | 연결됨 | - |
| volatile | transient local | - | **연결 안 됨** |
| transient local | volatile | - | 연결됨(새 메시지만) |
| transient local | transient local | - | 연결됨(과거+새 메시지) |

이 규칙을 코드로 옮겨 문서 표와 대조해 검증했다.

```python
REL = {"best_effort": 0, "reliable": 1}; DUR = {"volatile": 0, "transient_local": 1}
def compatible(pub, sub):
    return REL[pub["reliability"]] >= REL[sub["reliability"]] and DUR[pub["durability"]] >= DUR[sub["durability"]]
# 센서 드라이버(best_effort) -> 기본 QoS 구독자(reliable): False  (토픽이 비어 보이는 전형적 원인)
```

"늦게 켠 노드가 지도를 받게" 하려면(latched 효과) 발행자와 구독자 **둘 다** transient local 이어야 한다.

## 실행 모델 (Executor)

콜백은 Executor 가 스레드로 실행한다. 단일 스레드 Executor 는 콜백이 길면 다른 구독·타이머가 밀린다. 멀티스레드 Executor 와 콜백 그룹(mutually exclusive / reentrant)으로 병렬성을 조절한다. 같은 상호배타 그룹의 콜백은 동시에 안 돈다. 처리 시간이 메시지 도착 간격보다 길면 큐에 쌓이고, 문서에 따르면 Executor 는 FIFO 가 아니라 라운드 로빈 비슷한 방식으로 처리한다. 제어 루프 콜백을 별도 그룹/Executor 로 빼서 OS 우선순위를 주는 패턴이 문서에 소개돼 있다. 공유 상태 접근은 [경쟁 조건](/develop-wiki/knowledge/cs-fundamentals/race-condition-lock-deadlock/) 문제가 된다.

## 언제 쓰나

- 센서·상태·명령 스트림: 토픽(센서는 best effort + 작은 큐).
- 한 번의 빠른 조회/설정: 서비스.
- 이동·팔 동작처럼 오래 걸리고 취소해야 하는 작업: 액션.
- 설정값: 파라미터.

## 주의/비용

- 토픽 연결이 안 되면 `ros2 topic info -v` 로 양쪽 QoS 를 비교한다. 에러 로그 없이 조용히 안 연결될 수 있다(일부 구현은 QoS 불일치 이벤트를 제공).
- reliable 은 손실 시 재전송으로 지연이 늘 수 있다. 무선망의 영상 스트림에는 best effort 가 낫다.
- `keep all` 은 메모리 상한을 따로 신경 써야 한다.
- 서비스를 오래 걸리는 작업에 쓰면 클라이언트가 블록되고 취소할 수 없다.
- 기본 QoS 와 세부 값은 배포판·RMW 구현에 따라 다를 수 있으니 쓰는 배포판 문서를 확인한다. 이 노트는 Jazzy 문서를 열어 확인한 내용이며, 해당 페이지에 최신 배포판은 Lyrical 이라는 안내가 있었다.
- TCP 와 달리 UDP 기반 전송이라 reliable 도 중간 장비 정책에 영향을 받는다([TCP vs UDP](/develop-wiki/knowledge/cs-fundamentals/tcp-vs-udp/)).
