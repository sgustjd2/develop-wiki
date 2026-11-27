---
name: pre-commit
url: https://pre-commit.com/
docs: https://pre-commit.com/
repo: https://github.com/pre-commit/pre-commit
stars: 15717
domain: devtools
category: version-control
description: Git 커밋 직전에 린터·포매터 같은 훅을 YAML 설정으로 실행하는 다언어 훅 관리 프레임워크. 팀 전체에 같은 커밋 전 검사를 강제할 때 쓴다.
pricing: oss
tags: [git-hooks, lint, formatter, husky]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
pre-commit은 `.pre-commit-config.yaml`에 적은 훅 저장소를 버전 고정(`rev`)으로 받아 격리 환경에 설치하고, 커밋 때 바뀐 파일에만 실행한다. 훅을 Python·Node·Go·Rust·Docker 등 여러 언어로 작성할 수 있어 언어가 섞인 저장소에 맞다. 이 문서는 **4.7** 기준(PyPI 최신 4.7.0, MIT).

- JavaScript 프로젝트에서는 `package.json`과 함께 관리되는 **Husky**(v9.1.7)가 흔한 대안이다. 아래에 간단히 정리했다.

## 설치
```bash
pipx install pre-commit      # 또는 brew install pre-commit / uv tool install pre-commit
pre-commit install           # .git/hooks/pre-commit 설치 (저장소마다 1회)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `.pre-commit-config.yaml` | 저장소 루트의 훅 목록 |
| `repos[].repo` / `rev` | 훅이 있는 Git 저장소와 고정 태그 |
| `hooks[].id` | 저장소가 제공하는 훅 이름. `args`, `files`, `exclude`로 조정 |
| `local` repo | 저장소 안 스크립트를 훅으로 등록 |
| stages | `pre-commit`, `pre-push`, `commit-msg` 등 실행 시점 |

## 기본 사용법
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
  - repo: local
    hooks:
      - id: unit-tests
        name: unit tests
        entry: npm test
        language: system
        pass_filenames: false
        stages: [pre-push]
```

```bash
pre-commit run --all-files     # 처음 도입할 때 전체 파일 검사
pre-commit autoupdate          # rev 를 최신 태그로 갱신
git commit --no-verify         # 긴급 시 훅 건너뛰기 (남용 금지)
```

## 자주 쓰는 패턴
- **CI에서도 같은 검사.** CI 잡에서 `pre-commit run --all-files`를 돌려 로컬에서 훅을 설치하지 않은 경우도 잡는다.
- **pre-push 훅.** 느린 테스트는 `stages: [pre-push]`로 옮겨 커밋을 가볍게 유지.
- **언어별 공식 훅.** Ruff, Prettier, golangci-lint 등 상당수 도구가 pre-commit용 훅 저장소를 제공한다.

### Husky (JavaScript 프로젝트)
```bash
npm install --save-dev husky
npx husky init        # .husky/pre-commit 생성, package.json에 "prepare": "husky" 추가
echo "npx lint-staged" > .husky/pre-commit
```
`npm install` 시 `prepare` 스크립트가 훅을 설치하므로 팀원이 따로 설치할 필요가 없다. 스테이징된 파일만 검사하려면 lint-staged와 함께 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 포매팅·린트·비밀키 검출을 커밋 전에 자동으로 걸러야 할 때, 여러 언어가 섞인 저장소.
- 피할 때(대안): Node 전용 저장소면 Husky + lint-staged가 설치 흐름이 단순하다. 훅은 우회 가능하므로 필수 규칙은 CI에서도 검사한다.

## 공식 문서
- [pre-commit 문서](https://pre-commit.com/) · [지원 훅 목록](https://pre-commit.com/hooks.html) · [pre-commit-hooks](https://github.com/pre-commit/pre-commit-hooks)
- [Husky 문서](https://typicode.github.io/husky/) · [Git 훅 레퍼런스](https://git-scm.com/docs/githooks)
