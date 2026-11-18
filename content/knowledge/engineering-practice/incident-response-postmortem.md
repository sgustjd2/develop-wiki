---
title: 장애 대응과 비난 없는 포스트모템
aka: [Incident Response, Incident Command, Blameless Postmortem, Post-incident Review, 사후 분석]
category: engineering-practice
level: intermediate
summary: 장애가 나면 역할을 나눠 영향부터 줄이고(완화 우선), 끝난 뒤 개인 대신 시스템과 절차의 원인을 찾아 재발 방지 조치로 이어지게 기록하는 관행.
tags: [sre, incident, on-call, reliability, culture]
related: [engineering-practice/observability-basics, engineering-practice/feature-flags, engineering-practice/ci-cd-pipeline]
sources:
  - https://sre.google/sre-book/postmortem-culture/
  - https://sre.google/workbook/incident-response/
updatedAt: 2026-11-18
---

## 문제

- 장애 중 모두가 각자 고치려 들어 같은 일을 중복하거나 서로의 조치를 덮어쓴다. 누가 결정하는지, 고객에게 누가 알리는지 모른다.
- 원인을 찾느라 롤백을 미루는 사이 영향이 커진다.
- 끝난 뒤 "누가 실수했나"를 따지면 사람들은 문제를 숨기고, 같은 장애가 반복된다.

## 해법

### 장애 대응: 역할과 순서

Google SRE 는 소방 등에서 쓰는 사고 지휘 체계(ICS)를 바탕으로 역할을 나눈다.

| 역할 | 하는 일 |
| --- | --- |
| 사고 지휘자 (IC) | 전체 방향 결정, 역할 배정. 배정하지 않은 역할은 IC 가 맡음 |
| 운영 리드 (OL) | 실제 완화·복구 작업 |
| 커뮤니케이션 리드 (CL) | 이해관계자·고객에게 주기적 공지, 문의 응대 |

- 원칙은 **3C**: 조율(Coordinate), 소통(Communicate), 통제(Control).
- **일찍, 자주 선언한다.** 장애로 선언하고 관리하면 더 빨리 해결된다. 애매하면 선언하고 나중에 내린다.
- **완화 먼저, 원인은 나중.** 순서는 영향 파악 → 완화 → 원인 분석 → 근본 수정 → 포스트모템.
- 원인을 몰라도 쓸 수 있는 **일반 완화책**을 미리 준비한다: 직전 배포 롤백, 트래픽 우회, [기능 플래그](/develop-wiki/knowledge/engineering-practice/feature-flags/) 끄기, 용량 증설.
- 긴 장애는 IC 를 교대해 피로를 막는다. 인수인계는 명시적으로 한다.

### 포스트모템: 언제

기준을 **미리** 정한다. 예:
- 정해진 임계치 이상의 사용자 영향(중단·성능 저하)
- 데이터 유실
- 온콜의 수동 개입(롤백, 트래픽 우회)
- 해결 시간이 임계치 초과
- 모니터링이 못 잡아 사람이 발견한 경우

### 포스트모템: 무엇을

```ts
interface Postmortem {
  summary: string;
  impact: { users: string; duration: string; dataLoss: boolean };
  timeline: { at: string; event: string }[];   // 탐지·판단·조치 시각
  contributingCauses: string[];                // 단일 "범인" 대신 기여 요인들
  whatWentWell: string[];
  whereWeGotLucky: string[];
  actionItems: { action: string; owner: string; priority: 'P0' | 'P1' | 'P2'; type: 'prevent' | 'detect' | 'mitigate' }[];
}
```

### 비난 없음 (blameless)

- 모든 사람이 **그때 가진 정보로 선의로 행동했다**고 가정한다.
- 질문을 "누가 잘못했나"에서 "시스템이 왜 그 실수를 허용했나, 왜 더 빨리 못 알았나"로 바꾼다.
- 개선할 점을 지적하지 않는 것이 아니다. 대상을 사람에서 시스템·절차로 옮기는 것이다.

## 언제 쓰나

- 운영 중인 서비스를 가진 모든 팀. 규모가 작아도 역할 구분(IC 1명)과 짧은 포스트모템은 효과가 있다.
- 큰 장애뿐 아니라 "아슬아슬했던 일(near miss)"도 학습 대상이다.

## 주의 (비용)

- 액션 아이템이 백로그에서 잊히면 포스트모템은 의식에 그친다. 담당자·우선순위·기한을 붙이고 추적한다.
- 문서는 협업 도구에서 함께 쓰고 선임 엔지니어가 검토한다(영향 평가가 충분한가, 원인을 깊게 봤나, 조치가 적절한가).
- 최대한 넓게 공유하되, 최종 사용자를 식별할 수 있는 정보는 넣지 않는다.
- 포스트모템 작성이 과도한 노동(toil)이 되지 않도록 기준과 양식을 주기적으로 점검한다.
- 리더가 비난 없는 태도를 보이지 않으면 문화가 자리 잡지 않는다. 잘 쓴 포스트모템을 공개적으로 인정한다.
