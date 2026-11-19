---
title: 디자인 토큰 대비 리포트 (여유·변화·예외 가시화)
aka: [Contrast Report, Token Contrast Matrix, 대비 리포트, 대비 회귀 추적, contrast headroom]
category: ui-ux
group: design-system
level: intermediate
summary: 토큰 대비 검사 결과를 통과/실패만이 아니라 조합별 여유·이전 대비 변화·예외 목록까지 표로 내보내 디자이너와 PR 리뷰어가 읽게 하는 방법.
tags: [design-tokens, contrast, wcag, report, ci, governance]
related: [ui-ux/design-token-contrast-ci, ui-ux/color-contrast-wcag-apca, ui-ux/multi-brand-theming-dtcg-resolver, ui-ux/color-system-semantic-roles, ui-ux/dark-mode-design, ui-ux/design-system-governance, ui-ux/figma-variables-token-sync, ui-ux/wcag-22-overview]
sources:
  - https://www.w3.org/TR/WCAG22/#non-text-contrast
  - https://www.w3.org/TR/WCAG22/#contrast-minimum
updatedAt: 2026-11-19
---

[토큰 대비 자동 검사 CI](/develop-wiki/knowledge/ui-ux/design-token-contrast-ci/)는 실패하면 빌드를 멈춘다. 이 노트는 그 결과를 **사람이 읽는 리포트**로 바꾸는 부분이다. 계산·쌍 선언은 CI 노트를 전제로 한다.

## 문제

- CI 로그에 실패 몇 줄만 나오면 디자이너는 어느 조합이 얼마나 부족한지, 통과한 것이 얼마나 아슬아슬한지 모른다.
- 통과(4.51:1)와 통과(16:1)가 같은 초록으로 보여, 다음 색 조정에서 깨질 쌍을 미리 알 수 없다.
- 이전 실행과 비교가 없어 "이 PR 이 대비를 나쁘게 했는지"를 판단하기 어렵다.
- 예외(allowlist)가 보이지 않으면 시간이 지나 쌓인다.

## 해법

### 1. 리포트에 넣을 열

| 열 | 내용 |
| --- | --- |
| 조합 | 브랜드/모드(필요하면 밀도) |
| 쌍 | 전경 on 배경 토큰 이름 |
| 비율 | 소수 둘째 자리 |
| 기준 | 최소 비율과 WCAG SC(1.4.3 텍스트 4.5, 큰 글자 3; 1.4.11 UI 구성요소·그래픽 3) |
| 결과 | pass / FAIL / waived |
| 여유 | 비율 − 기준 (작을수록 위험) |
| 변화 | 이전 실행 대비 증감 |

- 정렬: **여유가 작은 쌍부터**. 실패가 위, 아슬아슬한 통과가 그다음.
- WCAG 문서 기준: 1.4.11 은 컨트롤을 식별하는 시각 단서와 상태, 이해에 필요한 그래픽에 3:1 을 요구하고 비활성 컨트롤·브라우저 기본 외형은 제외한다. 1.4.3 은 큰 글자 3:1, 비활성·장식·로고 등은 제외한다.

### 2. 코드 (Node 로 실행해 확인)

```ts
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// PAIRS: [전경, 배경, 최소, SC], baseline: 이전 실행의 "조합|전경|배경" → 비율
const rows = [];
for (const [combo, t] of Object.entries(tokens))
  for (const [fg, bg, min, sc] of PAIRS) {
    const r = ratio(t[fg], t[bg]), prev = baseline[`${combo}|${fg}|${bg}`];
    rows.push({ combo, pair: `${fg} on ${bg}`, r, min, sc, delta: prev ? r - prev : null });
  }
rows.sort((a, b) => a.r - a.min - (b.r - b.min));
for (const x of rows)
  console.log(`| ${x.combo} | ${x.pair} | ${x.r.toFixed(2)} | ${x.min} (${x.sc}) | ${x.r >= x.min ? 'pass' : 'FAIL'} | ${x.delta == null ? '-' : x.delta.toFixed(2)} |`);
```

- 확인한 동작(Node 24, 예시 토큰 acme 라이트/다크 × 4쌍): 8행 표가 나왔고 가장 위는 라이트 `border.input on surface` 1.88:1(기준 3, FAIL), 다음이 다크 같은 쌍 2.72:1(FAIL)과 라이트 `text.muted` 3.45:1(FAIL, 이전 3.50 대비 −0.05). 가장 아래는 라이트 본문 17.40:1. 통과 중 가장 여유가 작은 쌍(라이트 `action.fg on action.bg` 5.13:1)이 위쪽에 정렬됐다.
- 예시 색상값·baseline 은 이 노트용 가상 값이다. 상용 도구와 교차 검증하지 않았고, `#rrggbb` 만 다룬다(알파·색공간 객체 미지원).

### 3. 배포 방식

- PR 코멘트: 변경된 토큰에 영향받는 행만 표로, 실패·여유 최소 N개 요약.
- 아티팩트: 전체 CSV/JSON 을 CI 산출물로 올리고, main 의 최근 값을 baseline 으로 삼는다.
- 리포트 상단에 **요약 한 줄**(실패 n, 예외 m, 여유 0.3 미만 k)을 둔다. 임계값은 팀이 정한다(이 노트는 수치를 제안하지 않는다).
- 예외는 같은 표에 `waived` 로 사유·담당·만료일과 함께 노출한다([거버넌스](/develop-wiki/knowledge/ui-ux/design-system-governance/)).

### 4. 읽는 법

- 실패: 토큰 값 조정 또는 쌍 정의 오류 여부 확인.
- 여유가 작은 통과: 다음 팔레트 조정에서 깨질 후보. 상태(hover·focus)·다크 모드에서 먼저 점검한다([다크 모드](/develop-wiki/knowledge/ui-ux/dark-mode-design/)).
- 변화가 음수: 의도한 변경인지 확인한다. 값이 통과 범위 안이라도 누적하면 여유가 사라진다.

## 언제 쓰나

- 브랜드·모드가 여럿이고 토큰 변경 PR 이 잦은 디자인 시스템.
- 디자이너가 CI 로그를 읽지 않아 대비 이슈가 늦게 발견될 때.

## 주의·비용

- 리포트는 선언된 쌍만 반영한다. 실제 렌더 대비(반투명·그림 위 글자 등)는 별도다.
- 지표(여유)에 맞추려고 색을 임계 바로 위로만 고르는 최적화가 생길 수 있다.
- 표가 길면 아무도 읽지 않는다. 변경분과 위험 상위만 노출한다.
- 이 리포트는 WCAG 대비 비율에 한정된다. 색 외 단서(1.4.1)·APCA 등 다른 지표는 포함하지 않았다.

## 체크리스트

- [ ] 조합·쌍·비율·기준·결과·여유·변화가 한 표에 있다
- [ ] 여유가 작은 순으로 정렬
- [ ] baseline(이전 실행)을 저장하고 비교
- [ ] 예외는 사유·담당·만료와 함께 표시
- [ ] 요약 줄과 PR 코멘트에 변경분만 노출
- [ ] 렌더 기반 검사와 병행
