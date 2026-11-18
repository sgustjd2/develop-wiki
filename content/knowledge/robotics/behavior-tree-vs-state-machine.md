---
title: 행동 트리 vs 상태 머신
aka: [Behavior Tree, BT, Finite State Machine, FSM, HFSM, BehaviorTree.CPP]
category: robotics
group: software
level: intermediate
summary: 상태 머신은 상태 사이를 한 방향으로 건너뛰는 전이로 작업을 바꾸고, 행동 트리는 매 틱 루트에서 아래로 내려가며 노드가 SUCCESS/FAILURE/RUNNING 을 돌려주는 두 방향 호출로 작업을 고른다.
tags: [robotics, behavior-tree, fsm, state-machine, task-switching, nav2, behaviortree-cpp]
related: [robotics/nav2-architecture, robotics/nav2-costmap-inflation, robotics/robot-safety-iso-10218, robotics/ros2-communication-qos]
sources:
  - https://arxiv.org/abs/1709.00084
  - https://www.behaviortree.dev/docs/learn-the-basics/BT_basics
  - https://www.behaviortree.dev/docs/tutorial-basics/tutorial_01_first_tree
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/getting_started/navigation_concepts/behavior_trees.md
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/configuration_and_development/configuration_guide/core_servers/bt_plugins/controls/RecoveryNode.md
updatedAt: 2026-11-19
---

> 출처 메모: Colledanchise·Ögren 의 책(arXiv 1709.00084)은 PDF 본문에서 1.2절(FSM 의 문제)과 2.1~2.2절(FSM·HFSM 장단점)을 직접 읽었다. 책의 나머지 장(계획·학습·확률적 BT)과 BT 의 형식적 안정성·효율 증명은 읽지 않았다.

## 문제

로봇은 "접근 → 잡기 → 이동 → 놓기" 처럼 작업을 전환해야 하고, 도중에 환경이 바뀌면 즉시 반응해야 한다. 상태 머신(FSM)은 이 일에 가장 흔한 도구다. 그런데 반응성을 높이려면 상태마다 "고장 나면 여기로", "사람이 나타나면 저기로" 같은 전이가 늘어난다. 책은 이를 goto 문과 같은 **한 방향 제어 이동**으로 보고, 반응성과 모듈성이 맞바뀐다고 설명한다. 상태 하나를 지우거나 추가하면 그 상태로 향하는 모든 전이를 고쳐야 한다.

책이 꼽는 FSM 의 단점은 세 가지다. 유지보수(상태 추가·삭제 시 전이 재검토), 확장성(상태·전이가 많으면 수정이 어려움), 재사용(전이가 내부 변수에 의존해 부분 FSM 을 다른 프로젝트에 쓰기 어려움). 장점도 분명하다. 널리 쓰이는 구조이고, 직관적이며, 구현이 쉽다.

## 해법: 틱으로 도는 트리

BehaviorTree.CPP 문서의 설명을 정리하면 다음과 같다.

- 루트에 **틱**(tick) 신호를 보내면 트리를 따라 내려가며 각 노드의 콜백이 실행된다.
- 콜백은 `SUCCESS`, `FAILURE`, `RUNNING` 중 하나를 돌려준다. `RUNNING` 은 "시간이 더 필요하다, 다시 틱해 달라" 는 뜻이다.
- 자식을 가진 노드가 틱을 전달할 책임을 진다. 자식 수와 역할로 노드 유형이 나뉜다.

| 노드 | 자식 | 동작 |
| --- | --- | --- |
| Sequence(제어) | 1..N | 왼쪽부터 틱. 하나가 FAILURE 면 나머지를 건너뛰고 FAILURE. 모두 SUCCESS 면 SUCCESS |
| Fallback(제어, selector) | 1..N | 왼쪽부터 틱. 하나가 SUCCESS 면 거기서 SUCCESS. 모두 FAILURE 면 FAILURE |
| Decorator | 1 | 결과를 바꾸거나(Inverter), 반복하거나(Retry), 자식을 중단 |
| Condition(잎) | 0 | 시스템을 바꾸지 않고, RUNNING 을 돌려주지 않는다 |
| Action(잎) | 0 | 실제로 무언가를 한다. 동기 또는 비동기 |

호출이 "내려갔다가 결과로 돌아오는" 두 방향이어서, 서브트리는 함수처럼 통째로 떼어 재사용할 수 있다. 책의 표현으로는 이것이 FSM 의 전이가 만드는 모듈성 문제를 피하는 이유다.

```ts
type S = 'SUCCESS' | 'FAILURE' | 'RUNNING';
type Node = () => S;
const seq = (...c: Node[]): Node => () => { for (const n of c) { const s = n(); if (s !== 'SUCCESS') return s; } return 'SUCCESS'; };
const fb  = (...c: Node[]): Node => () => { for (const n of c) { const s = n(); if (s !== 'FAILURE') return s; } return 'FAILURE'; };

// RecoveryNode 의 규칙: 첫 자식 FAILURE -> 둘째(복구) 실행 -> 복구 SUCCESS 면 첫 자식 재시도, 횟수 제한
const recovery = (main: Node, rec: Node, retries: number): Node => () => {
  for (let n = 0; ; n++) {
    const s = main(); if (s !== 'FAILURE') return s;
    if (n >= retries || rec() === 'FAILURE') return 'FAILURE';
  }
};
```

