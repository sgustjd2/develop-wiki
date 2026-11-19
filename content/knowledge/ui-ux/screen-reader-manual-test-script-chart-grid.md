---
title: 차트·그리드 낭독기 수동 테스트 스크립트
aka: [Screen Reader Test Script, Manual SR Testing, NVDA VoiceOver test plan, 낭독기 수동 검증 시나리오]
category: ui-ux
group: accessibility
level: intermediate
summary: 차트와 데이터 그리드를 NVDA·VoiceOver 로 직접 확인할 때 쓰는 단계·기대 결과·관찰 기록 양식과, 낭독 출력을 추측하지 않고 기록하는 규칙.
tags: [accessibility, screen-reader, nvda, voiceover, testing, chart, grid, manual-testing]
related: [ui-ux/a11y-testing-strategy, ui-ux/accessible-charts, ui-ux/accessible-table-vs-grid, ui-ux/virtualized-list-accessibility, ui-ux/keyboard-focus-management, ui-ux/live-regions-announcements, ui-ux/screen-reader-accessible-name, ui-ux/voiceover-manual-testing-keys]
sources:
  - https://download.nvaccess.org/documentation/userGuide.html
  - https://www.w3.org/WAI/ARIA/apg/patterns/grid/
  - https://www.w3.org/WAI/tutorials/images/complex/
updatedAt: 2026-11-19
---

자동 검사(axe 등)는 마크업 규칙 위반을 찾지만 **실제로 어떻게 읽히는지**는 모른다. 이 노트는 수동 확인을 반복 가능하게 만드는 양식이다. 전략 전체는 [접근성 테스트 전략](/develop-wiki/knowledge/ui-ux/a11y-testing-strategy/)에 있다.

## 문제

- "낭독기로 확인함" 이라고만 적히면 무엇을 어떤 조합으로 봤는지 알 수 없다.
- 낭독기·브라우저 조합마다 같은 마크업을 다르게 읽는다. 한 번 읽어 본 결과가 다른 조합에도 적용된다고 가정할 수 없다.
- 기대 결과를 "~라고 읽혀야 한다"로 미리 쓰면 작성자의 추측이 검증처럼 보인다.

## 해법

### 1. 원칙

- 기대 결과는 **읽히는 문구가 아니라 얻어야 할 정보**로 쓴다. 예: "계열 이름, 값, 단위를 알 수 있다".
- 관찰 칸은 비워 두고 테스터가 **실제로 들은 내용**을 적는다. 못 해 본 항목은 `미확인`.
- 환경을 기록한다: OS, 낭독기+버전, 브라우저+버전, 모드(탐색/포커스).
- 심각도는 "정보를 얻지 못함 / 얻지만 어려움 / 불편"으로 구분한다.

### 2. NVDA 키(NVDA 사용자 가이드에서 확인한 것, 데스크톱 배열)

| 목적 | 키 |
| --- | --- |
| 탐색 모드 ↔ 포커스 모드 | NVDA+Space (Esc 는 자동 전환된 포커스 모드에서 탐색 모드로) |
| 다음/이전 표 | T / Shift+T |
| 표 안 셀 이동(탐색 모드) | Ctrl+Alt+화살표 (Ctrl+Alt+Home/End 는 행의 첫/끝 열, Ctrl+Alt+PageUp/PageDown 은 열의 첫/끝 행) |
| 요소 목록 | NVDA+F7 |
| 현재 줄 읽기 / 계속 읽기 | NVDA+↑ / NVDA+↓ |

- VoiceOver(macOS·iOS) 키 조합과 제스처는 Apple 사용 설명서 기준으로 [VoiceOver 수동 테스트 키](/develop-wiki/knowledge/ui-ux/voiceover-manual-testing-keys/)에 따로 정리했다. 테스트 기기의 OS 버전 문서와 대조해 쓴다.
- 키보드 기본 이동은 낭독기 모드에 따라 달라진다. 그리드에서 화살표 키가 낭독기에 먹히는지 앱에 전달되는지는 모드와 role 에 따라 다를 수 있어 직접 기록한다.

### 3. 차트 시나리오

대상: [차트 접근성](/develop-wiki/knowledge/ui-ux/accessible-charts/)의 "이름 + 요약 + 데이터 표" 구성.

