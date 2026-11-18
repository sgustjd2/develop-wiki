---
title: 실시간성·DDS·지연 관리
aka: [Real-Time Robotics, DDS, RTPS, Latency, Jitter, PREEMPT_RT, rmw, Deadline Miss]
category: robotics
group: software
level: advanced
summary: 로봇 제어에서 지연의 평균보다 최악과 지터가 중요한 이유, ROS 2 가 DDS 위에 놓인 구조, 페이지 폴트·동적 할당·우선순위 같은 지연 원인과 측정 방법을 정리한다.
tags: [robotics, ros2, dds, real-time, latency, jitter, preempt-rt]
related: [robotics/ros2-communication-qos, robotics/pid-control, robotics/model-predictive-control, cs-fundamentals/cpu-scheduling, cs-fundamentals/virtual-memory, cs-fundamentals/process-thread]
sources:
  - https://docs.ros.org/en/jazzy/Tutorials/Demos/Real-Time-Programming.html
  - https://design.ros2.org/articles/ros_on_dds.html
  - https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html
  - https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Executors.html
updatedAt: 2026-11-19
---

## 문제

1 kHz 로 도는 제어 루프에서 어느 한 번이 5 ms 늦으면 그 사이 모터는 오래된 명령으로 움직인다. 평균 지연이 낮아도 가끔 튀는 **최악 지연과 지터**가 사고를 만든다. 일반 OS 는 처리량 최적화가 목적이라 이를 보장하지 않는다.

## 왜 중요한가 (로봇 개발 관점)

- 제어기(PID, LQR, MPC)는 샘플링 주기가 일정하다고 가정하고 이득을 설계한다. 주기가 흔들리면 안정 여유가 줄어든다([PID](/develop-wiki/knowledge/robotics/pid-control/)).
- 안전 기능(비상정지, 충돌 회피)은 "평균 응답"이 아니라 "항상 N ms 이내"가 요구 사항이다.

## 소프트 vs 하드 실시간

| | 하드 실시간 | 소프트 실시간 |
| --- | --- | --- |
| 데드라인 초과 | 실패(사고) | 품질 저하 |
| 예 | 모터 전류·토크 루프, 에어백 | 인식, 경로 계획, UI |
| 환경 | 실시간 OS/MCU, PREEMPT_RT, 전용 코어 | 일반 Linux |

ROS 2 문서의 실시간 개요는 요약하면 이렇다. 실시간 루프는 주기적으로 갱신되어야 하고 허용 지터가 작아야 하며, 이를 위해 페이지 폴트, 동적 메모리 할당/해제, 무기한 블록하는 동기화 같은 **비결정적 연산을 실행 경로에서 없애야 한다.**

## 지연의 원인

| 원인 | 설명 | 대응 |
| --- | --- | --- |
| 동적 할당 | `malloc` 이 락·시스템 호출을 유발해 시간 변동 | 초기화 때 미리 할당, 풀 사용 |
| 페이지 폴트 | 처음 접근하는 메모리를 디스크/커널이 매핑 | `mlockall` 로 메모리를 RAM 에 고정, 선행 터치 |
| 스케줄링 | 다른 프로세스에 CPU 를 빼앗김 | `SCHED_FIFO` 우선순위, CPU 고정(affinity), PREEMPT_RT |
| 락 경합 | 우선순위 역전 | 우선순위 상속, 락 프리 큐 |
| 메시지 직렬화·복사 | 큰 메시지를 프로세스 간 복사 | 같은 프로세스 컴포지션(intra-process), 제로카피 |
| 네트워크 | 재전송, 큐, 무선 | best effort, 유선, QoS deadline |
| GC·런타임 | Python/Java 의 가비지 컬렉션 정지 | 제어 경로는 C++/Rust, 또는 GC 정지 최소화 |

문서의 시연(pendulum_demo)은 `mlockall` 로 메모리를 잠그면 페이지 폴트가 줄고, 권한이 부족하면(memlock 한도) 잠그기 실패 메시지가 나오는 것을 보여 준다. 또 이 시연은 리눅스 전용이고 소스 빌드가 필요하며 특정 DDS 구현이 필요하다고 안내한다.

관련 OS 개념은 [CPU 스케줄링](/develop-wiki/knowledge/cs-fundamentals/cpu-scheduling/), [가상 메모리](/develop-wiki/knowledge/cs-fundamentals/virtual-memory/), [프로세스·스레드](/develop-wiki/knowledge/cs-fundamentals/process-thread/) 참고.

