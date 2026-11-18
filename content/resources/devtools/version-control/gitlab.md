---
name: GitLab
url: https://about.gitlab.com
docs: https://docs.gitlab.com/
repo: https://gitlab.com/gitlab-org/gitlab
domain: devtools
category: version-control
description: Git 호스팅, Merge Request 리뷰, 내장 CI/CD, 컨테이너 레지스트리를 한 제품에 담은 DevOps 플랫폼. 셀프 호스팅이 필요한 조직에서 많이 쓴다.
pricing: freemium
tags: [git, hosting, merge-request, ci-cd, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GitLab은 소스 관리부터 CI/CD, 패키지·컨테이너 레지스트리, 보안 스캔, 이슈·에픽 관리까지 한 애플리케이션으로 제공하는 플랫폼이다. SaaS(GitLab.com), 자체 서버에 설치하는 Self-Managed, 전용 인스턴스(Dedicated)로 제공된다. 오픈 코어 모델이라 Community Edition은 MIT 라이선스, 상위 기능(Premium·Ultimate)은 유료다. 2026-11 기준 최신 메이저는 **GitLab 19**이며 매월 마이너 릴리스가 나온다.

- [GitHub](/develop-wiki/devtools/version-control/github/)와 비교하면 CI/CD가 처음부터 내장되어 있고 셀프 호스팅 선택지가 넓다.

## 설치
```bash
# 공식 CLI (glab)
brew install glab
glab auth login

# Self-Managed 체험: Docker 이미지 (CE)
docker run -d --name gitlab -p 8080:80 -v gitlab-data:/var/opt/gitlab gitlab/gitlab-ce:latest
```
운영 설치는 Linux 패키지(Omnibus), Helm 차트, Operator를 공식 지원한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Group / Subgroup / Project | 계층형 조직 구조. 권한·CI 변수를 상위에서 상속 |
| Merge Request (MR) | GitHub PR에 해당. 승인 규칙, 스레드 해결, 병합 열차(merge train) |
| `.gitlab-ci.yml` | 저장소 루트의 파이프라인 정의 |
| Pipeline / Stage / Job | 스테이지 순서로 잡 실행. `needs`로 DAG 구성 |
| Runner | 잡을 실행하는 에이전트. GitLab.com 공유 러너 또는 자체 등록 |
| Environments | 배포 대상과 이력, 수동 승인 배포 |
| Protected branches | 푸시·병합 권한 제한 |

## 기본 사용법
`.gitlab-ci.yml` 최소 예:

```yaml
stages: [test, build]

test:
  stage: test
  image: node:24
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:24
  script: npm run build
  artifacts:
    paths: [dist/]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

`glab` 자주 쓰는 명령:

```bash
glab mr create --fill            # 현재 브랜치로 MR 생성
glab mr list / glab mr checkout 42
glab ci status                   # 파이프라인 상태
glab ci view                     # 잡 진행 상황 TUI
```

## 자주 쓰는 패턴
- **푸시 옵션으로 MR 생성.** `git push -o merge_request.create -o merge_request.target=main`.
- **템플릿 재사용.** `include:`로 다른 프로젝트나 CI/CD 컴포넌트의 YAML을 가져온다.
- **MR 파이프라인.** `rules: - if: $CI_PIPELINE_SOURCE == "merge_request_event"`로 MR에서만 실행.
- **보호 변수.** 배포 토큰은 Settings → CI/CD Variables에 Protected·Masked로 저장.

## 언제 쓰나 / 피할 때
- 쓸 때: 사내 서버에 코드·CI를 함께 두어야 할 때, 한 도구에서 계획~배포까지 관리하고 싶을 때.
- 피할 때(대안): 오픈소스 커뮤니티 노출이 중요하면 GitHub. 가벼운 Git 호스팅만 필요하면 Gitea·Forgejo.

## 공식 문서
- [GitLab Docs](https://docs.gitlab.com/) · [CI/CD YAML 레퍼런스](https://docs.gitlab.com/ci/yaml/) · [릴리스](https://docs.gitlab.com/releases/)
- [glab CLI](https://gitlab.com/gitlab-org/cli) · [설치 방법](https://docs.gitlab.com/install/) · [요금](https://about.gitlab.com/pricing/)
