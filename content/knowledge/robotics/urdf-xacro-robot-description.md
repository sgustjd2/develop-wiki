---
title: URDF 와 Xacro — 로봇 기술(description)
aka: [URDF, Unified Robot Description Format, Xacro, robot_description, robot_state_publisher]
category: robotics
group: kinematics
level: beginner
summary: URDF 는 로봇을 링크(강체)와 조인트의 트리로 적는 XML 이다. Xacro 는 속성·매크로·수식으로 URDF 반복을 줄이는 전처리기이고, 프레임·시각화·시뮬레이션·충돌 검사가 모두 이 파일에서 출발한다.
tags: [robotics, urdf, xacro, ros2, robot-description, kinematics, tf2]
related: [robotics/coordinate-frames-tf, robotics/forward-inverse-kinematics-jacobian, robotics/rotation-representations, robotics/computed-torque-control, robotics/sim-to-real-transfer, robotics/nav2-architecture]
sources:
  - https://github.com/ros/xacro/wiki
  - https://docs.ros.org/en/lyrical/Tutorials/Intermediate/URDF/Adding-Physical-and-Collision-Properties-to-a-URDF-Model.html
  - https://github.com/ros/urdfdom
  - https://wiki.ros.org/urdf/XML/joint
updatedAt: 2026-11-19
---

## 문제

로봇 소프트웨어의 거의 모든 층이 "이 로봇이 어떻게 생겼나" 를 필요로 한다. TF 프레임 트리, RViz 의 3D 모델, 충돌 검사, 시뮬레이터, 정·역기구학, 동역학이 각자 다른 파일에 형상을 적으면 불일치가 생긴다. 하나의 기술 파일이 **단일 원천**이어야 한다. ROS 에서 그 형식이 URDF 다.

## 해법: URDF

로봇을 **트리**로 적는다. 노드는 링크, 간선은 조인트다.

| 요소 | 내용 |
| --- | --- |
| `<link>` | 강체. `visual`(보이는 모양), `collision`(충돌용 모양), `inertial`(질량·관성) |
| `<joint>` | 부모-자식 링크 연결. `origin`(자식 프레임 위치·자세), `axis`, `limit`, 타입 |

조인트 타입은 `revolute`(범위 제한 회전), `continuous`(무제한 회전), `prismatic`(직선), `fixed`, `floating`(6자유도), `planar` 이다. ROS 위키 명세는 `limit` 을 revolute·prismatic 에 요구하고, 파서(urdfdom 등)마다 `effort`/`velocity` 필수 여부 해석이 달랐으므로 네 속성을 모두 적는 편이 안전하다.

- 단위는 SI(미터·킬로그램·라디안)가 관례다.
- 트리라서 **닫힌 루프**(병렬 링크, 4절 링크)는 표현하지 못한다. 필요하면 SDF 같은 다른 형식이나 시뮬레이터의 제약 기능을 쓴다.
- 링크 간 상대 변환이 곧 TF 프레임이다. `robot_state_publisher` 가 `robot_description` 의 URDF 와 `/joint_states` 로 정기구학을 계산해 `tf` 로 방송한다([TF](/develop-wiki/knowledge/robotics/coordinate-frames-tf/)). 모델이 보이는데 안 움직이면 `joint_states` 발행과 조인트 이름 일치를 먼저 본다.

## Xacro

URDF 는 반복이 많다(바퀴 네 개, 같은 링크 둘). Xacro 는 XML 위의 전처리기로 다음을 제공한다(공식 위키).

- `xacro:property` 와 `${...}` 수식(파이썬 표현식, `pi`·`radians()` 등)
- `xacro:macro` (파라미터·기본값), `xacro:include`
- `xacro:if` / `xacro:unless` 조건, `xacro:arg`(실행 인자)

두 링크가 같은 원통 모양인 2링크 팔을 xacro 로 쓰고 `xacro` 명령으로 URDF 로 전개해 확인했다(질량 1 kg, 반경 3 cm, 길이 0.5 m 원통의 관성은 `m(3r²+L²)/12`, 축 방향 `mr²/2` 를 수식으로 계산).

```xml
<robot name="two_link" xmlns:xacro="http://www.ros.org/wiki/xacro">
  <xacro:property name="L" value="0.5"/>
  <xacro:macro name="link_cyl" params="name length">
    <link name="${name}">
      <collision><origin xyz="0 0 ${length/2}"/>
        <geometry><cylinder radius="0.03" length="${length}"/></geometry></collision>
      <inertial><origin xyz="0 0 ${length/2}"/><mass value="1.0"/>
        <inertia ixx="${(3*0.03**2+length**2)/12}" iyy="${(3*0.03**2+length**2)/12}"
                 izz="${0.03**2/2}" ixy="0" ixz="0" iyz="0"/></inertial>
    </link>
  </xacro:macro>
  <link name="base_link"/>
  <xacro:link_cyl name="link1" length="${L}"/>
  <xacro:link_cyl name="link2" length="${L}"/>
  <joint name="joint2" type="revolute">
    <parent link="link1"/><child link="link2"/>
    <origin xyz="0 0 ${L}"/><axis xyz="0 1 0"/>
    <limit lower="0" upper="2.5" effort="10" velocity="3.0"/>
  </joint>
</robot>
```

`xacro robot.urdf.xacro > robot.urdf` 로 전개되며, 실제 전개 결과에서 관성은 `ixx = iyy ≈ 0.0211`, `izz = 0.00045` 로 계산됐다. 런치 파일에서는 xacro 를 실행해 그 출력을 `robot_description` 파라미터로 넘기는 것이 보통이다.

## 언제 쓰나

- ROS 로봇의 형상·기구학·시각화·시뮬레이션 모델을 하나로 관리할 때.
- 변형(바퀴 수, 센서 장착 위치)이 있는 로봇 패밀리를 인자로 만들어 낼 때.

## 주의/비용

- `visual` 은 예쁘게, `collision` 은 단순하게. 충돌 모양이 복잡하면 충돌 검사·시뮬레이션이 느려지고, 시각 메시를 그대로 충돌에 쓰면 접촉이 불안정하다.
- `inertial` 은 시뮬레이션과 동역학 제어([계산 토크](/develop-wiki/knowledge/robotics/computed-torque-control/))의 정확도를 좌우한다. 질량 0 이나 관성 오타는 시뮬레이터가 폭주하거나 무시하는 원인이다. CAD 에서 추출하거나 간단한 도형 공식으로 근사한다.
- 관성 행렬은 양의 정부호·삼각 부등식 같은 물리적 제약을 만족해야 한다. 검증기가 없는 도구도 있어 직접 확인한다.
- `origin` 의 회전은 roll-pitch-yaw 라디안이다. 오일러 규약 혼동은 흔한 버그다([회전 표현](/develop-wiki/knowledge/robotics/rotation-representations/)).
- URDF 는 센서·플러그인·마찰 계수 같은 시뮬레이션 정보를 표준 필드에 담지 못해 도구별 확장(`<gazebo>` 태그 등)이 갈라진다. 시뮬레이션과 실기 차이는 [sim-to-real](/develop-wiki/knowledge/robotics/sim-to-real-transfer/) 노트에서 다룬다.
- 파일이 길어지면 xacro 로 나누되, 수식이 복잡해지면 읽기 어려워진다. 파라미터는 YAML 로 분리하는 것도 방법이다.
