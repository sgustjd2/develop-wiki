---
title: 색 대비 — WCAG 2.x 대비 비율과 APCA
aka: [Color Contrast, Contrast Ratio, Relative Luminance, WCAG 1.4.3, WCAG 1.4.11, APCA, Accessible Perceptual Contrast Algorithm]
category: ui-ux
group: visual
level: intermediate
summary: 텍스트·UI 요소가 배경과 충분히 구분되는지 재는 기준. 현재 규범은 WCAG 2.x 의 대비 비율(텍스트 4.5:1, 큰 텍스트·UI 3:1)이고, APCA 는 WCAG 3 후보로 검토 중인 미확정 방식이다.
tags: [accessibility, color, wcag, contrast, apca]
related: [ui-ux/color-system-semantic-roles, ui-ux/dark-mode-design, mobile-dev/mobile-accessibility-basics, ui-ux/wcag-22-overview]
sources:
  - https://www.w3.org/TR/WCAG22/
  - https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
  - https://www.w3.org/TR/wcag-3.0/
  - https://github.com/Myndex/apca-w3
  - https://developer.apple.com/design/human-interface-guidelines/accessibility
updatedAt: 2026-11-19
---

## 문제

- 연회색 글씨, 브랜드색 위 흰 글씨는 디자인 화면에서는 멀쩡해 보여도 햇빛 아래, 저시력·노안 사용자에게는 읽히지 않는다.
- "충분히 진하다"는 눈대중으로는 팀마다 기준이 다르다. 수치 기준과 자동 검사가 필요하다.

## 해법 — WCAG 2.x 기준 (현재 규범)

WCAG 2.2 는 2024-12-12 W3C 권고안이다.

| 기준 | 대상 | 최소 대비 | 수준 |
| --- | --- | --- | --- |
| 1.4.3 대비(최소) | 본문 텍스트 | 4.5:1 | AA |
| 1.4.3 | 큰 텍스트(18pt≈24px 이상, 또는 14pt≈18.5px 굵게) | 3:1 | AA |
| 1.4.6 대비(강화) | 본문 / 큰 텍스트 | 7:1 / 4.5:1 | AAA |
| 1.4.11 비텍스트 대비 | 입력란 테두리, 포커스 표시, 아이콘, 차트의 필수 요소 | 인접 색과 3:1 | AA |

예외: 비활성 컴포넌트, 순수 장식, 로고·브랜드명 텍스트.

### 계산 방법

대비 비율 = (L1 + 0.05) / (L2 + 0.05). L1 은 밝은 색, L2 는 어두운 색의 **상대 휘도**. 범위는 1:1 ~ 21:1.

```ts
// WCAG 2.x 상대 휘도·대비 비율 (sRGB). node --experimental-strip-types 로 실행 확인
const channel = (c8: number): number => {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
// 반올림하지 않고 비교한다 (4.499:1 은 4.5:1 미달)
const passAA = (fg: string, bg: string, large = false) =>
  contrast(fg, bg) >= (large ? 3 : 4.5);

contrast('#767676', '#ffffff'); // 4.542… → 본문 AA 통과
contrast('#777777', '#ffffff'); // 4.478… → 미달
```

선형화 임계값은 현재 문서 기준 0.04045 다. 2021년 5월 이전 문서는 0.03928 이었고, W3C 는 실제 결과에 차이가 없다고 설명한다.

## APCA (초안·미확정)

- APCA(Accessible Perceptual Contrast Algorithm)는 화면 발광 환경에서의 **지각 대비**를 예측하는 알고리즘이다. 결과는 Lc 값(대략 -108~106)이고 부호로 극성(어두운 글씨/밝은 글씨)을 구분한다. 글자 크기·굵기에 따라 필요한 Lc 가 달라진다.
- WCAG 2.x 공식은 두 색의 휘도만 쓰므로 글자·배경을 뒤바꿔도 값이 같고(극성 무시), 크기·굵기는 "큰 텍스트" 여부 두 단계로만 나눈다. APCA 는 극성과 글꼴 크기·굵기를 판정에 넣는 것이 차이점이다.
- **상태**: 개발자 저장소는 "WCAG 3 의 후보로 평가 중, 개발 단계"라고 밝힌다. 2026-09 WCAG 3.0 Working Draft 는 "WCAG 3 의 대비 알고리즘은 아직 정해지지 않았다"고 적고 있다. 즉 **어떤 규범에도 채택되지 않았다.**
- 실무: 법적·계약상 준수는 WCAG 2.x 로 판정한다. APCA 는 다크 모드·얇은 글꼴처럼 2.x 가 어색한 경우의 보조 점검에만 쓴다.

## 언제 쓰나

- 색 팔레트·의미 색을 정할 때 `on-X` / `X` 짝마다 대비를 계산해 토큰에 고정한다.
- CI 에 axe-core 같은 자동 검사를 넣어 회귀를 막는다([axe-core](/develop-wiki/frontend/performance-a11y/axe-core/)).

## 체크리스트

- [ ] 본문 4.5:1, 큰 텍스트 3:1 이상 (반올림 금지)
- [ ] 플레이스홀더·캡션 같은 보조 텍스트도 4.5:1 (비활성 컴포넌트만 예외)
- [ ] 입력란 테두리·포커스 링·의미 있는 아이콘은 인접 색과 3:1
- [ ] 이미지·그라데이션 위 텍스트는 가장 밝은(어두운) 지점 기준으로 확인
- [ ] 다크 모드·고대비 모드에서도 같은 검사를 돌린다

## 흔한 실수

- 브랜드 파랑 위 흰 글씨를 "큰 텍스트" 기준(3:1)으로 통과시켰는데 실제 글자는 14px.
- 반투명 텍스트(`opacity: .6`)를 원래 색 기준으로 계산.
- 포커스 링을 브랜드 연한 색으로 만들어 배경과 3:1 미달.
- APCA 점수를 "WCAG 3 통과"라고 보고.

## 주의 (비용)

- 대비 비율은 sRGB 기준이다. Display P3 같은 넓은 색 공간 값은 sRGB 로 바꿔 계산해야 한다.
- 대비를 모두 7:1 이상으로 올리면 위계를 만들 여지가 줄어든다. Material 3 처럼 표준·중간·높음 대비 테마를 사용자 선택으로 두는 방법이 있다.
- 숫자를 통과해도 글꼴이 너무 얇거나 작으면 읽기 어렵다. 수치는 최소 조건이다.
