---
title: CI/CD 파이프라인 설계
aka: [Continuous Integration, Continuous Delivery, Continuous Deployment, Deployment Pipeline, 배포 파이프라인]
category: engineering-practice
level: intermediate
summary: 변경을 자주 메인라인에 통합하고, 빠른 단계부터 느린 단계까지 자동 검증을 거쳐 언제든 배포 가능한 상태를 유지하는 지속적 통합·전달의 파이프라인 구성법.
tags: [ci, cd, devops, automation, testing]
related: [engineering-practice/trunk-based-vs-git-flow, engineering-practice/feature-flags, engineering-practice/code-review, engineering-practice/semantic-versioning]
sources:
  - https://martinfowler.com/articles/continuousIntegration.html
  - https://martinfowler.com/bliki/DeploymentPipeline.html
  - https://martinfowler.com/bliki/ContinuousDelivery.html
updatedAt: 2026-11-18
---

## 문제

- 통합을 몇 주에 한 번 하면 충돌·회귀가 한꺼번에 터진다.
- 배포가 수동 절차서에 의존하면 사람마다 결과가 다르고, 배포가 "큰 행사"가 되어 더 드물어진다.
- 테스트 전체가 1시간 걸리면 개발자는 결과를 기다리지 않고 다음 일로 넘어가, 깨진 빌드가 방치된다.

## 해법

### 세 용어 구분

| 용어 | 뜻 |
| --- | --- |
| 지속적 통합 (CI) | 모두가 최소 하루 한 번 메인라인에 통합하고, 매 푸시마다 자동 빌드·테스트 |
| 지속적 전달 (Continuous Delivery) | 소프트웨어를 **언제든** 운영에 배포할 수 있는 상태로 유지. 배포 여부는 사업 판단 |
| 지속적 배포 (Continuous Deployment) | 파이프라인을 통과한 **모든** 변경을 자동으로 운영에 배포. 지속적 전달이 전제 |

### CI 의 핵심 실천 (Fowler)

- 빌드에 필요한 모든 것(코드, 테스트, 스키마, 설정, 빌드 스크립트)을 버전 관리한다. 빌드 산출물은 넣지 않는다.
- 명령 하나로 빌드되고, 빌드는 **스스로 테스트**한다. 테스트 하나라도 실패하면 빌드 실패.
- 메인라인의 모든 푸시에 빌드를 돌린다.
- **깨진 빌드는 최우선으로 고친다.** 보통 가장 빠른 방법은 문제 커밋을 되돌리는 것.
- 커밋 빌드는 약 **10분** 안에 끝나게 한다(XP 지침).

### 배포 파이프라인

빌드·검증을 단계로 나누고, 앞 단계일수록 빠르고 뒤 단계일수록 느리고 철저하게 둔다. 첫 단계에서 만든 산출물을 뒤 단계가 그대로 재사용한다.

```
commit ─▶ [커밋 단계] ─▶ [인수 단계] ─▶ [스테이징] ─▶ (승인) ─▶ [운영]
          컴파일·단위테스트  통합·E2E 테스트  운영 복제 환경   수동/자동   카나리·블루그린
          린트·취약점 스캔   계약 테스트       성능·보안 점검
          ~10분            수십 분~수 시간
```

```ts
// 파이프라인을 코드로 표현한 개념 모델 (특정 CI 도구 문법 아님)
type Stage = { name: string; run: () => Promise<void>; manualApproval?: boolean };

async function runPipeline(stages: Stage[], approve: (s: string) => Promise<boolean>) {
  for (const s of stages) {
    if (s.manualApproval && !(await approve(s.name))) return 'held';
    await s.run(); // 실패하면 throw → 이후 단계는 실행되지 않음
  }
  return 'deployed';
}
```

### 설계 원칙

- **산출물은 한 번만 빌드**하고 환경별로 설정만 바꿔 승격한다. 단계마다 다시 빌드하면 테스트한 것과 배포한 것이 달라질 수 있다.
- 테스트 환경은 운영과 최대한 같게(DB 버전, OS, 컨테이너 이미지).
- 미완성 기능은 [기능 플래그](/develop-wiki/knowledge/engineering-practice/feature-flags/)로 숨겨, 브랜치 대신 메인라인에서 작업한다.
- 배포 자동화에 롤백, 블루그린, 카나리를 포함하고 애플리케이션이 자기 버전을 노출하게 한다.
- 빌드 상태를 모두가 볼 수 있게(대시보드, 채팅 알림) 한다.

## 언제 쓰나

- 팀 규모와 관계없이 CI 는 기본값이다.
- 지속적 전달은 배포 주기를 사업이 정하고 싶을 때, 지속적 배포는 운영 버전이 하나이고 자동 테스트·관측이 충분히 믿을 만할 때.

## 주의 (비용)

- 테스트가 불안정(flaky)하면 파이프라인 신뢰가 무너진다. 불안정한 테스트는 격리하고 바로 고친다.
- 파이프라인이 느려지면 개발자는 우회한다. 테스트 병렬화, 변경 영향 범위 기반 실행, 캐시로 커밋 단계를 짧게 유지한다.
- 지속적 배포는 자동 테스트만으로 부족하다. 배포 후 오류율·지연을 보는 [관측 가능성](/develop-wiki/knowledge/engineering-practice/observability-basics/)과 자동 롤백이 함께 있어야 한다.
- 기능 브랜치마다 CI 를 돌리는 것은 "반쪽 통합"이다. 진짜 통합은 메인라인에서 일어난다.
