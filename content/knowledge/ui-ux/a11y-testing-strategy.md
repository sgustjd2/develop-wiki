---
title: 접근성 테스트 전략 (자동·수동·낭독기 조합)
aka: [Accessibility Testing Strategy, axe-core, WCAG-EM, Manual Accessibility Testing, Screen Reader Testing, 접근성 검수]
category: ui-ux
group: accessibility
level: intermediate
summary: 자동 검사기(axe)로 잡히는 것과 사람이 확인해야 하는 것을 나눠, 개발·CI·릴리스 단계별로 자동·키보드·낭독기·사용자 테스트를 배치하는 방법.
tags: [accessibility, a11y, testing, axe-core, wcag, screen-reader]
related: [ui-ux/wcag-22-overview, ui-ux/keyboard-focus-management, ui-ux/screen-reader-accessible-name, ui-ux/semantic-html-first-aria, ui-ux/color-contrast-wcag-apca, ui-ux/live-regions-announcements]
sources:
  - https://www.w3.org/WAI/test-evaluate/
  - https://github.com/dequelabs/axe-core/blob/develop/doc/API.md
  - https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
  - https://www.w3.org/TR/WCAG-EM/
updatedAt: 2026-11-19
---

## 문제

- "axe 통과 = 접근성 OK" 로 오해하기 쉽다. W3C WAI 는 도구 하나만으로 기준 충족 여부를 판정할 수 없다고 명시하고, 지식 있는 사람의 검토를 요구한다.
- 반대로 수동 검수만 하면 회귀가 매 릴리스마다 새로 생긴다.
- 낭독기는 OS·브라우저·낭독기 조합마다 다르게 읽는다. 어디까지 테스트할지 정하지 않으면 끝이 없다.

## 해법: 도구가 잘하는 일과 사람이 해야 하는 일을 나눈다

| 잡는 대상 | 자동(axe 등) | 키보드 수동 | 낭독기 수동 | 사용자 테스트 |
| --- | --- | --- | --- | --- |
| 대체 텍스트 유무, 버튼 이름 유무, 라벨 연결, `lang`, ARIA 속성 유효성 | 강함 | - | - | - |
| 대체 텍스트가 **적절한가**, 링크 이름이 맥락 없이 이해되는가 | 불가 | - | 필요 | 보조 |
| Tab 순서, 키보드 함정, 포커스 이동·복귀 | 일부(포커스 가능 여부 등) | 필요 | - | 보조 |
| 색 대비 | 가능(실제 렌더링 환경 필요) | - | - | - |
| 동적 알림(라이브 영역)이 실제로 읽히는가 | 불가 | - | 필요 | 보조 |
| 과업을 끝낼 수 있는가, 인지 부담 | 불가 | - | - | 필요 |

- axe 결과는 `violations`(실패), `passes`, `incomplete`(확정 못 함, "needs review"), `inapplicable` 로 나뉜다. **`incomplete` 는 사람이 봐야 하는 목록**이다. 무시하지 않는다.
- `runOnly` 태그는 누적되지 않는다. AA 까지 보려면 `wcag2a`, `wcag2aa`(필요하면 `wcag21aa`, `wcag22aa`)를 함께 적는다. WCAG 2.2 규칙은 기본 비활성이라는 점을 rule-descriptions 문서가 밝힌다.

### 단계별 배치

| 단계 | 하는 일 | 비용 |
| --- | --- | --- |
| 작성 중 | 린트(정적 규칙), 시맨틱 HTML 우선 ([시맨틱 HTML](/develop-wiki/knowledge/ui-ux/semantic-html-first-aria/)) | 낮음 |
| 컴포넌트 | 스토리·단위 테스트에서 axe, 키보드 상호작용 테스트 | 낮음 |
| 페이지·CI | 핵심 화면 E2E 에서 axe, 기준 위반 시 실패(기존 위반은 기준선으로 관리) | 중간 |
| 릴리스 전 | 핵심 흐름 키보드 전수, 낭독기 1~2 조합, 200% 확대·고대비 확인 | 중간 |
| 분기·큰 변경 | 장애 사용자 참여 테스트, 외부 감사 | 높음 |

