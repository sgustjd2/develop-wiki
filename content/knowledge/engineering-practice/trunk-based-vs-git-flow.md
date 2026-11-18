---
title: 트렁크 기반 개발 vs Git Flow
aka: [Trunk-Based Development, Git Flow, GitHub Flow, Branching Strategy, 브랜치 전략]
category: engineering-practice
level: intermediate
summary: 모두가 하나의 메인 브랜치에 하루 단위로 통합하는 트렁크 기반 개발과, develop·release·hotfix 브랜치를 두는 Git Flow 를 통합 빈도와 릴리스 형태 기준으로 비교한다.
tags: [git, branching, continuous-integration, release]
related: [engineering-practice/ci-cd-pipeline, engineering-practice/feature-flags, engineering-practice/code-review, engineering-practice/semantic-versioning]
sources:
  - https://martinfowler.com/articles/branching-patterns.html
  - https://trunkbaseddevelopment.com/
  - https://nvie.com/posts/a-successful-git-branching-model/
updatedAt: 2026-11-18
---

브랜치 전략의 핵심 질문은 "얼마나 자주 메인라인에 합치는가"와 "동시에 몇 개 버전을 운영하는가" 두 가지다. 이름보다 이 두 값을 먼저 정하면 전략이 거의 정해진다.

## 문제

- 기능 브랜치를 몇 주씩 유지하면 메인라인과 멀어져 **머지가 크고 위험**해진다. 충돌은 늦게 드러나고 "통합 공포" 때문에 더 미루게 된다.
- 반대로 아무 규칙 없이 메인에 바로 올리면 미완성 기능이 섞여 릴리스할 수 없는 상태가 된다.
- 설치형 소프트웨어처럼 여러 버전을 동시에 지원해야 하는 팀과, 웹 서비스처럼 운영 버전이 하나뿐인 팀은 필요한 브랜치가 다르다.

## 해법

### 트렁크 기반 개발 (TBD)

- 공유 브랜치 하나(`main`, 트렁크)에 **모든 팀원이 최소 하루 한 번** 통합한다. 장기 개발 브랜치를 만들지 않는다.
- 브랜치를 쓰더라도 리뷰·CI 확인용 **단명 기능 브랜치**(수 시간~이틀)만 쓴다.
- 미완성 기능은 브랜치가 아니라 [기능 플래그](/develop-wiki/knowledge/engineering-practice/feature-flags/)나 branch by abstraction 으로 숨긴다.
- 릴리스는 트렁크에서 바로 하거나, 필요하면 릴리스 직전에 릴리스 브랜치를 잘라 안정화한 뒤 지운다.
- Fowler 는 TBD 가 사실상 지속적 통합(CI)과 같은 실천이라고 본다.

### Git Flow

Vincent Driessen 이 2010년에 제안한 모델.

| 브랜치 | 분기 원천 | 병합 대상 | 역할 |
| --- | --- | --- | --- |
| `master`(main) | — | — | 운영 배포 상태. 병합마다 버전 태그 |
| `develop` | — | — | 다음 릴리스를 위한 통합 브랜치 |
| `feature/*` | develop | develop | 기능 개발 |
| `release-*` | develop | master + develop | 릴리스 안정화, 버그 수정·메타데이터만 |
| `hotfix-*` | master(태그) | master + develop | 운영 긴급 수정 |

### GitHub Flow (중간 지점)

`main` 과 기능 브랜치만 둔다. 운영 버전은 하나라고 가정하고, 풀 리퀘스트로 리뷰한 뒤 머지하면 배포한다. 릴리스·핫픽스 브랜치가 없다.

## 언제 쓰나

- **TBD**: 운영 버전이 하나인 웹·SaaS, 지속적 배포를 하려는 팀. 자동 테스트와 CI 가 갖춰져 있어야 한다.
- **GitHub Flow**: TBD 의 규율(하루 단위 통합)은 아직 어렵지만 PR 리뷰 기반으로 자주 배포하려는 팀.
- **Git Flow**: 명시적 버전을 배포하는 소프트웨어(설치형, 모바일 앱, 라이브러리), **여러 버전을 동시에 지원**해야 하는 경우.

## 주의

- Driessen 스스로 2020년에 덧붙인 글에서, 지속적으로 배포하는 웹 앱에는 Git Flow 대신 GitHub Flow 같은 단순한 방식을 권했다. Git Flow 를 만능 표준처럼 쓰는 것을 경계했다.
- Fowler 의 지적: Git Flow 는 기능 브랜치를 얼마나 오래 둘지 정하지 않는다. `develop` 에 몇 주짜리 기능 브랜치를 합치면 통합 문제는 그대로다.
- TBD 의 비용: CI 가 빠르고 믿을 만해야 하고, 빌드가 깨지면 즉시 고치는 문화가 필요하다. 플래그가 쌓이면 그 자체가 부채가 된다.
- 브랜치를 만들기 전에 **어떻게 합칠지**부터 정한다. 머지가 아프다면 통합 빈도를 높이거나 모듈 경계를 고치라는 신호다.

## 비교

| | 트렁크 기반 | GitHub Flow | Git Flow |
| --- | --- | --- | --- |
| 장수 브랜치 | main 하나 | main 하나 | main + develop |
| 기능 브랜치 수명 | 수 시간~2일 | 수 시간~수 주 | 정하지 않음 |
| 미완성 기능 숨기기 | 기능 플래그 | 브랜치에 둠 | 브랜치에 둠 |
| 릴리스 브랜치 | 선택 (단명) | 없음 | 있음 |
| 다중 버전 지원 | 어려움 | 어려움 | 적합 |
| 전제 조건 | 빠른 CI, 자동 테스트, 플래그 | PR 리뷰, CI | 릴리스 관리 인력 |
