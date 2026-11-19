---
title: 데이터 시각화 색 (범주형·순차형·발산형, 색각 이상)
aka: [Data Visualization Color, Categorical Palette, Sequential, Diverging, Colorblind-safe, Okabe-Ito, ColorBrewer]
category: ui-ux
group: visual
level: intermediate
summary: 차트의 색을 데이터 종류(범주·순서·양극)에 맞춰 고르고, 색각 이상 사용자와 WCAG 1.4.1·1.4.11 을 만족하도록 색 외 단서와 대비를 더하는 방법.
tags: [visual-design, data-visualization, color, accessibility, colorblind, charts]
related: [ui-ux/color-contrast-wcag-apca, ui-ux/color-system-semantic-roles, ui-ux/dark-mode-design, ui-ux/gestalt-principles, ui-ux/visual-hierarchy, ui-ux/cognitive-accessibility]
sources:
  - https://colorbrewer2.org/
  - https://jfly.uni-koeln.de/color/
  - https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
  - https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
updatedAt: 2026-11-19
---

## 문제

- 팔레트 도구의 무지개 색을 그대로 쓰면 순서가 안 읽히거나(어디가 큰 값인지), 범주가 서로 비슷해 구분되지 않는다.
- 빨강/초록으로만 상태를 나타내면 색각 이상 사용자는 구분할 수 없다.
- 다크 모드에서 같은 색이 다르게 보인다.

## 해법

### 1. 데이터 종류 → 팔레트 종류

| 데이터 | 팔레트 | 설계 원리 |
| --- | --- | --- |
| 서로 순서 없는 범주(제품 A·B·C) | **범주형(qualitative)** | 색상(hue)을 달리하고 밝기·채도는 서로 달라도 되지만 한 색이 튀지 않게. 개수는 적게(대략 일곱 가지 안팎) |
| 낮음→높음 연속·순서 | **순차형(sequential)** | 한 색상에서 밝기가 **단조롭게** 변한다. 밝은 쪽이 낮은 값(밝은 배경 기준) |
| 중간 기준값에서 양쪽으로 갈라지는 값(증감, 편차) | **발산형(diverging)** | 두 색상이 중립(밝은 색)에서 양 끝으로 어두워진다. 중립은 의미 있는 기준값(0) |

ColorBrewer 는 이 세 분류와 "색각 이상 안전(colorblind safe)" 필터를 제공하는 대표 도구다(이 노트는 그 안의 팔레트 값을 인용하지 않았다).

### 2. 색각 이상 대응

- 가장 확실한 규칙은 **색에만 의존하지 않는 것**: WCAG 1.4.1 은 색이 정보를 전달하는 유일한 시각 수단이 되지 않도록 요구하며, 차트에는 패턴(G111) 또는 텍스트로 같은 정보를 제공하는 방식(G14)이 충분 기법으로 소개된다. 선에는 점 모양·점선, 막대에는 해치, 요소에 **직접 라벨**을 붙이고 멀리 있는 범례에 의존하지 않는다.
- 도쿄대·쾰른대 Okabe·Ito 의 색각 이상 친화 팔레트 설명(jfly 페이지)이 밝힌 원칙: 빨강 대신 주황빛 빨강(vermilion), 황록색 회피, 청록(bluish green), 보라 대신 붉은 보라, 따뜻한 색과 차가운 색을 번갈아 쓰기, 비슷한 계열을 쓸 때는 밝기·채도 차이를 크게. 8색의 정확한 값은 이 페이지에서 그림으로만 제공되어 **텍스트로 확인하지 못했다**. 아래 코드의 hex 는 R 패키지 등 2차 출처의 값과 일치하는 것을 확인했지만 jfly 원전 그림과의 직접 대조는 하지 못했다.
- 빨강·초록 "좋음/나쁨" 구분은 아이콘(▲▼ ✓✕)과 텍스트를 함께 쓴다.
- 시뮬레이션: 브라우저 개발자 도구의 색각 이상 에뮬레이션 등으로 눈으로 확인한다(도구별 메뉴 위치는 이 노트에서 확인하지 않았다).

