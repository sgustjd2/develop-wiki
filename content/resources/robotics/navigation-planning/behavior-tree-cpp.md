---
name: BehaviorTree.CPP
url: https://www.behaviortree.dev
docs: https://www.behaviortree.dev/docs/intro
repo: https://github.com/BehaviorTree/BehaviorTree.CPP
stars: 4302
domain: robotics
category: navigation-planning
description: 로봇 행동 로직을 XML 행동 트리로 기술하고 C++ 노드를 틱으로 실행하는 라이브러리. Nav2 의 행동 트리 엔진으로 쓰인다.
pricing: oss
tags: [behavior-tree, bt, task-planning, nav2, cpp, xml]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
BehaviorTree.CPP 는 "무엇을 어떤 순서·조건으로 할지"를 트리로 표현하는 C++ 라이브러리다. 트리는 XML 로 쓰고, Action·Condition 리프 노드는 C++ 클래스로 구현해 팩토리에 등록한다. 상태 기계보다 재사용·조합이 쉽고, ROS 와 독립적이지만 [Nav2](/develop-wiki/robotics/navigation-planning/nav2/) 가 이를 내비게이션 흐름 제어에 사용한다. MIT 라이선스. 최신 릴리스 4.11.0(2026-11-08), ROS 2 Lyrical 패키지 `behaviortree_cpp` 는 4.11.1.

## 설치
```bash
sudo apt install ros-lyrical-behaviortree-cpp        # ROS 2
# ROS 없이: CMake 로 소스 빌드 (공식 문서 Installation), Conan 패키지도 제공
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Tick | 루트에서 시작해 트리를 한 번 순회. 노드는 SUCCESS / FAILURE / RUNNING 반환 |
| Control 노드 | `Sequence`(모두 성공해야), `Fallback`(하나 성공하면), `Parallel`, `ReactiveSequence` |
| Decorator | 자식 하나를 감쌈: `Inverter`, `RetryUntilSuccessful`, `Timeout` |
| Action / Condition | 사용자가 구현하는 리프. `SyncActionNode`, `StatefulActionNode`(비동기) |
| Port | 노드 입출력. XML 에서 `{blackboard_key}` 로 연결 |
| Blackboard | 노드 간 공유 키-값 저장소 |
| Subtree | 트리 재사용 단위 |

## 기본 사용법
```cpp
#include "behaviortree_cpp/bt_factory.h"
using namespace BT;

class SayHello : public SyncActionNode {
 public:
  SayHello(const std::string& name, const NodeConfig& cfg) : SyncActionNode(name, cfg) {}
  static PortsList providedPorts() { return {InputPort<std::string>("who")}; }
  NodeStatus tick() override {
    auto who = getInput<std::string>("who");
    if (!who) return NodeStatus::FAILURE;
    std::cout << "hello " << who.value() << "\n";
    return NodeStatus::SUCCESS;
  }
};

static const char* xml = R"(
<root BTCPP_format="4">
  <BehaviorTree ID="Main">
    <Sequence>
      <SayHello who="robot"/>
      <SayHello who="world"/>
    </Sequence>
  </BehaviorTree>
</root>)";

int main() {
  BehaviorTreeFactory factory;
  factory.registerNodeType<SayHello>("SayHello");
  auto tree = factory.createTreeFromText(xml);
  tree.tickWhileRunning();
}
```

## 자주 쓰는 패턴
- **재시도 + 복구**: `RetryUntilSuccessful` 로 이동 실패 시 재시도, `Fallback` 으로 대안 행동.
- **비동기 행동**: 장시간 작업은 `StatefulActionNode`(onStart/onRunning/onHalted)로 구현해 RUNNING 반환.
- **ROS 2 액션 래핑**: 액션 클라이언트를 BT 노드로 감싸는 `BT::RosActionNode` 계열(`behaviortree_ros2` 패키지)을 쓴다.
- **로그·시각화**: Groot2 로 트리 편집·실시간 모니터링(별도 도구, 라이선스는 해당 사이트 확인).
- 트리 로직은 얇게, 실제 동작은 노드 내부에 두어 단위 테스트를 쉽게 한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 복합 임무(순찰·픽앤플레이스)의 우선순위·복구 로직, 상태 기계가 커져 관리가 어려울 때. 언어 [C++](/develop-wiki/languages/cpp/).
- 피할 때: 선형 절차 몇 단계면 일반 코드가 낫다. 반응 속도가 극단적으로 중요한 저수준 제어 루프에는 부적합. 라이브러리 간 비교는 문서의 "BT vs FSM" 설명을 참고.

## 공식 문서
- [소개](https://www.behaviortree.dev/docs/intro) · [GitHub](https://github.com/BehaviorTree/BehaviorTree.CPP)