| # | 단계 | 얻어야 할 정보(기대) | 관찰(실제로 들은 것) | 판정 |
| --- | --- | --- | --- | --- |
| C1 | 탐색 모드로 차트 위치까지 이동 | 차트가 존재하고 무엇인지(이름) | | |
| C2 | 차트 이름·설명 읽기 | 주제, 기간·단위, 핵심 결론 | | |
| C3 | 대체 데이터 표로 이동(링크/제목 경유) | 표로 이동 가능, 열 머리글 인식 | | |
| C4 | 표를 셀 단위로 읽기 | 각 값이 계열·기간과 연결 | | |
| C5 | 장식 SVG 요소(축 눈금 등)가 소음을 내는지 | 불필요한 낭독 없음 | | |
| C6 | 데이터 점 키보드 탐색이 있다면 Tab/화살표 | 점 이름·값·위치 | | |
| C7 | 필터·기간 변경 후 | 변경 결과가 알려짐 | | |
| C8 | 200% 확대·작은 화면에서 반복 | 정보 동등 | | |

### 4. 그리드 시나리오

대상: [테이블 vs 그리드](/develop-wiki/knowledge/ui-ux/accessible-table-vs-grid/), 가상화가 있으면 [가상화 리스트 접근성](/develop-wiki/knowledge/ui-ux/virtualized-list-accessibility/) 포함.

| # | 단계 | 얻어야 할 정보(기대) | 관찰 | 판정 |
| --- | --- | --- | --- | --- |
| G1 | Tab 으로 그리드 진입 | 그리드임을 알 수 있고 탭 정지점이 1개 | | |
| G2 | 화살표로 셀 이동 | 현재 셀 값과 해당 열 머리글 | | |
| G3 | 행 머리글/열 머리글 전환 | 이동 시 맥락(행·열 이름) | | |
| G4 | Home/End, Ctrl+Home/End, Page | APG 계약대로 이동 | | |
| G5 | Enter/F2 로 셀 편집, Esc 로 복귀 | 모드 변화와 복귀 지점 | | |
| G6 | 정렬 헤더 활성화 | 정렬 상태(방향) 전달 | | |
| G7 | (가상화) 끝까지 스크롤·점프 | 전체 행 수·현재 위치, 포커스 유지 | | |
| G8 | 탭으로 그리드 탈출 | 다음 컨트롤로 이동 | | |
| G9 | 탐색 모드의 표 이동 키(NVDA: Ctrl+Alt+화살표) 병행 | 표 구조 정보 | | |

- G2·G3·G7 의 기대는 [APG 그리드 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)과 ARIA 속성 의미에서 온 것이며, 낭독기별 실제 출력은 이 노트에서 관찰하지 않았다.

### 5. 기록 템플릿

```md
## 환경
- OS / 낭독기+버전 / 브라우저+버전 / 날짜 / 테스터
## 결과
| 시나리오 | 판정(Pass/Fail/미확인) | 들은 내용(원문) | 재현 단계 | 이슈 링크 |
```

- 판정은 "얻어야 할 정보를 얻었는가"로 한다. 읽은 문구가 기대와 달라도 정보가 충분하면 Pass 다(문구는 낭독기 설정에 따라 다르다).
- 실패 이슈에는 환경과 마크업 스니펫을 붙인다.

## 언제 쓰나

- 새 차트·그리드 컴포넌트 출시 전, 마크업이나 상호작용 방식을 크게 바꾼 때, 라이브러리 업그레이드 후.
- 주력 조합 하나씩(Windows+NVDA+Chrome/Firefox, macOS+VoiceOver+Safari 등)부터 시작한다. 전 조합 커버는 비용상 비현실적이다.

## 주의·비용

- 한 사람이 처음 쓰는 낭독기로 테스트하면 앱의 문제와 숙련도 문제가 섞인다. 가능하면 낭독기 숙련 사용자 참여를 늘린다.
- 낭독기·브라우저 업데이트로 결과가 바뀐다. 버전을 기록하고 정기적으로 재실행한다.
- 이 스크립트가 통과해도 실제 사용성을 보장하지 않는다. 낭독기 사용자 참여 테스트가 대체되지 않는다.

## 체크리스트

- [ ] 환경(OS·낭독기·브라우저 버전)을 기록
- [ ] 기대는 "정보"로, 관찰은 "들은 내용 원문"으로 분리
- [ ] 못 한 항목은 `미확인`
- [ ] 키보드만으로 모든 단계 수행 가능 여부
- [ ] 실패는 재현 단계·마크업과 함께 이슈화
