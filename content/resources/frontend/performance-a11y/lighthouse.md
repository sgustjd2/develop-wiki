---
name: Lighthouse
url: https://developer.chrome.com/docs/lighthouse/overview
docs: https://developer.chrome.com/docs/lighthouse/overview
repo: https://github.com/GoogleChrome/lighthouse
stars: 31180
domain: frontend
category: performance-a11y
description: 웹 페이지의 성능·접근성·모범 사례·SEO를 실험실 환경에서 측정하고 개선 항목을 알려 주는 Google의 자동 감사 도구. Chrome DevTools, CLI, Node API로 쓴다.
pricing: oss
tags: [performance, accessibility, audit, web-vitals, ci]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Lighthouse는 페이지를 Chrome으로 불러와 정해진 조건(기기·네트워크 에뮬레이션)에서 측정한 뒤 **성능, 접근성, 모범 사례, SEO** 네 범주를 0~100점으로 채점하고, 점수를 깎은 원인과 개선 방법을 보고서로 보여 주는 도구다. Chrome DevTools의 Lighthouse 패널과 PageSpeed Insights가 같은 엔진을 쓴다. 이 문서는 **Lighthouse 13** 기준이다(npm `lighthouse` `latest` 13.6.0, Apache-2.0, CLI는 Node.js 22.19 이상). v13은 기존 성능 감사 다수를 DevTools Performance 패널과 같은 "Insights" 감사로 대체하고 몇몇 오래된 감사를 제거했다.

- Lighthouse는 **실험실(lab) 데이터**다. 실제 사용자 환경의 지표(필드 데이터)는 [web-vitals](/develop-wiki/frontend/performance-a11y/web-vitals/)로 수집하거나 CrUX를 본다.

## 설치·실행
```bash
# 가장 쉬운 방법: Chrome DevTools → Lighthouse 패널 → 페이지 분석
npx lighthouse https://example.com --view                       # CLI, HTML 보고서 열기
npx lighthouse https://example.com --only-categories=performance,accessibility --output=json --output-path=./report.json
npx lighthouse https://example.com --preset=desktop             # 데스크톱 기준 (기본은 모바일 에뮬레이션)
```

웹에서는 [PageSpeed Insights](https://pagespeed.web.dev/)에 URL을 넣으면 Lighthouse 결과와 CrUX 필드 데이터를 함께 볼 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 범주 | Performance, Accessibility, Best Practices, SEO |
| 성능 지표 | FCP, LCP, TBT(Total Blocking Time), CLS, Speed Index를 가중 합산해 성능 점수 산출 |
| TBT | 실험실에서는 사용자 입력이 없어 INP 대신 메인 스레드 차단 시간을 측정 |
| 스로틀링 | 기본은 중급 모바일 기기 + 느린 4G에 해당하는 시뮬레이션 |
| Insights | v13의 성능 진단 항목. LCP 분해, 렌더 차단 요청, 캐시 정책 등 |
| 접근성 감사 | axe-core 규칙 기반 자동 검사. 수동 검사가 필요한 항목은 별도 표시 |
| 모드 | Navigation(페이지 로드), Timespan(상호작용 구간), Snapshot(현재 상태) |
| 출력 | HTML, JSON, CSV. JSON은 Lighthouse Viewer에서 다시 열 수 있음 |

## 기본 사용법
Node에서 프로그램으로 실행(ESM):

```js
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
const result = await lighthouse('https://example.com', {
  port: chrome.port,
  onlyCategories: ['performance', 'accessibility'],
  output: 'json',
});
for (const [id, cat] of Object.entries(result.lhr.categories)) console.log(id, Math.round(cat.score * 100));
await chrome.kill();
```

## 자주 쓰는 패턴
- **여러 번 측정.** 점수는 네트워크·CPU 상태에 따라 흔들린다. 같은 조건에서 3~5회 측정해 중앙값을 본다.
- **시크릿 창에서 실행.** DevTools에서 측정할 때 확장 프로그램이 결과를 왜곡하지 않도록 시크릿 창이나 별도 프로필을 쓴다.
- **CI 회귀 방지.** Lighthouse CI(`@lhci/cli`)로 PR마다 측정하고 `assert`로 점수·지표 예산을 강제한다.
- **점수보다 지표.** 점수 자체보다 LCP·CLS·TBT 수치와 Insights가 지목한 원인(큰 이미지, 렌더 차단 스크립트)을 고친다.
- **접근성 100점의 한계.** 자동 검사는 일부 문제만 잡는다. 키보드 탐색·스크린 리더 확인은 수동으로 한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 배포 전 페이지 성능·접근성의 기본 점검, 성능 개선 작업의 전후 비교, CI 성능 예산 관리.
- 피할 때(대안): 실제 사용자 경험의 판단 근거로는 부족하다. 필드 데이터는 [web-vitals](/develop-wiki/frontend/performance-a11y/web-vitals/), 접근성 상세 검사는 [axe-core](/develop-wiki/frontend/performance-a11y/axe-core/)·[Pa11y](/develop-wiki/frontend/performance-a11y/pa11y/).

## 공식 문서
- [개요](https://developer.chrome.com/docs/lighthouse/overview) · [Lighthouse 13 발표](https://developer.chrome.com/blog/lighthouse-13-0) · [저장소 문서](https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md)
- [설정](https://github.com/GoogleChrome/lighthouse/blob/main/docs/configuration.md) · [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) · [PageSpeed Insights](https://pagespeed.web.dev/)
