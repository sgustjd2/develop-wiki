---
title: 시맨틱 버저닝과 변경 로그
aka: [Semantic Versioning, SemVer, Changelog, Keep a Changelog, Conventional Commits]
category: engineering-practice
level: beginner
summary: MAJOR.MINOR.PATCH 버전 번호로 공개 API 의 호환성 변화를 알리고, 사람이 읽는 변경 로그로 버전별 차이를 기록하는 릴리스 관행.
tags: [release, versioning, api, changelog]
related: [engineering-practice/ci-cd-pipeline, engineering-practice/trunk-based-vs-git-flow]
sources:
  - https://semver.org/
  - https://keepachangelog.com/en/1.1.0/
  - https://www.conventionalcommits.org/en/v1.0.0/
updatedAt: 2026-11-18
---

## 문제

- 라이브러리를 `2.3` 에서 `2.4` 로 올렸더니 빌드가 깨진다. 버전 번호가 호환성에 대해 아무것도 말해 주지 않는다.
- 의존성 범위(`^2.3.0`)를 쓰고 싶어도, 상위 버전이 안전하다는 약속이 없으면 고정 버전만 쓰게 되고 보안 패치가 늦어진다.
- 무엇이 바뀌었는지 알려면 커밋 로그를 뒤져야 한다.

## 해법

### SemVer 2.0.0 규칙

`MAJOR.MINOR.PATCH`

| 올리는 자리 | 언제 | 예 |
| --- | --- | --- |
| MAJOR | 공개 API 와 **호환되지 않는** 변경 | `1.4.2` → `2.0.0` |
| MINOR | 호환되는 기능 추가 (deprecation 포함) | `1.4.2` → `1.5.0` |
| PATCH | 호환되는 버그 수정 | `1.4.2` → `1.4.3` |

- 앞자리를 올리면 뒷자리는 0 으로 돌린다.
- **공개 API 를 먼저 선언**해야 한다(코드든 문서든). 호환성은 그 API 기준으로 판단한다.
- `0.y.z` 는 초기 개발 단계: 아무 때나 바뀔 수 있다. `1.0.0` 이 공개 API 를 정의하는 시점이다.
- 프리릴리스는 하이픈(`1.0.0-alpha.1`), 빌드 메타데이터는 플러스(`1.0.0+20261118`). 프리릴리스는 정식 버전보다 낮고, 빌드 메타데이터는 우선순위 비교에서 무시한다.
- **이미 배포한 버전의 내용은 바꾸지 않는다.** 고치려면 새 버전을 낸다.
- 기능 제거는: 문서에 deprecation 을 알리고 MINOR 로 한 번 이상 배포한 뒤, MAJOR 에서 제거한다.

### 변경 로그 (Keep a Changelog)

```md
## [Unreleased]

## [1.5.0] - 2026-11-18
### Added
- `retry` 옵션으로 재시도 횟수 지정
### Deprecated
- `timeoutMs` 는 2.0 에서 제거 예정, `timeout` 사용
### Fixed
- 빈 배열 입력 시 예외가 나던 문제
```

- 사람이 읽는 문서다. 최신 버전을 위에, 버전마다 날짜를 적는다.
- 변경 종류: Added, Changed, Deprecated, Removed, Fixed, Security.
- `Unreleased` 절에 다음 릴리스 변경을 모아 두었다가 릴리스 때 버전 절로 옮긴다.
- 커밋 로그를 그대로 붙이지 않는다. 커밋은 작업 단계이고, 변경 로그는 사용자에게 의미 있는 차이다.

### 커밋 규약으로 자동화 (Conventional Commits)

```
feat(api): add retry option          → MINOR
fix: handle empty input              → PATCH
feat(api)!: drop timeoutMs option    → MAJOR (! 또는 BREAKING CHANGE: 푸터)
```

커밋 타입으로 다음 버전과 변경 로그 초안을 기계적으로 만들 수 있다. 다만 초안은 사람이 다듬는다.

## 언제 쓰나

- 다른 사람이 의존하는 라이브러리, SDK, 공개 API, CLI
- 내부 패키지라도 여러 팀이 소비한다면

## 주의

- "호환되지 않는 변경"의 판단은 사람 몫이다. 버그 수정이 누군가에게는 동작 변경이다. 애매하면 MAJOR 쪽으로 판단하거나 변경 로그에 명확히 적는다.
- MAJOR 를 자주 올리는 것은 문제의 신호다. 공개 API 범위를 좁히고 확장 지점을 설계한다.
- 운영 버전이 하나인 웹 서비스에는 SemVer 의 의미가 약하다. 날짜·커밋 해시 기반 버전(CalVer 등)이 더 실용적일 수 있다.
- 실수로 호환성을 깬 MINOR 를 냈다면, 그 버전을 수정하지 말고 호환성을 복구하는 PATCH 를 내고 변경 로그에 알린다.
