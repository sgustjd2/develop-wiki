---
title: 반응형·적응형 디자인과 컨테이너 쿼리
aka: [Responsive Design, Adaptive Design, Container Queries, Media Queries, Breakpoints, Window Size Classes, Reflow]
category: ui-ux
group: visual
level: intermediate
summary: 화면(뷰포트) 폭에 따라 페이지 골격을 바꾸는 미디어 쿼리·브레이크포인트와, 컴포넌트가 놓인 영역 크기에 따라 스스로 모양을 바꾸는 컨테이너 쿼리의 역할 분담.
tags: [responsive, layout, css, container-queries, adaptive]
related: [ui-ux/grid-spacing-system, ui-ux/typography-scale-rhythm, ui-ux/design-system-structure, cs-fundamentals/browser-rendering-pipeline]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-type
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries
  - https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
  - https://www.w3.org/TR/WCAG22/
updatedAt: 2026-11-19
---

## 문제

- 같은 카드 컴포넌트가 메인 영역(넓음)과 사이드바(좁음)에 동시에 들어간다. 뷰포트 기준 미디어 쿼리로는 "지금 이 카드가 들어간 칸의 폭"을 알 수 없다.
- 폴더블·분할 화면·데스크톱 창 크기 조절로 "기기 = 화면 크기" 가정이 깨졌다.

## 용어 정리

| 방식 | 판단 기준 | 결과 |
| --- | --- | --- |
| 반응형(responsive) | 연속적인 폭 변화 | 유동 그리드·`fr`·`clamp` 로 부드럽게 늘고 줄어듦 |
| 적응형(adaptive) | 몇 개의 크기 구간 | 구간마다 다른 레이아웃(예: 하단 탭 → 내비게이션 레일 → 사이드바) |
| 컨테이너 쿼리 | 부모 컨테이너 크기·스타일 | 컴포넌트 단위로 변형 |

실무에서는 섞어 쓴다: **페이지 골격 = 미디어 쿼리(구간)**, **컴포넌트 내부 = 컨테이너 쿼리 + 유동 단위**.

### 브레이크포인트 예: 창 크기 클래스

Android/Material 은 기기가 아니라 **앱 창** 크기로 구간을 나눈다(폭 기준).

| 클래스 | 폭(dp) |
| --- | --- |
| Compact | < 600 |
| Medium | 600 ~ 839 |
| Expanded | 840 ~ 1199 |
| Large | 1200 ~ 1599 |
| Extra-large | ≥ 1600 |

## 해법 — 컨테이너 쿼리

```css
.card-slot { container: card / inline-size; }   /* 쿼리 대상 선언 */

.card { display: grid; gap: 0.75rem; }
.card h3 { font-size: max(1rem, 0.9rem + 1.5cqi); } /* 컨테이너 폭 비례 */

@container card (width >= 28rem) {
  .card { grid-template-columns: 8rem 1fr; }     /* 넓은 칸: 가로 배치 */
}
```

- `container-type: inline-size` 는 가로 크기만 쿼리한다. `size` 는 세로도 쿼리하지만 크기 봉쇄 때문에 문맥·명시 크기가 없으면 높이가 0 으로 무너진다.
- 쿼리는 **자손**에만 적용된다. 컨테이너 자기 자신을 스타일하려면 한 단계 위에 컨테이너를 둔다.
- 단위: `cqw`·`cqh`·`cqi`·`cqb`·`cqmin`·`cqmax`. 컨테이너가 없으면 작은 뷰포트 단위(`sv*`)로 대체된다.
- 지원: `container-type` 은 2023-02 부터 주요 브라우저 공통(Baseline Widely available). 스타일 쿼리는 **커스텀 속성**만 지원(`@container style(--variant: compact)`), 일반 속성 스타일 쿼리는 미지원이다(MDN).

## 언제 쓰나

- 재사용 컴포넌트(카드·미디어 객체·폼 행)가 여러 폭의 칸에 들어갈 때 → 컨테이너 쿼리.
- 내비게이션 형태·패널 수처럼 앱 전체 구조가 바뀌는 결정 → 미디어 쿼리/창 크기 클래스.

## 체크리스트

- [ ] 320 CSS px 폭(400% 확대와 같음)에서 가로 스크롤 없이 읽힌다 (WCAG 1.4.10 리플로, AA)
- [ ] 브레이크포인트는 기기 이름이 아니라 콘텐츠가 깨지는 지점 기준
- [ ] 컴포넌트는 자기가 들어갈 칸의 최소·최대 폭을 문서화
- [ ] 가로 모드 휴대폰(폭 medium, 높이 compact)처럼 높이가 부족한 경우도 확인
- [ ] 터치/포인터 차이는 폭이 아니라 `@media (pointer: coarse)` 등으로 판단

## 흔한 실수

- `isTablet` 같은 기기 판별로 레이아웃 결정 → 분할 화면·폴더블에서 틀린다(Android 문서가 명시적으로 경고).
- 컨테이너 자신에 `@container` 스타일을 걸고 왜 안 되는지 고민.
- 모든 래퍼에 `container-type: size` → 높이가 무너지고 레이아웃 비용 증가.
- 데스크톱 시안을 먼저 만들고 모바일에서 "숨기기"로 해결 → 핵심 기능이 모바일에서 사라짐.

## 주의 (비용)

- 컨테이너 쿼리는 봉쇄(containment)를 적용하므로 자식 크기가 부모 크기에 영향을 주지 못한다. 내용에 따라 늘어나야 하는 요소에는 `inline-size` 만 쓴다.
- 구간이 많을수록 테스트·디자인 시안 수가 늘어난다. 구간은 3~5개로 시작한다.
