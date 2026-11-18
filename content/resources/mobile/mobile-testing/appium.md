---
name: Appium
url: https://appium.io
docs: https://appium.io/docs/en/latest/
repo: https://github.com/appium/appium
stars: 22239
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

- 이 문서는 **Appium 4.0.0**(npm `latest`, 2026-11-15 발행) 기준이다. 직전 3.x 마지막은 3.9.1이다. 패키지 `engines`는 Node `^22.22.2 || ^24.15.0 || >=26.0.0`이다. 4.0은 출시 직후라 [공식 마이그레이션 가이드("Migrating to Appium 4")](https://appium.io/docs/en/latest/)로 변경점을 확인하고 도입한다. Apache-2.0.
- 대안: 앱 내부에서 동작하는 [Espresso](/develop-wiki/mobile/mobile-testing/espresso/)(Android), [XCTest](/develop-wiki/mobile/mobile-testing/xctest/)(iOS)는 더 빠르고 안정적이지만 플랫폼별로 따로 작성한다. 선언형 YAML은 [Maestro](/develop-wiki/mobile/mobile-testing/maestro/), React Native는 [Detox](/develop-wiki/mobile/mobile-testing/detox/).

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
