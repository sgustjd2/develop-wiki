---
title: Core Web Vitals (LCP·INP·CLS)
aka: [Core Web Vitals, CWV, LCP, INP, CLS, Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift]
category: performance
level: beginner
summary: 구글이 정의한 사용자 체감 웹 성능 지표 셋(로딩 LCP, 반응성 INP, 시각 안정성 CLS)의 기준값, 측정 방법, 그리고 지표별 주요 개선 지점.
tags: [web-performance, frontend, lcp, inp, cls, lighthouse, crux]
related: [performance/profiling, performance/caching-strategies]
sources:
  - https://web.dev/articles/vitals
  - https://web.dev/articles/lcp
  - https://web.dev/articles/inp
  - https://web.dev/articles/cls
updatedAt: 2026-11-18
---

## 문제

"페이지 로드 시간" 하나로는 사용자가 느끼는 느림을 설명하지 못한다. 첫 화면은 빨리 떴는데 버튼을 눌러도 반응이 없거나, 읽으려는 순간 광고가 끼어들어 글이 밀린다. Core Web Vitals 는 이 체감을 세 가지 숫자로 나눈다.

## 지표와 기준

| 지표 | 측정 대상 | 좋음 | 개선 필요 | 나쁨 |
| --- | --- | --- | --- | --- |
| LCP | 로딩: 뷰포트에서 가장 큰 이미지·텍스트 블록이 그려진 시점 | ≤ 2.5초 | 2.5~4.0초 | > 4.0초 |
| INP | 반응성: 사용자 상호작용 후 다음 화면이 그려지기까지의 지연(페이지 전체 기간 중 대표값) | ≤ 200ms | 200~500ms | > 500ms |
| CLS | 시각 안정성: 예상치 못한 레이아웃 이동 점수의 최대 세션 윈도 합 | ≤ 0.1 | 0.1~0.25 | > 0.25 |

- 판정은 실제 사용자 페이지 로드의 **75번째 백분위**, 모바일·데스크톱을 따로 본다. 세 지표가 모두 기준을 넘어야 통과.
- INP 는 2024년에 FID(첫 입력 지연)를 대체해 정식 지표가 됐다. FID 는 첫 입력의 대기만 쟀지만, INP 는 모든 상호작용의 **입력 지연 + 처리 시간 + 표시 지연**을 본다.
- CLS 는 이동들을 세션 윈도(이동 간격 1초 미만, 최대 5초)로 묶어 가장 큰 윈도 점수를 쓴다. 사용자 입력 후 500ms 안의 이동은 제외된다.

## 해법: 지표별 개선 지점

**LCP**
- 서버 응답(TTFB)을 줄인다: CDN, 캐시, 리다이렉트 제거.
- LCP 이미지를 일찍 발견하게: HTML 에 직접 `<img>`, `fetchpriority="high"`, 필요하면 `preload`. **LCP 이미지에 지연 로딩(`loading="lazy"`)을 걸지 않는다.**
- 렌더 차단 CSS·JS 줄이기, 이미지 크기·포맷 최적화.

**INP**
- 메인 스레드의 **긴 작업(50ms 이상)** 을 쪼갠다. 이벤트 핸들러는 화면 갱신에 필요한 일만 먼저 하고 나머지는 양보한다.
- 큰 렌더링(거대한 리스트, 불필요한 리렌더)을 줄인다. 서드파티 스크립트를 점검한다.

```ts
button.addEventListener('click', async () => {
  showSpinner();                                   // 1) 즉시 보이는 피드백
  await new Promise((r) => setTimeout(r, 0));      // 2) 브라우저가 먼저 그리게 양보
  // (지원 브라우저에서는 scheduler.yield() 사용 가능)
  heavyRecalculation();                            // 3) 무거운 작업은 그 뒤에
});
```

**CLS**
- 이미지·동영상에 `width`/`height`(또는 `aspect-ratio`)를 지정한다.
- 광고·임베드·늦게 오는 배너의 자리를 미리 확보한다. 기존 콘텐츠 **위에** 끼워 넣지 않는다.
- 웹 폰트 교체로 인한 이동을 줄인다(대체 폰트 크기 맞추기).
- 애니메이션은 `top`/`width` 대신 `transform` 으로.

## 측정

| 종류 | 도구 | 특징 |
| --- | --- | --- |
| 필드(실사용자) | CrUX, PageSpeed Insights, Search Console, `web-vitals` 라이브러리로 직접 수집(RUM) | 판정 기준. 실제 기기·네트워크 |
| 랩(실험실) | Lighthouse, Chrome DevTools | 재현·디버깅용. Lighthouse 는 상호작용이 없어 INP 대신 TBT 를 대리 지표로 쓴다 |

## 언제 쓰나

- 공개 웹사이트, 특히 검색 유입·전환율이 중요한 페이지. 내부 도구라도 반응성(INP)은 업무 효율에 직결된다.

## 주의 (비용)

- **랩 점수 ≠ 필드 점수.** 개발자의 빠른 PC·네트워크에서 100점이어도 중저가 모바일 사용자 75백분위는 다르다. 필드 데이터로 판단한다.
- 지표만 맞추는 꼼수(스켈레톤으로 LCP 요소 바꾸기 등)는 체감 개선 없이 숫자만 바꾼다.
- 기준값과 지표 구성은 바뀐다(FID → INP). web.dev 를 기준으로 주기적으로 확인한다.
- 세 지표는 체감 성능의 일부다. 백엔드 지연, 오류율, 접근성은 따로 본다.