## DDS 와 ROS 2

ROS 2 는 통신 계층으로 DDS(Data Distribution Service, OMG 표준)와 그 전송 프로토콜 RTPS 를 채택했다. ROS 설계 문서는 DDS 를 쓰는 이유로 이미 문서화·표준화된 종단 간 미들웨어를 쓰면 유지보수 코드가 줄고, 분산 탐색 덕분에 ROS 1 의 마스터 같은 중앙 노드가 필요 없다는 점을 든다. QoS 정책(신뢰성, 내구성, 데드라인 등)이 DDS 개념이고 ROS 2 가 이를 노출한다([QoS](/develop-wiki/knowledge/robotics/ros2-communication-qos/)). 실제 DDS 구현은 RMW(미들웨어 추상 계층)로 교체할 수 있고(Fast DDS, Cyclone DDS, Connext 등), 구현마다 성능과 기본값이 다르다.

- **Deadline QoS**: 기대 갱신 주기를 선언하고 어기면 이벤트로 알 수 있다. 센서가 멈춘 것을 감지하는 용도로 쓴다.
- **Lifespan**: 오래된 명령이 뒤늦게 전달돼 실행되는 것을 막는다.
- **Liveliness**: 노드 생존 감시.

## 측정하기

지연은 추측하지 말고 **주기 초과량(상대 지연)** 의 분포(평균·p99·최대)를 잰다. 맥 노트북에서 1 ms 주기 루프를 2000번 돌려 본 예시:

```python
import time
def run(period_ms=1.0, n=2000, busy=False):
    p = period_ms * 1e6; t0 = time.perf_counter_ns(); late = []
    for k in range(1, n + 1):
        target = t0 + k * p
        if busy:
            while time.perf_counter_ns() < target: pass
        else:
            d = (target - time.perf_counter_ns()) / 1e9
            if d > 0: time.sleep(d)
        late.append((time.perf_counter_ns() - target) / 1e3)   # 마이크로초
    late.sort(); return sum(late)/n, late[int(.99*n)], late[-1]
```

`time.sleep` 은 평균 331 μs, p99 483 μs, 최대 518 μs 늦었고 busy-wait 은 평균 0 μs 에 최대 3 μs 였다. 이 숫자는 이 기기·이 순간의 일반 OS 값일 뿐이며 일반화하지 않는다. 요점은 sleep 기반 주기에서는 매 주기 수백 μs 의 지터가 구조적으로 있다는 것과 그것을 분포로 봐야 한다는 것이다. 실제 로봇에서는 `cyclictest` 같은 도구와 `ros2_tracing` 으로 시스템 수준을 본다. busy-wait 은 CPU 를 한 코어 통째로 쓰므로 실제 제품에서는 실시간 스케줄링으로 해결한다.

## 언제 쓰나

- 하위 제어(모터 루프, 안전 감시): 실시간 OS 또는 MCU 에서 하드 실시간 보장.
- 상위(인식, 계획): 일반 Linux + ROS 2 의 소프트 실시간으로 충분. 지연이 커져도 하위 루프가 안전을 지키도록 계층을 나눈다.
- 계층 경계: 상위가 늦거나 죽어도 하위가 안전 상태로 가는 워치독을 둔다.

## 주의/비용

- 실시간 최적화는 **개발·운영 비용**이 크다(특수 커널, 권한, 코드 제약). 요구가 없는 계층에 적용하지 않는다.
- 평균 지연 최적화(캐시, 배치)가 최악 지연을 해치는 경우가 많다.
- 큰 큐와 reliable QoS 는 부하 상황에서 지연을 키운다(오래된 데이터를 처리). 제어 명령에는 작은 큐, 최신값 우선을 쓴다.
- ROS 2 Executor 에서 콜백 하나가 길면 다른 콜백이 밀린다. 제어 콜백은 별도 그룹/스레드로 분리한다.
- Python 은 제어 경로에 부적합하다. GC 정지와 인터프리터 비용이 비결정적이다.
- 이 노트는 Jazzy 문서 기준이다. 최신 배포판의 실시간 가이드와 지원 DDS 구현은 달라졌을 수 있으니 쓰는 배포판 문서로 재확인한다.
