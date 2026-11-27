---
name: Git
url: https://git-scm.com
docs: https://git-scm.com/docs
repo: https://github.com/git/git
stars: 64532
domain: devtools
category: version-control
description: 파일 변경 이력을 커밋 그래프로 관리하는 분산 버전 관리 시스템. 거의 모든 코드 저장소·협업 플랫폼의 기반으로 쓴다.
pricing: oss
tags: [vcs, git, branch, merge, rebase]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Git은 저장소 전체 이력을 각 개발자 컴퓨터에 복제해 두는 분산 버전 관리 시스템이다. 스냅샷(커밋)을 내용 해시로 식별하고, 브랜치는 커밋을 가리키는 가벼운 포인터라서 브랜치 생성·전환이 빠르다. 이 문서는 **2.56** 기준이다(2026-11 기준 최신 태그 v2.56.1). 라이선스는 GPL-2.0.

- GitHub·GitLab 같은 호스팅 서비스는 Git 저장소 위에 PR/MR·CI를 얹은 것이다. Git 호환 대안 인터페이스로 [Jujutsu](/develop-wiki/devtools/version-control/jujutsu/)가 있다.

## 설치
```bash
brew install git                 # macOS (Xcode Command Line Tools에도 포함)
sudo apt install git             # Debian/Ubuntu
git --version

git config --global user.name "홍길동"
git config --global user.email "me@example.com"
git config --global init.defaultBranch main
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 작업 트리 / 스테이징(index) / 저장소 | 수정 → `git add`로 스테이징 → `git commit`으로 이력에 기록하는 3단계 |
| 커밋 | 트리 스냅샷 + 부모 커밋 + 메시지. SHA 해시로 식별 |
| 브랜치 | 커밋을 가리키는 이동 가능한 이름. `HEAD`는 현재 체크아웃한 위치 |
| 원격(remote) | `origin` 등 다른 저장소의 별칭. `fetch`/`pull`/`push`로 동기화 |
| 원격 추적 브랜치 | `origin/main`처럼 마지막으로 가져온 원격 상태 |
| merge / rebase | 병합 커밋으로 합치기 / 커밋을 다른 기준 위로 다시 쌓기 |
| reflog | `HEAD`가 이동한 기록. 잘못된 reset·rebase 복구에 사용 |
| `.gitignore` | 추적하지 않을 파일 패턴 |

## 자주 쓰는 명령
| 하고 싶은 일 | 명령 |
| --- | --- |
| 저장소 만들기 / 복제 | `git init` / `git clone <url>` |
| 상태·변경 확인 | `git status -sb` / `git diff` / `git diff --staged` |
| 스테이징 (부분) | `git add <파일>` / `git add -p` |
| 커밋 / 직전 커밋 수정 | `git commit -m "msg"` / `git commit --amend` |
| 이력 보기 | `git log --oneline --graph --all` |
| 브랜치 생성·전환 | `git switch -c feature` / `git switch main` |
| 원격 가져오기·병합 | `git fetch` / `git pull --rebase` |
| 올리기 (처음) | `git push -u origin feature` |
| 병합 / 리베이스 | `git merge feature` / `git rebase main` |
| 커밋 정리 | `git rebase -i HEAD~3` (squash·reword) |
| 파일 변경 되돌리기 | `git restore <파일>` / `git restore --staged <파일>` |
| 커밋 되돌리기 (이력 유지) | `git revert <sha>` |
| 브랜치를 특정 커밋으로 | `git reset --soft <sha>` (`--mixed`·`--hard`) |
| 임시 보관 | `git stash` / `git stash pop` |
| 다른 커밋 가져오기 | `git cherry-pick <sha>` |
| 누가 바꿨나 | `git blame <파일>` / `git log -p -- <파일>` |
| 버그 도입 커밋 찾기 | `git bisect start` → `good`/`bad` 표시 |
| 태그 | `git tag v1.0.0` / `git push --tags` |

## 기본 사용법
기능 브랜치 흐름:

```bash
git switch -c feat/login
# ... 코드 수정 ...
git add -p
git commit -m "feat: 로그인 폼 추가"
git fetch origin
git rebase origin/main          # 최신 main 위로 정리
git push -u origin feat/login   # 이후 PR/MR 생성
```

## 자주 쓰는 패턴
- **실수 복구.** `git reflog`로 이전 `HEAD` 위치를 찾고 `git reset --hard HEAD@{2}`로 되돌린다. `--hard`는 작업 트리 변경도 지우므로 먼저 `git stash`.
- **강제 푸시는 안전하게.** rebase 후에는 `git push --force-with-lease`를 쓴다. 다른 사람이 그사이 올린 커밋이 있으면 거부된다.
- **여러 작업 동시에.** `git worktree add ../hotfix main`으로 같은 저장소의 다른 브랜치를 별도 폴더에 체크아웃한다.
- **큰 저장소.** `git clone --filter=blob:none`(부분 복제)과 `git sparse-checkout`으로 필요한 부분만 받는다.
- **훅.** `.git/hooks`의 스크립트로 커밋 전 검사를 한다. 팀 공유는 [pre-commit](/develop-wiki/devtools/version-control/pre-commit/)·Husky 같은 도구로 관리.

## 언제 쓰나 / 피할 때
- 쓸 때: 사실상 모든 소스 코드 버전 관리. 텍스트 기반 설정·문서도 포함.
- 피할 때(대안): 대용량 바이너리(영상·게임 에셋)는 Git LFS나 Perforce 같은 도구를 검토한다. Git 명령 체계가 번거롭다면 Git 저장소와 호환되는 Jujutsu를 함께 쓸 수 있다.

## 공식 문서
- [레퍼런스](https://git-scm.com/docs) · [Pro Git (한국어)](https://git-scm.com/book/ko/v2) · [다운로드](https://git-scm.com/downloads)
- [GitHub 저장소 미러](https://github.com/git/git)
