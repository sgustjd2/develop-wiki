---
name: Appium
url: https://appium.io
docs: https://appium.io/docs/en/latest/
repo: https://github.com/appium/appium
stars: 22241
domain: mobile
category: mobile-testing
description: WebDriver 프로토콜로 iOS·Android(및 데스크톱) 앱을 자동화하는 오픈소스 크로스플랫폼 UI 테스트 서버. 드라이버(UiAutomator2, XCUITest 등)를 설치해 쓰며 클라이언트는 여러 언어를 지원한다.
pricing: oss
tags: [ui-test, webdriver, e2e, cross-platform, automation]
languages: [typescript, java, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Appium은 HTTP 서버로 동작하며, 테스트 코드는 WebDriver 프로토콜로 요청을 보내고 Appium이 플랫폼별 **드라이버**(Android는 UiAutomator2, iOS는 XCUITest)를 통해 실제 앱을 조작한다. 앱 코드를 수정하거나 테스트용 SDK를 넣지 않고, 네이티브·하이브리드·모바일 웹을 같은 API로 자동화한다는 점이 특징이다.

- 이 문서는 **Appium 4.0.0**(npm `latest`, 2026-11-15 발행) 기준이다. 직전 3.x 마지막은 3.9.1(2026-11-14)이다. 패키지 `engines`는 Node `^22.22.2 || ^24.15.0 || >=26.0.0`, npm `>=10`이다. Apache-2.0.
- 3→4 변경점은 아래 "Appium 3 → 4 마이그레이션" 절에 정리했다. 원문은 [Migrating to Appium 4](https://appium.io/docs/en/latest/guides/migrating-3-to-4/).
- 대안: 앱 내부에서 동작하는 [Espresso](/develop-wiki/mobile/mobile-testing/espresso/)(Android), [XCTest](/develop-wiki/mobile/mobile-testing/xctest/)(iOS)는 더 빠르고 안정적이지만 플랫폼별로 따로 작성한다. 선언형 YAML은 [Maestro](/develop-wiki/mobile/mobile-testing/maestro/), React Native는 [Detox](/develop-wiki/mobile/mobile-testing/detox/).

## Appium 3 → 4 마이그레이션
공식 마이그레이션 가이드 기준 주요 변경이다. 업그레이드 전에 서버 인자·클라이언트 코드·플러그인·드라이버를 점검한다.

| 영역 | 변경 |
| --- | --- |
| 런타임 | Node 20 지원 중단(22.22.2+ / 24.15+ / 26+). 모든 패키지가 ESM 전용이라 `require()` 사용 불가 |
| 프로토콜 | JSONWP/MJSONWP 내부 제거(의존하는 드라이버는 비호환). 폐기 엔드포인트 12개 제거, 나머지 7개(주로 컨텍스트 관리)는 다음 메이저에서 제거 예정 |
| 서버 | SPDY·HTTP/2 제거(TLS 는 HTTP/1.1 HTTPS), Selenium Grid 3 허브·`--nodeconfig` 제거(Grid 4 는 유지), npm postinstall 드라이버 설치 훅 제거 |
| CLI | `--allow-cors` 는 `--allow-insecure=*:cors` 또는 `--relaxed-security` 로 대체, 기본 로그 레벨 `info`, `driver`/`plugin`/`setup` 의 비오류 출력이 stdout 으로 이동 |
| 제거된 인자 | `--callback-address`, `--callback-port`, `--debug-log-spacing`, `--shell`, `--strict-caps`, `--trace-dir`, 캡빌리티 `appium:eventTimings` |
| 클라이언트 | `Origin` 헤더가 있는 상태 변경 요청은 CORS 비활성 시 403, POST 본문은 JSON 객체여야 함(빈 본문·`[]` 는 400), 캡빌리티 이름은 대소문자 구분, `GET /` 는 404 |
| 드라이버 | Windows 드라이버 미지원 → WinCore 드라이버(`appium driver install wincore`)로 이전 |
| 플러그인 | `Plugin#logger` → `Plugin#log`, `@appium/base-plugin` 기본 export 제거 |

Windows 드라이버를 쓰는 경우 공식 순서는 Appium 3 에서 `appium-wincore-driver@3` 설치 → 테스트 이전 → 기존 Windows 드라이버 제거 → Appium 4 로 업그레이드 → `appium driver update wincore --unsafe` 다. 스크립트가 CLI 출력을 stderr 로 가정했다면 stdout 이동에 맞게 고친다.

## 설치
```bash
npm install -g appium      # 공식 문서는 npm 외 패키지 매니저를 지원하지 않는다고 안내
appium driver install uiautomator2   # Android
appium driver install xcuitest       # iOS (macOS + Xcode 필요)
appium                      # 서버 시작, 기본 http://127.0.0.1:4723
```
Android는 Android SDK와 에뮬레이터/기기, iOS는 Xcode 환경이 필요하다. 드라이버는 Appium 본체에 포함되어 있지 않다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 서버 / 드라이버 / 플러그인 | 서버가 요청 중계, 드라이버가 플랫폼 제어, 플러그인이 기능 확장 |
| Capabilities | 세션 설정(`platformName`, `appium:automationName`, `appium:app` 등) |
| Locator | accessibility id(`~id`), id, xpath, class chain, UiSelector, predicate |
| 세션 | 앱 실행~종료까지의 WebDriver 세션 |
| 클라이언트 | WebdriverIO, Java, Python, Ruby, C# 등 언어별 라이브러리 |
| Appium Inspector | 앱 화면 요소 트리를 보며 locator를 찾는 GUI 도구 |
| 클라우드 | BrowserStack·Sauce Labs 등 서비스는 Appium 서버를 제공 |

## 기본 사용법
WebdriverIO(TypeScript)로 로그인 시나리오를 실행하는 예다(`npm i webdriverio`).

```ts
import { remote } from 'webdriverio';

const driver = await remote({
  hostname: '127.0.0.1',
  port: 4723,
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:app': '/path/to/app-debug.apk',
  },
});

await driver.$('~email').setValue('user@example.com');   // accessibility id
await driver.$('~login').click();
await driver.$('~welcome').waitForDisplayed({ timeout: 10000 });
await driver.deleteSession();
```
`email`·`login`·`welcome`은 앱의 접근성 식별자로 가정한 값이다.

## 자주 쓰는 패턴
- **접근성 ID 우선**: 앱에 `contentDescription`/`accessibilityIdentifier`를 달면 두 플랫폼에서 같은 locator를 쓸 수 있다.
- **Page Object**: 화면별 클래스로 locator와 동작을 묶어 유지보수성을 높인다.
- **명시적 대기**: `waitForDisplayed`처럼 조건 대기를 쓰고 고정 sleep은 피한다.
- **CI 실행**: 에뮬레이터/시뮬레이터를 띄운 뒤 `appium` 서버를 백그라운드로 실행하거나 클라우드 기기팜을 사용한다.
- **XPath 최소화**: XPath는 느리고 깨지기 쉬우므로 플랫폼 전용 selector를 우선한다.

## 언제 쓰나 / 피할 때
- 쓸 때: iOS·Android를 같은 테스트 코드로 검증, 블랙박스 E2E, 여러 언어·기존 Selenium 자산을 활용할 때.
- 피할 때(대안): 속도·안정성이 중요한 빠른 UI 테스트(Espresso·XCTest), 설정 부담을 줄이고 싶은 소규모 팀(Maestro).

## 공식 문서
- [Appium 문서](https://appium.io/docs/en/latest/) · [설치 가이드](https://appium.io/docs/en/latest/quickstart/install/) · [저장소](https://github.com/appium/appium)
