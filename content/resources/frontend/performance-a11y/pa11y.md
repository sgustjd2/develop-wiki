---
name: Pa11y
url: https://pa11y.org
docs: https://github.com/pa11y/pa11y
repo: https://github.com/pa11y/pa11y
stars: 4602
domain: frontend
category: performance-a11y
description: 헤드리스 Chrome으로 페이지를 열어 접근성 문제를 검사하는 명령줄·Node 도구. pa11y-ci로 여러 URL을 CI에서 일괄 검사한다.
pricing: oss
tags: [accessibility, wcag, cli, ci]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Pa11y는 Puppeteer로 헤드리스 Chrome을 띄워 URL을 열고, HTML_CodeSniffer(`htmlcs`, 기본) 또는 axe-core(`axe`) 러너로 접근성 문제를 찾아 오류·경고·알림으로 보고하는 도구다. 테스트 코드를 쓰지 않고 URL만으로 검사할 수 있고, 로그인·클릭 같은 사전 동작을 문자열 "액션"으로 지정할 수 있다. 여러 페이지를 설정 파일로 묶어 CI에서 돌리는 `pa11y-ci`가 함께 관리된다. 이 문서는 **Pa11y 10** 기준이다(npm `pa11y` `latest` 10.0.0, LGPL-3.0, Node.js 22.13 이상의 짝수 버전, Puppeteer 25).

## 설치
```bash
npm install -g pa11y                       # CLI
pa11y https://example.com                  # 기본: WCAG2AA, htmlcs 러너
pa11y --runner axe --runner htmlcs https://example.com
pa11y --reporter json https://example.com > report.json

npm install -D pa11y-ci                    # 여러 URL 일괄 검사
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `standard` | `WCAG2A`, `WCAG2AA`(기본), `WCAG2AAA`(htmlcs 러너에서만) |
| `runners` | `htmlcs`(기본), `axe`. 둘을 함께 쓰면 탐지 범위가 넓어진다 |
| 결과 유형 | `error`, `warning`, `notice`. CLI는 `--level`로 실패 기준 결정 |
| `threshold` | CLI에서 허용할 문제 수. 초과하면 종료 코드 2 |
| `actions` | `'click element #tab'`, `'set field #email to ...'`, `'wait for path to be /home'` 등 사전 동작 |
| `ignore` / `hideElements` | 특정 규칙 코드 무시 / 검사에서 제외할 요소 선택자 |
| reporter | `cli`(기본), `json`, `csv`, 그 외 HTML 등 별도 리포터 |

## 기본 사용법
Node API(ESM):

```js
import pa11y from 'pa11y';

const results = await pa11y('http://localhost:3000/checkout', {
  standard: 'WCAG2AA',
  runners: ['axe', 'htmlcs'],
  actions: ['click element #open-coupon', 'wait for element #coupon-form to be visible'],
  hideElements: '#third-party-chat',
});

const errors = results.issues.filter((i) => i.type === 'error');
for (const e of errors) console.log(`${e.code}\n  ${e.selector}\n  ${e.message}`);
process.exitCode = errors.length ? 1 : 0;
```

`pa11y-ci`는 `.pa11yci` 파일에 `{ "defaults": { "standard": "WCAG2AA" }, "urls": ["http://localhost:3000/", "http://localhost:3000/login"] }`처럼 URL 목록을 두고 `npx pa11y-ci`로 실행한다.

## 자주 쓰는 패턴
- **배포 전 일괄 검사.** 스테이징 사이트의 주요 URL을 `pa11y-ci`로 검사하고, 사이트맵을 넘겨(`--sitemap`) 전체 페이지를 훑는다.
- **두 러너 병행.** htmlcs와 axe는 잡는 문제가 일부 다르다. 기준선을 정할 때 둘 다 돌려 본다.
- **점진적 도입.** 기존 사이트는 `threshold`로 현재 오류 수를 허용치로 잡고 조금씩 낮춘다.
- **동적 상태 검사.** 모달·탭처럼 상호작용 후 보이는 영역은 `actions`로 상태를 만든 뒤 검사한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 테스트 코드 없이 URL 목록만으로 접근성 회귀를 CI에서 막고 싶을 때, 정적 사이트·CMS 페이지를 대량 점검할 때.
- 피할 때(대안): 이미 Playwright·Cypress 테스트가 있으면 그 안에서 [axe-core](/develop-wiki/frontend/performance-a11y/axe-core/) 통합을 쓰는 편이 상태 제어가 쉽다. 성능까지 함께 보려면 [Lighthouse](/develop-wiki/frontend/performance-a11y/lighthouse/).

## 공식 문서
- [README(설정·액션·API)](https://github.com/pa11y/pa11y) · [pa11y-ci](https://github.com/pa11y/pa11y-ci) · [프로젝트 사이트](https://pa11y.org)
- [CHANGELOG](https://github.com/pa11y/pa11y/blob/main/CHANGELOG.md)