### 3. 대비 (WCAG 1.4.11)

차트의 선·막대·마커처럼 정보를 전달하는 **그래픽 요소는 인접 색과 3:1** 이상이 필요하다(1.4.11; Understanding 문서는 링크 생존만 확인했고 본문은 읽지 못했다). 텍스트 라벨은 1.4.3(4.5:1).

```ts
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// 순차형이 밝기 단조인지: 밝은 순서로 정렬된 팔레트의 휘도가 계속 줄어드는가
export const isMonotonic = (p: string[]) => p.every((c, i) => i === 0 || lum(c) < lum(p[i - 1]));
```

- node 로 실행: 흰 배경 기준 대비는 Okabe-Ito 계열 8색 중 `#F0E442`(노랑) 1.32, `#E69F00`(주황) 2.25, `#56B4E9`(하늘) 2.31 로 **3:1 에 못 미치고**, `#009E73` 3.42, `#D55E00` 3.87, `#0072B2` 5.19, `#000` 21. 즉 색각 이상에 안전한 팔레트도 **배경 대비는 별도로 확인**해야 한다. 밝은 색 막대는 어두운 외곽선을 두거나 배경을 바꾼다.
- 5단계 순차형(`#f7fbff → #08306b`)은 휘도가 0.960 → 0.032 로 단조 감소함을 확인했다.
- 색각 이상 시뮬레이션 행렬로 빨강(`#d62728`)과 초록(`#2ca02c`) 사이 RGB 거리를 계산해 보니 정상 시각 209, 제2색약(deuteranopia) 약 30, 제1색약(protanopia) 약 89 로 줄었다. 사용한 행렬(Machado 등 2009)은 기억에 의존한 값이라 **미검증**이므로 정성적 경향으로만 읽는다.

### 4. 다크 모드

- 같은 색을 어두운 배경에서 쓰면 채도가 과해 보이거나 대비가 달라진다. 라이트·다크 각각에서 3:1 을 따로 검사한다([다크 모드](/develop-wiki/knowledge/ui-ux/dark-mode-design/)).
- 순차형의 방향(밝음=낮음)은 배경이 어두우면 뒤집는 편이 직관적이다("진한 것 = 많음"을 유지하려면 배경에 따라 방향이 바뀐다).

## 언제 쓰나

- 대시보드·리포트·지도의 모든 색 매핑. 의미 색(성공·경고·오류)은 [시맨틱 색 역할](/develop-wiki/knowledge/ui-ux/color-system-semantic-roles/)과 분리해서 관리한다.

## 체크리스트

- [ ] 데이터 종류와 팔레트 종류가 맞다(순서 있는 값에 범주형 금지)
- [ ] 색 말고 패턴·라벨·모양이 있다(1.4.1)
- [ ] 그래픽 요소가 배경·인접 요소와 3:1(1.4.11), 텍스트는 4.5:1
- [ ] 범주가 많으면 강조 1~2개 + 나머지 회색으로 줄이는 방법을 검토
- [ ] 라이트·다크·인쇄(흑백)에서 모두 확인

## 흔한 실수

- 무지개(jet) 팔레트로 연속값 표현: 밝기가 단조롭지 않아 순서가 왜곡된다.
- 발산형 중립색이 데이터의 기준값과 어긋난다(예: 중립이 평균인데 0 이 의미).
- 범례 색 칸이 작고 비슷해서 선을 매칭하지 못한다. 직접 라벨 + 순서 일치.
- 의미 색(빨강=위험)을 단순 범주 색으로 쓴다.

## 한계

- 색지각은 개인차·장비차가 크다. 시뮬레이션과 대비 계산은 보조 수단이며, 중요한 차트는 사용자 확인이 필요하다.
