---
name: Jujutsu (jj)
url: https://jj-vcs.dev
docs: https://docs.jj-vcs.dev/latest/
repo: https://github.com/jj-vcs/jj
stars: 32623
domain: devtools
category: version-control
description: Git 저장소를 그대로 백엔드로 쓰면서 스테이징 없이 작업 사본을 커밋으로 다루는 버전 관리 도구. 잦은 히스토리 편집과 스택형 변경 관리에 쓴다.
pricing: oss
tags: [vcs, git-compatible, jj, rust]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Jujutsu(명령 `jj`)는 Git과 호환되는 버전 관리 도구다. 작업 사본 자체가 커밋(`@`)이라 `git add`가 없고, 명령을 실행할 때마다 자동으로 스냅샷된다. 커밋을 고쳐 쓰면 자손 커밋이 자동 리베이스되고, 모든 저장소 조작이 operation log에 남아 `jj undo`로 되돌릴 수 있다. 이 문서는 **v0.47** 기준(2026-11 최신 v0.47.1, Apache-2.0). 아직 1.0 전이라 명령·설정이 바뀔 수 있다.

- 같은 폴더에 `.git`과 `.jj`를 함께 두는 colocated 모드로 기존 [Git](/develop-wiki/devtools/version-control/git/) 도구·[GitHub](/develop-wiki/devtools/version-control/github/)와 그대로 협업한다.

## 설치
```bash
brew install jj
# 또는 cargo install --locked --bin jj jj-cli
jj config set --user user.name "홍길동"
jj config set --user user.email "me@example.com"
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 작업 사본 커밋 `@` | 편집 중인 내용이 곧 커밋. 다음 명령 때 자동 반영 |
| change ID / commit ID | change ID는 고쳐 써도 유지, commit ID(Git 해시)는 바뀜 |
| bookmark | Git 브랜치에 해당. 새 커밋을 따라 자동 이동하지 않음 |
| revset | `@-`(부모), `main::`(자손), `mine()` 같은 커밋 선택 언어 |
| 충돌 커밋 | 충돌도 커밋에 기록되어 나중에 해결 가능 |
| operation log | `jj op log` / `jj undo`로 조작 단위 되돌리기 |

## 자주 쓰는 명령
| 하고 싶은 일 | 명령 |
| --- | --- |
| 기존 Git 저장소에서 시작 / 복제 | `jj git init` (기본 colocated) / `jj git clone <url>` |
| 상태·로그 | `jj st` / `jj log` / `jj diff` |
| 현재 변경에 설명 달기 | `jj describe -m "msg"` |
| 설명 확정하고 새 변경 시작 | `jj commit -m "msg"` (= describe + new) |
| 특정 커밋 위에 새 변경 | `jj new main` |
| 부모로 합치기 / 나누기 | `jj squash` (`-i` 부분) / `jj split` |
| 옛 커밋 편집 | `jj edit <change>` |
| 리베이스 | `jj rebase -s <src> -o <dest>` |
| 버리기 / 되돌리기 | `jj abandon <rev>` / `jj undo` |
| 원격 받기 / 올리기 | `jj git fetch` / `jj git push` |

## 기본 사용법
GitHub PR 흐름:

```bash
jj git fetch
jj new main                       # main 위에서 새 변경 시작
# ... 코드 수정 ...
jj commit -m "feat: 검색 필터 추가"
jj bookmark create feat-filter -r @-
jj git push --bookmark feat-filter   # 또는 jj git push -c @- (이름 자동 생성)
```

리뷰 반영: `jj new feat-filter` → 수정 → `jj squash`로 합친 뒤 다시 `jj git push`.

## 자주 쓰는 패턴
- **스택형 PR.** 여러 커밋을 쌓고 아래 커밋을 `jj edit`으로 고치면 위 커밋이 자동으로 따라온다.
- **bookmark 이동.** 리뷰 후 커밋을 추가했다면 `jj bookmark move feat-filter --to @-`.
- **안심 실험.** 무엇을 하든 `jj op log`로 직전 상태를 찾아 `jj undo`·`jj op restore`로 복구.
- **내 커밋만 보기.** `jj log -r 'mine() & ~::main'`.

## 언제 쓰나 / 피할 때
- 쓸 때: rebase·amend를 자주 하는 개인 워크플로, 스택형 변경 관리, Git 사용법이 부담되는 팀원.
- 피할 때(대안): 팀 전체가 Git 훅·Git LFS·서브모듈에 크게 의존하면 호환 범위를 먼저 확인한다(일부 기능 미지원). 1.0 전 버전이라 변화가 잦다.

## 공식 문서
- [문서 홈](https://docs.jj-vcs.dev/latest/) · [튜토리얼](https://docs.jj-vcs.dev/latest/tutorial/) · [Git 명령 대응표](https://docs.jj-vcs.dev/latest/git-command-table/)
- [GitHub와 함께 쓰기](https://docs.jj-vcs.dev/latest/github/) · [revset](https://docs.jj-vcs.dev/latest/revsets/) · [릴리스](https://github.com/jj-vcs/jj/releases)
