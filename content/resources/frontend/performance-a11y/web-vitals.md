---
name: web-vitals
url: https://web.dev/articles/vitals
docs: https://github.com/GoogleChrome/web-vitals
repo: https://github.com/GoogleChrome/web-vitals
stars: 8700
domain: frontend
category: performance-a11y
description: 실제 사용자 브라우저에서 LCP·INP·CLS 등 Core Web Vitals를 Chrome 도구와 같은 방식으로 측정하는 Google의 작은 JavaScript 라이브러리.
pricing: oss
tags: [performance, web-vitals, rum, monitoring]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
web-vitals는 실제 사용자 세션에서 Core Web Vitals(LCP, INP, CLS)와 보조 지표(FCP, TTFB)를 측정해 콜백으로 넘겨주는 라이브러리다(약 2KB 수준). Chrome·CrUX·PageSpeed Insights와 같은 정의로 계산하도록 Chrome 팀이 관리하므로, 직접 `PerformanceObserver`로 구현할 때 생기는 측정 차이를 피할 수 있다. 결과를 분석 서버로 보내 RUM(실사용자 모니터링)을 만드는 데 쓴다. 이 문서는 **v6** 기준이다(npm `web-vitals` `latest` 6.2.3, Apache-2.0). v6은 브라우저가 지원하면 SPA의 소프트 내비게이션(라우트 전환)별 지표 보고를 추가했다.

- [Lighthouse](/develop-wiki/frontend/performance-a11y/lighthouse/)가 실험실 측정이라면 web-vitals는 필드(실사용) 측정이다. 둘을 함께 쓴다.

## 설치
```bash
npm install web-vitals
```

원인 분석 정보가 필요하면 `web-vitals/attribution` 빌드를 import한다(용량이 조금 더 크다).

## 핵심 개념
| 지표 | 의미 | "좋음" 기준 |
| --- | --- | --- |
| LCP (Largest Contentful Paint) | 가장 큰 콘텐츠가 그려진 시점 — 로딩 | 2.5초 이하 |
| INP (Interaction to Next Paint) | 클릭·탭·키 입력 후 다음 화면 갱신까지 지연 — 반응성 | 200ms 이하 |
| CLS (Cumulative Layout Shift) | 예상치 못한 레이아웃 이동 누적 — 시각 안정성 | 0.1 이하 |
| FCP / TTFB | 첫 콘텐츠 표시 / 서버 첫 바이트 — 진단용 보조 지표 | — |

| API | 설명 |
| --- | --- |
| `onLCP` / `onINP` / `onCLS` / `onFCP` / `onTTFB` | 지표가 보고 가능해지면 `metric` 객체로 콜백 호출 |
| `metric` | `name`, `value`, `rating`(`good`/`needs-improvement`/`poor`), `delta`, `id`, `navigationType` |
| `reportAllChanges` | 값이 바뀔 때마다 보고 (디버깅용) |
| `reportSoftNavs` | v6, 지원 브라우저에서 소프트 내비게이션마다 지표를 따로 보고 |
| attribution 빌드 | `metric.attribution`에 LCP 요소·지연 원인, INP 대상 요소·처리 시간 분해 등 |

## 기본 사용법
```ts
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

function send(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    page: location.pathname,
  });
  navigator.sendBeacon('/analytics/vitals', body); // 페이지가 닫히는 중에도 전송
}

onCLS(send);
onINP(send);
onLCP(send);
```

## 자주 쓰는 패턴
- **한 번만 등록.** `onXXX`는 페이지당 한 번 호출한다. 반복 호출하면 관찰자가 계속 늘어난다.
- **콜백이 여러 번·안 올 수 있음.** CLS·INP는 탭이 숨겨질 때마다, bfcache 복원 후 다시 보고된다. 상호작용이 없으면 INP는 보고되지 않는다. 서버에서는 `id`로 묶어 마지막 값을 쓴다.
- **원인 수집.** `import { onINP } from 'web-vitals/attribution'`으로 느린 상호작용의 대상 요소·입력 지연·처리 시간을 함께 보내면 개선 우선순위를 정하기 쉽다.
- **분포로 보기.** 평균 대신 75퍼센타일(p75)로 집계한다. Google의 Core Web Vitals 판정도 p75 기준이다.

## 언제 쓰나 / 피할 때
- 쓸 때: 상용 서비스의 실사용 성능을 자체 분석 도구나 GA4 등으로 수집하고, 배포 후 회귀를 감지할 때.
- 피할 때(대안): 이미 RUM 기능이 있는 APM·분석 SaaS를 쓰면 중복일 수 있다(이들 상당수가 내부적으로 같은 정의를 따른다). 개발 중 원인 분석은 [Lighthouse](/develop-wiki/frontend/performance-a11y/lighthouse/)와 DevTools Performance 패널.

## 공식 문서
- [GitHub README(API)](https://github.com/GoogleChrome/web-vitals) · [Web Vitals 소개](https://web.dev/articles/vitals) · [INP 설명](https://web.dev/articles/inp)
- [CHANGELOG](https://github.com/GoogleChrome/web-vitals/blob/main/CHANGELOG.md)
