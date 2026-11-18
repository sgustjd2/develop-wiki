---
title: 산업 로봇 안전 — ISO 10218 과 협동 운전
aka: [ISO 10218, Robot Safety, Collaborative Robot Safety, ISO/TS 15066, PFL, SSM, Functional Safety]
category: robotics
group: software
level: intermediate
summary: 산업 로봇(ISO 10218-1)과 로봇 응용·셀(ISO 10218-2)의 안전 요구를 정한 표준. 2025년 개정으로 협동 운전 기술규격이 흡수됐다. 안전 기능은 소프트웨어 기능이 아니라 인증된 안전 계통의 책임이다.
tags: [robotics, safety, iso-10218, cobot, functional-safety, risk-assessment, collaborative]
related: [robotics/nav2-architecture, robotics/pid-control, robotics/realtime-dds-latency, robotics/model-predictive-control, security/threat-modeling-stride]
sources:
  - https://www.ibf-solutions.com/en/seminars-and-news/news/new-standards-for-industrial-robots-en-iso-10218-1-and-2
  - https://www.controldesign.com/industry-news/news/55268769/iso-10218-update-makes-functional-safety-requirements-more-explicit
  - https://www.iso.org/standard/73934.html
updatedAt: 2026-11-19
---

## 문제

로봇은 사람보다 훨씬 힘이 세고 소프트웨어는 틀린다. "충돌하면 멈추도록 코드를 짰다" 는 안전 근거가 되지 못한다. 안전은 **위험을 식별해 줄이고, 줄였다는 것을 증명하는** 절차이고, 그 절차와 요구 수준은 표준이 정한다. 로봇 개발자는 표준 전체를 외울 필요는 없지만, 어디까지가 일반 제어 코드의 일이고 어디부터가 안전 계통의 일인지 알아야 한다.

> 주의: ISO 본문은 유료이고 이 노트는 ISO 공식 페이지(접근 차단)를 직접 읽지 못했다. 아래 내용은 표준 해설 기사 두 곳에서 교차 확인한 것이며, 적용 판단·인증에는 표준 원문을 본다.

## 구조

| 표준 | 범위 |
| --- | --- |
| ISO 10218-1 | 산업 로봇(로봇 자체) |
| ISO 10218-2 | 산업 로봇 응용과 로봇 셀(통합) |

- 두 파트의 2025년 판이 2025년 2월에 발행됐다. 첫 대규모 개정은 2011년 판 이후다.
- 파트 2 는 협동 로봇 요구를 다루던 ISO/TS 15066 의 내용과 수동 적재·해제 스테이션, 그리퍼 시스템 관련 기술 보고서 내용을 흡수했다.
- 파트 1 은 두 가지 로봇 클래스를 도입했다. 클래스 1 은 합리적 평가로 유의미한 위험이 없는 매우 약한 로봇, 클래스 2 는 그 외 일반 산업 로봇이다.
- 유럽 쪽에서는 EN ISO 판으로 채택되고 지침 정합 표준 목록에 오르는 절차가 따로 있다. 적용 시점은 해당 지역 공식 공보를 확인한다.

## 협동 운전 방식 (파트 2)

| 방식 | 아이디어 |
| --- | --- |
| 핸드 가이딩 | 작업자가 로봇을 직접 잡고 움직인다 |
| 속도·분리 감시 (SSM) | 사람과의 거리에 따라 속도를 낮추거나 정지 |
| 출력·힘 제한 (PFL) | 접촉이 일어나도 허용 힘·압력 이하로 제한. 접촉은 끼임(quasi-static)과 튕김(transient)으로 나눈다 |

PFL 은 안전 울타리 없이 쓰는 협동 로봇에서 중요해지고 있다. 접촉 형상이 뾰족하면 압력, 넓은 면이면 힘 한계가 적용된다.

## 기능 안전과 소프트웨어의 자리

- 안전 기능(비상 정지, 보호 정지, 감속 속도 제한 등)은 **요구 성능 수준(PL, ISO 13849-1) 또는 SIL(IEC 62061)** 로 신뢰도를 정하고, 그에 맞게 설계·검증된 안전 계통(안전 PLC·안전 릴레이·안전 등급 드라이브)이 수행한다.
- 이전 판의 일률적 요구(PL d, 카테고리 3)는 개정에서 사실상 사라졌다는 해설이 있다. 파트 2 의 부속서에 안전 기능 목록과 기본 성능 수준이 있고, 벗어나려면 위험 평가를 근거로 문서화한다.
- 정상 정지(Normal Stop)가 비상 정지와 별개의 안전 기능으로 추가됐고, 사이버보안 요구도 들어왔다.

```
[ 일반 제어 소프트웨어 ]  경로 계획, PID, ROS 노드 …   ← 틀릴 수 있다고 전제
          │ (명령)
[ 안전 계통 (인증) ]     속도·위치·힘 감시, 정지 회로    ← 독립적으로 차단
          │
        [ 구동기 ]
```

그림의 핵심은 **일반 소프트웨어가 안전을 "책임지지" 않는다**는 것이다. 위 노드가 전부 죽거나 틀린 명령을 보내도 아래 계통이 막아야 한다. 감시 한계는 위 층보다 보수적이어야 한다.

## 위험 평가는 개발의 일부

표준이 모든 것을 대신하지 않는다. 사용 목적, 합리적 오사용, 작업자 접근 경로를 따져 위험을 식별하고 감소 수단을 정한다(본질 안전 설계 → 안전 방호 → 사용 정보 순으로 줄이는 것이 안전 규격의 일반 원칙). 로봇 업데이트(속도 한계 조정, 그리퍼 교체)도 평가를 다시 연다.

## 언제 쓰나

- 산업·제조 현장에 팔, 셀, 협동 로봇을 통합하거나 납품할 때.
- ROS 기반 연구 로봇을 제품으로 옮길 때, 어떤 기능을 인증 계통으로 빼야 하는지 설계 초기에 정하기 위해.

## 주의/비용

- 로봇 팔 제조사가 제공하는 안전 기능(구성 가능한 안전 한계 등)이 주 수단이다. 자체 ROS 노드의 "충돌 회피"를 안전 기능으로 주장하지 않는다.
- 안전 등급 인증은 시간·비용이 크다. 설계 변경이 잦은 초기 단계에 안전 구조(어디가 안전 계통인지)부터 정하면 나중에 덜 든다.
- 모바일 로봇(AMR·무인 운반차)과 서비스 로봇은 적용 표준이 다르다. 이 노트는 산업 로봇 팔 중심이므로 해당 표준을 따로 확인한다. Nav2 의 Collision Monitor 같은 소프트웨어 기능도 인증된 안전 기능을 대체하지 않는다([Nav2 구조](/develop-wiki/knowledge/robotics/nav2-architecture/)).
- 제어 지연·지터는 정지 거리에 직접 들어간다([실시간성](/develop-wiki/knowledge/robotics/realtime-dds-latency/)).
- 네트워크로 연결된 로봇은 보안 침해가 곧 안전 문제다. 위협 모델링을 같이 한다([STRIDE](/develop-wiki/knowledge/security/threat-modeling-stride/)).
