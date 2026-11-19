---
name: WebAIM Contrast Checker
url: https://webaim.org/resources/contrastchecker/
docs: https://webaim.org/articles/contrast/
domain: frontend
category: performance-a11y
description: 전경색·배경색의 명도 대비를 계산해 WCAG AA·AAA 기준(본문 4.5:1, 큰 글자·UI 요소 3:1 등) 통과 여부를 보여 주는 무료 웹 도구. 색 팔레트와 버튼·링크 색을 정할 때 쓴다.
pricing: free
tags: [accessibility, color-contrast, wcag, color]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
WebAIM(미국 유타주립대 산하 웹 접근성 기관)이 운영하는 색 대비 계산기다. 두 색을 넣으면 대비율과 WCAG 기준별 통과 여부를 바로 표시한다. 별도 설치나 계정이 필요 없다.

| 기준 | 일반 텍스트 | 큰 텍스트 | 그래픽·UI 컴포넌트 |
| --- | --- | --- | --- |
| WCAG AA | 4.5:1 | 3:1 | 3:1 |
| WCAG AAA | 7:1 | 4.5:1 | — |

## 사용법
1. Foreground(글자색)와 Background(배경색)에 hex 값을 넣거나 색 선택기·스포이드로 고른다. 전경색에는 알파(투명도)도 줄 수 있다.
2. Lightness 슬라이더로 색을 밝게·어둡게 조정하면서 기준을 처음 통과하는 값을 찾는다.
3. 결과 페이지 주소(permalink)에는 `?fcolor=...&bcolor=...` 가 붙어 있어 팀에 공유할 수 있다.
4. 주소 끝에 `&api` 를 붙이면 대비율과 AA/AAA 통과 여부를 JSON으로 돌려준다. 디자인 토큰 점검 스크립트에서 간단히 호출할 수 있다.

```bash
curl "https://webaim.org/resources/contrastchecker/?fcolor=0B5FFF&bcolor=FFFFFF&api"
```

## 언제 쓰나
- 디자인 토큰의 텍스트·배경 조합, 비활성 버튼·플레이스홀더처럼 대비가 낮아지기 쉬운 요소를 정할 때.
- 페이지 전체를 자동 검사하려면 [axe-core](/develop-wiki/frontend/performance-a11y/axe-core/)·[Lighthouse](/develop-wiki/frontend/performance-a11y/lighthouse/)를 쓰고, 이 도구는 개별 색 조합을 빠르게 확인하는 용도로 쓴다.
- 배경이 그라디언트·이미지인 경우는 계산기로 판단하기 어려우므로 가장 불리한 지점의 색을 직접 골라 확인한다.

## 함께 보면 좋은 자료
- [Contrast and Color Accessibility](https://webaim.org/articles/contrast/) (WebAIM 해설 글)
- [WCAG 2.2 Quick Reference](/develop-wiki/frontend/learning/wcag-quick-reference/)의 1.4.3·1.4.11 기준