### 낭독기 조합 정하기

- 사용자 비율 통계는 지역·시기에 따라 다르므로 서비스의 실제 분석 데이터와 설문(예: WebAIM 낭독기 설문)을 보고 정한다. 이 노트에서는 수치를 인용하지 않는다.
- 최소 조합 예: 데스크톱 Windows 의 NVDA + 브라우저 1, macOS 의 VoiceOver + Safari, 모바일 iOS VoiceOver 또는 Android TalkBack 중 서비스 주력 플랫폼. 관련 도구 항목: [NVDA](/develop-wiki/frontend/performance-a11y/nvda/), [VoiceOver](/develop-wiki/frontend/performance-a11y/voiceover/), [axe-core](/develop-wiki/frontend/performance-a11y/axe-core/).

### 코드: jsdom 에서 axe 실행 (직접 실행해 확인)

```ts
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

const dom = new JSDOM(
  `<html lang="ko"><head><title>t</title></head><body><main>
     <img src="a.png"><button></button></main></body></html>`,
  { runScripts: 'outside-only' },
);
dom.window.eval(axe.source);
const r = await dom.window.axe.run(dom.window.document, { runOnly: ['wcag2a', 'wcag2aa'] });
console.log(r.violations.map((v) => v.id)); // ['button-name', 'image-alt']
console.log(r.incomplete.map((v) => v.id)); // ['color-contrast']  ← jsdom 은 레이아웃·렌더링이 없다
```

- 실행 결과: 위반 `button-name`, `image-alt`, 미확정 `color-contrast`. jsdom 은 실제 렌더링을 하지 않아 대비를 판정하지 못하고 `incomplete` 로 남긴다. 대비·가림·포커스 표시는 **실제 브라우저(Playwright 등)** 에서 돌려야 의미가 있다.
- 브라우저 E2E 에서는 `@axe-core/playwright` 를 쓰는 방식이 흔하다(이 노트에서는 실행하지 않았다).

## 언제 쓰나

- 새 디자인 시스템 컴포넌트, 폼, 모달처럼 상호작용이 많은 화면을 출시하기 전.
- 접근성 요구(공공기관, 계약)가 있어 근거 문서가 필요할 때 WCAG-EM 같은 방법론으로 표본·범위를 정해 보고한다.

## 체크리스트

- [ ] CI 에 axe 가 있고, `incomplete` 는 별도 목록으로 리뷰된다.
- [ ] 핵심 흐름(가입·결제·검색)은 마우스 없이 끝까지 해 봤다.
- [ ] 낭독기에서 제목·랜드마크 목록, 폼 오류, 모달 열림·닫힘, 동적 알림을 확인했다.
- [ ] 200% 확대·좁은 뷰포트(리플로우), 고대비·강제 색상 모드에서 깨지지 않는다.
- [ ] 위반은 심각도·영향 사용자 기준으로 우선순위를 매겼다.

## 흔한 실수

- 자동 검사 점수(예: Lighthouse 접근성 100)를 "준수"로 보고한다.
- 낭독기 한 조합에서만 확인하고 모든 환경에서 같다고 가정한다.
- 접근성 이슈를 마지막 QA 에서 한꺼번에 발견한다. 컴포넌트 단계에서 잡는 비용이 훨씬 낮다.
- ARIA 로 낭독기 출력만 맞춘다. 먼저 네이티브 요소를 쓴다.

## 비용

- 낭독기 수동 테스트는 숙련이 필요하고 시간이 든다. 범위를 핵심 흐름으로 제한하고 체크리스트를 문서화한다.
- 기존 위반이 많은 코드베이스에 axe 를 "전부 실패" 로 켜면 CI 가 막힌다. 기준선(허용 목록)에서 시작해 줄여 나간다.
