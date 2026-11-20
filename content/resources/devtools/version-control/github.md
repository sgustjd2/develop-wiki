---
name: GitHub
url: https://github.com
docs: https://docs.github.com/en
repo: https://github.com/cli/cli
stars: 47103
domain: devtools
category: version-control
description: Git 저장소 호스팅에 Pull Request 코드 리뷰, Issues, Actions CI, 패키지 레지스트리를 묶은 협업 플랫폼. 오픈소스와 팀 개발의 기본 협업 공간으로 쓴다.
pricing: freemium
tags: [git, hosting, pull-request, code-review, gh-cli]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GitHub는 Git 원격 저장소를 호스팅하고, 그 위에서 Pull Request(PR) 리뷰·Issues·Projects·Actions(CI/CD)·Packages·보안 스캔을 제공하는 서비스다. 공식 CLI `gh`(MIT, 2026-11 기준 v2.105.0)로 PR·이슈·워크플로 실행을 터미널에서 다룬다. 문서는 한국어 번역(`docs.github.com/ko`)이 있다.

- 대안: 셀프 호스팅·올인원 DevOps가 필요하면 [GitLab](/develop-wiki/devtools/version-control/gitlab/). CI 자체는 [GitHub Actions](/develop-wiki/backend/infra-devops/github-actions/) 항목을 참고.

## 설치 (gh CLI)
```bash
brew install gh          # macOS / Linux(Homebrew)
winget install --id GitHub.cli
gh auth login            # 브라우저 또는 토큰으로 인증
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Repository | 코드 + Issues/PR/Actions/Wiki 설정 단위. 개인 또는 Organization 소유 |
| Fork | 다른 사람 저장소의 사본. 권한 없는 저장소에 기여할 때 |
| Pull Request | 브랜치 변경을 리뷰·토론·CI 검사 후 병합하는 단위. Draft 상태 가능 |
| Review | 줄 단위 코멘트, Approve / Request changes, suggestion 블록 |
| Branch protection / Rulesets | 필수 리뷰 수, 필수 상태 검사, 강제 푸시 금지 같은 규칙 |
| Merge 방식 | merge commit / squash / rebase. merge queue로 순차 검증 |
| Actions | `.github/workflows/*.yml`로 정의하는 CI/CD |
| CODEOWNERS | 경로별 리뷰어 자동 지정 |

## 기본 사용법 (gh)
| 하고 싶은 일 | 명령 |
| --- | --- |
| 저장소 복제 / 생성 | `gh repo clone owner/repo` / `gh repo create --private --source=. --push` |
| PR 만들기 | `gh pr create --fill` (커밋 메시지로 제목·본문) / `--draft` |
| PR 목록·체크아웃 | `gh pr list` / `gh pr checkout 123` |
| PR 상태·CI 결과 | `gh pr status` / `gh pr checks` |
| 리뷰·병합 | `gh pr review 123 --approve` / `gh pr merge 123 --squash --delete-branch` |
| 이슈 | `gh issue create` / `gh issue list --assignee @me` |
| Actions 실행 확인 | `gh run list` / `gh run watch` / `gh run view --log-failed` |
| 웹에서 열기 | `gh browse` / `gh pr view --web` |
| REST/GraphQL 호출 | `gh api repos/{owner}/{repo} --jq .stargazers_count` |

```bash
git switch -c fix/typo
git commit -am "docs: 오타 수정"
git push -u origin fix/typo
gh pr create --fill --reviewer teammate
gh pr checks --watch
```

## 자주 쓰는 패턴
- **PR 템플릿.** `.github/pull_request_template.md`, 이슈 폼은 `.github/ISSUE_TEMPLATE/`에 둔다.
- **필수 검사.** Rulesets에서 CI 작업을 required status check로 지정해 실패한 PR 병합을 막는다.
- **squash 병합.** 작업 중 커밋이 많은 팀은 squash 병합으로 main 이력을 PR 단위로 유지한다.
- **스크립트 자동화.** `gh api`와 `--jq`로 릴리스·라벨·권한 조회를 셸 스크립트에 넣는다.
- **AI 보조.** Copilot 코드 리뷰·코딩 에이전트는 [GitHub Copilot](/develop-wiki/ai/coding-agent/github-copilot/) 항목 참고.

## 언제 쓰나 / 피할 때
- 쓸 때: 오픈소스 공개, 외부 기여 받기, 팀 코드 리뷰와 CI를 한곳에서.
- 피할 때(대안): 사내망 셀프 호스팅이 필수면 GitHub Enterprise Server 또는 GitLab Self-Managed, 가벼운 셀프 호스팅은 Gitea·Forgejo.

## 공식 문서
- [GitHub Docs](https://docs.github.com/en) · [한국어 문서](https://docs.github.com/ko/get-started) · [Pull Request](https://docs.github.com/en/pull-requests)
- [gh 매뉴얼](https://cli.github.com/manual/) · [Actions](https://docs.github.com/en/actions) · [요금](https://github.com/pricing)
