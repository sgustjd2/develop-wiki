---
title: 차트 접근성 (대체 표·ARIA·키보드·반응형)
aka: [Accessible Charts, Chart Accessibility, 차트 대체 텍스트, 데이터 시각화 접근성, SVG 차트 키보드]
category: ui-ux
group: accessibility
level: intermediate
summary: 차트를 짧은 이름 + 요약 + 데이터 표로 이중 제공하고, 필요하면 데이터 점을 키보드로 탐색하게 하며, 작은 화면에서도 정보가 유지되게 만드는 방법.
tags: [accessibility, charts, data-visualization, svg, aria, keyboard, responsive]
related: [ui-ux/data-viz-color, ui-ux/color-contrast-wcag-apca, ui-ux/screen-reader-accessible-name, ui-ux/keyboard-focus-management, ui-ux/data-table-density, ui-ux/responsive-adaptive-container-queries, ui-ux/live-regions-announcements, ui-ux/motion-design-principles, ui-ux/cognitive-accessibility, ui-ux/accessible-table-vs-grid]
sources:
  - https://www.w3.org/WAI/tutorials/images/complex/
  - https://www.w3.org/TR/WCAG22/#non-text-content
  - https://www.w3.org/TR/WCAG22/#non-text-contrast
  - https://www.w3.org/TR/WCAG22/#use-of-color
  - https://www.w3.org/WAI/ARIA/apg/patterns/table/
updatedAt: 2026-11-19
---

## 문제

- 차트가 `<canvas>` 나 이미지라서 낭독기에는 "그래픽"이라는 말만 들린다.
- 막대 100개에 각각 툴팁이 있어 키보드 사용자는 호버 없이는 값을 읽을 수 없다.
- 색만으로 계열을 구분해 색각 이상 사용자가 범례를 못 맞춘다([데이터 시각화 색](/develop-wiki/knowledge/ui-ux/data-viz-color/)).
- 모바일에서 축 라벨이 겹쳐 읽을 수 없거나, 차트를 축소만 해서 점이 터치 대상보다 작아진다.

## 해법

차트는 **복잡한 이미지**(W3C WAI)다. 짧은 설명(무엇인지) + 긴 설명(핵심 정보)의 2단 대체가 기본이다.

### 1. 3층 구조

| 층 | 내용 | 대상 |
| --- | --- | --- |
| 이름 | "월별 문의 건수" (차트가 무엇인지) | 모두, 낭독기 첫 안내 |
| 요약 | "3월이 150건으로 가장 많고 2월이 가장 적다" (읽어야 할 결론) | 낭독기·저시력·인지 부담 |
| 원자료 | 데이터 표 | 정확한 값이 필요한 모두 |

- 요약은 **차트가 보여주려는 결론**을 쓴다. 차트 종류 설명("막대 그래프입니다")은 이름에 이미 있다.
- 긴 설명 연결 방식(WAI): 인접 링크/텍스트, `<figure>`+`<figcaption>` 안에 설명, `aria-describedby`. `aria-describedby` 는 참조한 내용이 한 단락으로 읽히므로 표·제목이 있는 설명에는 맞지 않는다(WAI 경고). **표는 figure 안이나 인접 영역에 두고 `aria-describedby` 에는 요약 문장만** 건다.
- 대체 표는 숨기지 말고 "데이터 표 보기"(`<details>`) 같은 토글로 모두에게 열어 둔다. 숨은 전용 텍스트보다 모두가 쓸 수 있는 편이 유지 비용도 낮다.
- 표 마크업은 [접근 가능한 표](/develop-wiki/knowledge/ui-ux/accessible-table-vs-grid/)(`caption`, `th scope`)를 따른다.

### 2. 키보드 탐색: 필요할 때만

- 데이터 점이 많지 않고 점마다 읽을 값이 있으면, 점을 포커스 가능하게 하고 화살표로 이동한다. 점 하나는 `aria-label`("3월: 150건")을 가진다.
- 점이 수백 개이면 모두 탭 정지점으로 만들지 말고 **차트 전체를 탭 정지점 1개**로(roving tabindex), 화살표/Home/End 로 이동한다. 대량 데이터는 이동 단위를 묶음(주·월)으로 올리는 계층 탐색이 필요할 수 있다(이 노트는 구현하지 않음).
- 호버 툴팁은 포커스에서도 같은 내용이 나와야 한다. 툴팁이 가리는 데이터는 Esc 로 닫을 수 있어야 한다.
- 줌/필터/브러시 같은 조작은 버튼·입력 컨트롤로 별도 제공한다([키보드·포커스](/develop-wiki/knowledge/ui-ux/keyboard-focus-management/)).

### 3. 코드: SVG 막대 차트 + 표 (jsdom 으로 구조·키 동작 확인)

