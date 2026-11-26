---
name: Detox
url: https://wix.github.io/Detox/
docs: https://wix.github.io/Detox/docs/introduction/getting-started
repo: https://github.com/wix/Detox
stars: 12056
domain: mobile
category: mobile-testing
description: React Native 앱용 그레이박스 E2E 테스트 프레임워크. 앱의 JS·네트워크·애니메이션이 유휴 상태가 될 때까지 자동 동기화한 뒤 시뮬레이터·에뮬레이터에서 UI를 조작한다.
pricing: oss
tags: [e2e, react-native, gray-box, jest]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Detox는 Wix가 만든 모바일 E2E 테스트 프레임워크로, 테스트 러너(Jest)가 Node.js에서 돌고 앱 안에 심은 네이티브 계층(iOS: EarlGrey 기반, Android: Espresso 기반)이 조작을 수행한다. 앱 내부의 진행 중인 네트워크 요청·타이머·애니메이션·RN 브리지 작업을 추적해 **앱이 한가해질 때 다음 단계를 실행**하는 그레이박스 방식이라 대기 코드 없이도 흔들림이 적다.

- 최신 안정판 **20.51.4**(npm, 2026-10 배포). 21.0은 알파 단계. MIT.
- 주 대상은 [React Native](/develop-wiki/mobile/cross-platform/react-native/) 앱(네이티브 앱도 가능하지만 사례가 적다). 언어는 [TypeScript](/develop-wiki/languages/typescript/)/JavaScript.

## 설치
```bash
npm install --save-dev detox jest
npx detox init            # e2e/jest.config.js, e2e/starter.test.js, .detoxrc.js 생성
```

`.detoxrc.js`에 앱 빌드 명령·바이너리 경로·기기(시뮬레이터 이름, AVD 이름)를 적고, Android는 `android/app/build.gradle`에 테스트 러너와 `androidTestImplementation('com.wix:detox:+')` 설정, `DetoxTest` 클래스를 추가한다(공식 Project Setup 문서 절차).

```bash
npx detox build --configuration ios.sim.debug
npx detox test  --configuration ios.sim.debug
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Configuration | 앱(빌드 결과물) + 기기 조합. `ios.sim.debug`, `android.emu.release` 등 |
| `device` | 앱 실행·재시작(`launchApp`, `reloadReactNative`), 권한, URL 열기, 회전 |
| `element(matcher)` | `by.id()`(권장, `testID`), `by.text()`, `by.label()` |
| Action | `tap()`, `typeText()`, `replaceText()`, `scroll()`, `swipe()` |
| `expect(...)` | `toBeVisible()`, `toHaveText()`, `toExist()` |
| `waitFor` | 동기화 밖 상황(무한 애니메이션 등)에서 조건 대기 |
| Synchronization | 앱 유휴 상태 자동 대기. 필요시 URL 블랙리스트·동기화 해제 |
| Artifacts | 실패 시 스크린숏·영상·로그 저장 |

## 기본 사용법
```ts
// e2e/login.test.ts
describe('로그인', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, permissions: { notifications: 'YES' } });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('올바른 계정으로 홈에 들어간다', async () => {
    await element(by.id('login.email')).typeText('kim@example.com');
    await element(by.id('login.password')).typeText('pass1234');
    await element(by.id('login.submit')).tap();
    await expect(element(by.id('home.title'))).toBeVisible();
  });
});
```

RN 컴포넌트에는 `<TextInput testID="login.email" />`처럼 `testID`를 붙인다.

## 자주 쓰는 패턴
- **release 빌드로 CI.** 디버그 빌드는 Metro 의존과 느린 JS로 흔들릴 수 있어 CI는 release 구성으로 돌린다.
- **동기화 예외 처리.** 폴링·웹소켓·무한 애니메이션 때문에 멈추면 `device.setURLBlacklist([...])`나 해당 구간 `waitFor(...).withTimeout()`을 쓴다.
- **목 서버.** 런치 인수(`launchArgs`)로 테스트용 API 주소를 넘겨 외부 의존을 없앤다.
- **실패 진단.** `--record-videos failing --take-screenshots failing`.

## 언제 쓰나 / 피할 때
- 쓸 때: React Native 앱에서 JS 비동기와 정확히 맞물리는 안정적인 E2E가 필요할 때, 테스트를 TypeScript·Jest로 쓰고 싶을 때.
- 피할 때(대안): 설정 부담이 크게 느껴지거나 Flutter·네이티브까지 같은 방식으로 테스트하려면 [Maestro](/develop-wiki/mobile/mobile-testing/maestro/). 실기기 클라우드 위주 운영은 Appium 계열이 선택지가 많다.

## 공식 문서
- [시작하기](https://wix.github.io/Detox/docs/introduction/getting-started) · [Project Setup](https://wix.github.io/Detox/docs/introduction/project-setup) · [API](https://wix.github.io/Detox/docs/api/device)
- [GitHub 릴리스](https://github.com/wix/Detox/releases)
