---
name: SwiftLint
url: https://realm.github.io/SwiftLint/
docs: https://realm.github.io/SwiftLint/
repo: https://github.com/realm/SwiftLint
stars: 19801
domain: mobile
category: ios
description: Swift 코드 스타일·관례를 검사하고 일부를 자동 수정하는 린터. .swiftlint.yml 로 규칙을 켜고 끄며 Xcode 빌드 단계나 CI 에서 실행한다.
pricing: oss
tags: [lint, code-style, static-analysis, ci]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
SwiftLint 는 SwiftSyntax 로 소스를 분석해 규칙 위반을 경고·오류로 보고하는 린터다. 규칙 수십 개가 기본으로 켜지고, `opt_in_rules` 로 추가하며, 정규식 기반 `custom_rules` 로 팀 규칙을 만들 수 있다. 서식 변환은 포맷터(swift-format, SwiftFormat)의 영역이고 SwiftLint 는 검사가 중심이다(`--fix` 로 일부만 자동 수정).

- 최신 릴리스 **0.65.1**(2026-08-21), MIT.

## 설치
```bash
brew install swiftlint
swiftlint version
```
SwiftPM 빌드 도구 플러그인(저장소 `SimplyDanny/SwiftLintPlugins`)이나 Mint, 직접 바이너리 다운로드도 가능하다. 팀 전체 버전을 맞추려면 플러그인·바이너리 고정 방식을 권한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 규칙(rule) | `line_length`, `force_cast`, `trailing_whitespace` 등. 위반 시 warning/error |
| `disabled_rules` / `opt_in_rules` | 기본 규칙 끄기 / 선택 규칙 켜기 |
| `.swiftlint.yml` | 프로젝트 루트 설정. 하위 폴더에 두면 중첩 설정 |
| `included` / `excluded` | 검사 경로 지정(예: `Pods`, `.build` 제외) |
| `custom_rules` | 정규식으로 만드는 사용자 규칙 |
| 인라인 비활성화 | `// swiftlint:disable:next force_cast` |

## 기본 사용법
```yaml
# .swiftlint.yml
excluded: [Pods, .build, Generated]
disabled_rules: [todo]
opt_in_rules: [empty_count, closure_spacing]
line_length:
  warning: 120
  error: 160
custom_rules:
  no_print:
    name: "print 금지"
    regex: '\bprint\('
    message: "로거를 사용하세요"
    severity: warning
```
```bash
swiftlint            # 현재 폴더 검사
swiftlint --fix      # 자동 수정 가능한 규칙 적용
swiftlint --strict   # 경고도 실패로 처리 (CI)
```

## 자주 쓰는 패턴
- **Xcode 빌드 단계.** Run Script 에 `swiftlint` 실행을 넣어 편집기에 경고를 표시한다. 설치 여부를 먼저 확인하는 분기를 둔다.
- **CI 게이트.** `swiftlint --strict --reporter github-actions-logging` 처럼 리포터를 지정한다.
- **점진 도입.** 기존 코드의 위반이 많으면 신규 규칙은 warning 으로 시작하고 `excluded` 범위를 단계적으로 줄인다.
- **분석 규칙.** `analyzer_rules`(unused_import 등)는 컴파일 로그가 필요해 `swiftlint analyze` 로 따로 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 사람이 쓰는 Swift 저장소의 스타일·안전 규칙 통일.
- 피할 때(대안): 서식 자동 정렬이 목적이면 swift-format/SwiftFormat. 1인 소규모 프로젝트는 과할 수 있다.

## 공식 문서
- [규칙 목록](https://realm.github.io/SwiftLint/rule-directory.html) · [GitHub README](https://github.com/realm/SwiftLint)