```ts
function renderChart(root: HTMLElement, { title, summary, data }: Cfg) {
  const fig = document.createElement('figure');
  const pts = data.map((d, i) =>
    `<rect tabindex="${i ? -1 : 0}" role="img" aria-label="${d.m}: ${d.v}건" x="${i * 30}" width="20" height="${d.v / 2}"/>`).join('');
  fig.innerHTML = `
    <svg role="group" aria-labelledby="t" aria-describedby="s" viewBox="0 0 100 80">
      <title id="t">${title}</title>${pts}</svg>
    <figcaption id="s">${summary}</figcaption>
    <details><summary>데이터 표 보기</summary>
      <table><caption>${title}</caption>
        <thead><tr><th scope="col">월</th><th scope="col">건수</th></tr></thead>
        <tbody>${data.map((d) => `<tr><th scope="row">${d.m}</th><td>${d.v}</td></tr>`).join('')}</tbody>
      </table></details>`;
  root.append(fig);
  const marks = [...fig.querySelectorAll<SVGElement>('rect')];
  fig.querySelector('svg')!.addEventListener('keydown', (e) => {
    const i = marks.indexOf(document.activeElement as SVGElement);
    const j = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: marks.length - 1 } as Record<string, number>)[e.key];
    if (i < 0 || j === undefined) return;
    e.preventDefault();
    const n = marks[Math.max(0, Math.min(j, marks.length - 1))];
    marks.forEach((m) => m.setAttribute('tabindex', m === n ? '0' : '-1')); n.focus();
  });
}
```

- 확인한 동작(jsdom): `aria-describedby` 가 `figcaption` id 를 가리킴, 표 행 수가 데이터 수와 같음, `tabindex="0"` 1개, End 로 마지막 점(`3월: 150건`)에 포커스. 실제 낭독기가 `svg role="group"` 과 점별 `role="img"` 를 어떻게 읽는지는 이 환경에서 확인하지 못했다. 예제의 문자열 보간은 신뢰할 수 있는 데이터를 가정한다(실서비스에서는 이스케이프 필요).

### 4. 색·대비·모양

- 계열 구분을 색만으로 하지 않는다(WCAG 1.4.1). 직접 라벨, 선 모양·마커, 패턴을 병행한다.
- 의미 있는 그래픽 요소(선·막대·마커)는 인접 색과 3:1(WCAG 1.4.11). 격자선처럼 정보가 아닌 장식은 예외가 될 수 있지만 판단은 "그것 없이 이해되는가"로 한다.
- 축·범례·라벨 텍스트는 일반 텍스트 대비(4.5:1/큰 글자 3:1). 토큰 단위 자동 검사는 [대비 CI](/develop-wiki/knowledge/ui-ux/design-token-contrast-ci/).

### 5. 반응형

- 축소만 하지 말고 **정보 설계를 바꾼다**: 라벨 간격 줄이기·가로 막대로 전환·계열 수 제한·직접 라벨, 표 우선 전환. 컨테이너 크기에 맞추는 방법은 [컨테이너 쿼리](/develop-wiki/knowledge/ui-ux/responsive-adaptive-container-queries/)를 본다.
- 터치 환경의 점 선택 대상은 [터치 타겟](/develop-wiki/knowledge/ui-ux/touch-target-size/) 크기를 지키거나 가까운 점으로 스냅한다.
- 확대(200~400%)·가로 스크롤 상황에서도 요약과 표는 읽혀야 한다.
- 애니메이션 진입 효과는 `prefers-reduced-motion` 에서 끈다([모션](/develop-wiki/knowledge/ui-ux/motion-design-principles/)).
- 실시간 갱신 차트는 값이 바뀔 때마다 읽히지 않도록, 의미 있는 변화만 요약해 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)에 `polite` 로 알린다.

## 언제 쓰나

- 모든 정보 전달용 차트. 대체 표/요약은 기본값.
- 점 단위 키보드 탐색은 "개별 값을 읽는 것이 과업"인 대시보드·리포트. 추세만 보면 되는 스파크라인은 이름+요약으로 충분하다.
- 장식용 차트(요약이 이미 본문에 있음)는 `aria-hidden` 처리도 가능. 중복 낭독을 줄인다.

## 주의

- ARIA 로 감싸도 낭독기가 SVG 내부를 일관되게 읽는다는 보장은 없다. 핵심 정보는 항상 표·텍스트로도 있어야 한다.
- 점마다 `role="img"`+`aria-label` 은 점이 많으면 소음이 된다.
- 요약을 사람이 쓰면 데이터가 바뀔 때 낡는다. 자동 생성(최댓값·최솟값·추세)하되 틀린 문장을 만들지 않게 테스트한다.
- 차트 라이브러리의 접근성 기능은 라이브러리·버전마다 다르다. 도입 전에 키보드·낭독기 동작을 직접 확인한다(이 노트는 특정 라이브러리를 검증하지 않았다).
- 자동 검사([axe-core](/develop-wiki/frontend/performance-a11y/axe-core/))는 차트의 "의미 있는 요약인지"를 판단하지 못한다([접근성 테스트 전략](/develop-wiki/knowledge/ui-ux/a11y-testing-strategy/)).

## 체크리스트

- [ ] 이름 + 결론 요약 + 데이터 표(또는 인접 설명)가 모두 있다
- [ ] 표가 키보드·낭독기로 읽히고 `caption`·`scope` 가 있다
- [ ] 호버 툴팁 내용이 포커스에서도 나온다
- [ ] 점이 많으면 탭 정지점은 1개, 화살표로 이동
- [ ] 색 외 구분 수단(라벨·모양·패턴)이 있다
- [ ] 그래픽·텍스트 대비 3:1 / 4.5:1
- [ ] 400% 확대·모바일 폭에서 라벨 겹침 없음
- [ ] 모션 감소 설정을 존중한다

## 흔한 실수

- 차트 이미지에 `alt="차트"`.
- 표를 `display:none` 으로 숨겨 시각 사용자에게는 없는 정보로 만들기.
- `aria-describedby` 에 표를 통째로 연결.
- 범례를 색 견본만으로 구성.
- 툴팁을 마우스 호버에만 의존.