(직접 실행한 결과: 문서의 "냉장고" 예제처럼 `seq(열기, 집기(실패), 닫기)` 는 `열기>집기` 에서 멈추고 문이 열린 채 FAILURE 가 된다. 계획이 두 번 실패하고 세 번째에 성공하는 상황에서 `recovery(계획, 코스트맵비우기, 6)` 는 `계획>비우기>계획>비우기>계획` 후 SUCCESS, 재시도 한도를 1 로 두면 `계획>비우기>계획` 후 FAILURE 였다. 위 코드는 설명용 최소 구현으로 RUNNING 상태를 이어받는 메모리 로직은 없다.)

문서가 일부러 보여 주는 함정도 있다. Sequence 에서 중간 단계가 실패하면 뒤의 "정리" 단계(문 닫기)가 건너뛰어진다. 정리를 보장하려면 구조를 바꿔야 한다. 트리가 단순해 보여도 FAILURE 가 흐르는 경로를 직접 따라가 봐야 한다.

### Nav2 에서

Nav2 는 BT Navigator 가 BehaviorTree.CPP v4 로 XML 트리를 읽어 계획·제어·복구 서버의 액션을 부른다. 공식 개념 문서는 FSM 이 수십 상태·수백 전이로 불어나는 것에 비해 BT 가 확장성과 이해 용이성이 낫다고 설명하며, 같은 구조 위에 계층형 FSM(HFSM) 내비게이터를 만들 수도 있다고 밝힌다. 제어 노드 중 `RecoveryNode` 는 복구 동작을 표현하고, `PipelineSequence` 는 앞 자식을 계속 틱하면서 뒤 자식을 차례로 이어 틱하는 순서 노드다(공식 문서 설명). 전체 구조는 [Nav2 구조](/develop-wiki/knowledge/robotics/nav2-architecture/)를 본다.

## 비교

| 관점 | FSM / HFSM | 행동 트리 |
| --- | --- | --- |
| 제어 이동 | 전이 = 한 방향(goto 와 유사) | 부모-자식 호출 = 두 방향 |
| 반응성 | 전이를 더 그려야 함 | 매 틱 루트부터 재평가 |
| 모듈성 | 상태 삭제 시 전이 재검토 | 서브트리를 단위로 재사용 |
| 상태 보존 | 현재 상태가 곧 기억 | 노드의 RUNNING 상태와 별도 데이터 저장소가 필요(구현별로 확인) |
| 직관 | 작은 시스템에서 가장 쉬움 | 노드 규칙을 익혀야 함 |
| 검증 | 상태·전이 기반 모델 검사 | Nav2 문서는 트리 중심 구조가 형식 분석에 유리하다고 주장(본 노트는 검증하지 않음) |

책은 FSM 으로 BT 처럼 동작하는 구조를 만들 수도, BT 로 FSM 처럼 동작하는 구조를 만들 수도 있다고 다룬다(2.2.2, 2.2.3절). 즉 표현력 문제가 아니라 **규모가 커질 때의 구조적 비용** 문제다.

## 언제 쓰나

- 상태가 소수(예: 충전 중/대기/주행)이고 전이가 명확한 장치 제어는 FSM 이 가장 단순하다.
- 서로 다른 반응 규칙이 많고(복구, 우선순위 행동, 조건부 재시도) 정책을 자주 바꾸는 작업 수준 로직은 BT 가 낫다. 현장에서 XML 만 바꿔 정책을 조정하는 운용에 맞다.
- 둘을 섞는 것도 흔하다. 저수준 장치 모드는 FSM, 상위 작업 선택은 BT.

## 주의/비용

- BT 는 만능이 아니다. 틱은 루트에서 시작해 내려가므로 조건 노드가 비싸면 틱마다 비용이 든다(일반적 추론).
- 조건 노드는 시스템을 바꾸지 않고 RUNNING 을 돌려주지 않아야 한다(문서 규칙). 이를 어기면 디버깅이 어렵다.
- 비동기 액션 취소, RUNNING 중 상위 조건이 뒤집힐 때의 halt 처리 등 실행 의미를 구현마다 정확히 알아야 한다. 이 노트는 BehaviorTree.CPP 문서의 기본 규칙만 다룬다.
- BT 는 작업 전환 도구이지 안전 계층이 아니다. 위험 정지는 트리 바깥에서 독립적으로 동작해야 한다([로봇 안전](/develop-wiki/knowledge/robotics/robot-safety-iso-10218/), [비상 정지 설계](/develop-wiki/knowledge/robotics/emergency-stop-safety-control-design/)).
- 서버 간 통신 지연은 틱 주기를 흔든다([QoS](/develop-wiki/knowledge/robotics/ros2-communication-qos/)).
