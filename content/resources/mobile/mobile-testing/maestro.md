---
name: Maestro
url: https://maestro.dev
docs: https://docs.maestro.dev
repo: https://github.com/mobile-dev-inc/Maestro
stars: 16479
domain: mobile
category: mobile-testing
description: YAML로 사용자 흐름을 적어 실행하는 모바일·웹 UI 자동화 도구. iOS·Android 네이티브와 React Native·Flutter 앱을 같은 문법으로 블랙박스 테스트할 때 쓴다.
pricing: oss
tags: [e2e, ui-testing, yaml, black-box]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Maestro는 앱 내부 코드에 의존하지 않고 화면의 텍스트·접근성 ID를 보고 조작하는 **블랙박스 E2E 테스트** 도구다. 테스트(Flow)는 짧은 YAML 명령 목록이고, 요소가 나타날 때까지 자동으로 기다리며 재시도하므로 명시적 대기 코드가 거의 필요 없다. 같은 Flow 문법으로 iOS 시뮬레이터, Android 에뮬레이터·기기, 웹을 다룬다.

- 최신 CLI **2.12.1**(2026-11-02). Apache-2.0. 클라우드 실행(Maestro Cloud)과 GUI 편집기 **Maestro Studio**(Windows·macOS·Linux 데스크톱 앱)는 별도 제공.
- 요구 사항: Java 17 이상.

## 설치
```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
# 또는 Homebrew
brew tap mobile-dev-inc/tap
brew install mobile-dev-inc/tap/maestro

maestro --version
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Flow | 하나의 사용자 시나리오 YAML 파일. 상단에 `appId`, `---` 아래에 명령 목록 |
| `launchApp` | 앱 실행. `clearState: true`로 데이터 초기화 |
| `tapOn` | 텍스트·`id`·좌표로 요소 탭 |
| `inputText` / `eraseText` | 포커스된 필드에 입력 / 삭제 |
| `assertVisible` / `assertNotVisible` | 화면 요소 존재 검증 |
| `scrollUntilVisible` | 요소가 보일 때까지 스크롤 |
| `runFlow` | 다른 Flow 재사용(로그인 등 공통 단계) |
| 환경 변수 | `${USERNAME}`처럼 참조하고 `-e USERNAME=...`로 주입 |
| `takeScreenshot` | 단계별 스크린숏 저장 |

## 기본 사용법
```yaml
# flows/login.yaml
appId: com.example.shop
---
- launchApp:
    clearState: true
- tapOn:
    id: "login.email"
- inputText: ${EMAIL}
- tapOn:
    id: "login.password"
- inputText: ${PASSWORD}
- tapOn: "로그인"
- assertVisible: "추천 상품"
- takeScreenshot: home
```

```bash
maestro test -e EMAIL=kim@example.com -e PASSWORD=pass1234 flows/login.yaml
maestro test flows/            # 디렉터리 안 Flow 전체
maestro studio                 # 화면 요소 탐색·명령 작성 도우미
```

## 자주 쓰는 패턴
- **식별자 기반 선택.** 문구는 번역·카피 수정으로 자주 바뀌므로 핵심 요소에는 접근성 ID(`testID`, `accessibilityIdentifier`, `Modifier.testTag` + `testTagsAsResourceId`)를 붙이고 `id:`로 찾는다.
- **공통 단계 분리.** 로그인·온보딩 건너뛰기를 `subflows/`로 빼고 `runFlow`로 재사용한다.
- **태그로 묶기.** Flow에 `tags: [smoke]`를 달고 `maestro test --include-tags smoke`로 CI에서 일부만 돌린다.
- **CI.** 에뮬레이터·시뮬레이터를 띄운 러너에서 `maestro test --format junit`으로 결과를 수집한다. Expo는 EAS 워크플로에서 Maestro를 지원한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 크로스플랫폼 앱의 스모크·회귀 E2E, QA·비개발자도 읽고 고칠 수 있는 테스트, 플랫폼별 테스트 코드를 두 벌 유지하기 싫을 때.
- 피할 때(대안): 앱 내부 상태를 조작·검증하는 세밀한 테스트는 [XCTest/XCUITest](/develop-wiki/mobile/mobile-testing/xctest/)·[Espresso](/develop-wiki/mobile/mobile-testing/espresso/). React Native 앱에서 JS 비동기와 동기화가 중요하면 [Detox](/develop-wiki/mobile/mobile-testing/detox/).

## 공식 문서
- [Maestro 문서](https://docs.maestro.dev) · [CLI 설치](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli) · [명령 레퍼런스](https://docs.maestro.dev/reference/)
- [GitHub 릴리스](https://github.com/mobile-dev-inc/Maestro/releases)
