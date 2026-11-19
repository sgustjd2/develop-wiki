---
title: NVDA 수동 테스트 키 (브라우즈 모드·포커스 모드)
aka: [NVDA Keyboard Commands, NVDA Browse Mode, NVDA Focus Mode, NVDA Quick Navigation, NVDA Elements List, NVDA 단축키, 브라우즈 모드]
category: ui-ux
group: accessibility
level: intermediate
summary: 웹을 NVDA 로 수동 점검할 때 필요한 키(NVDA 수식키, 브라우즈·포커스 모드 전환, 한 글자 빠른 탐색, 요소 목록, 표 탐색)를 NVDA 2026.3.1 공식 Commands Quick Reference 와 User Guide 기준으로 정리한 테스트용 참조표.
tags: [accessibility, screen-reader, nvda, windows, testing, manual-testing, browse-mode, keyboard]
related: [ui-ux/voiceover-manual-testing-keys, ui-ux/talkback-gestures-testing, ui-ux/screen-reader-manual-test-script-chart-grid, ui-ux/a11y-testing-strategy, ui-ux/accessible-table-vs-grid, ui-ux/keyboard-focus-management, ui-ux/combobox-autocomplete, ui-ux/live-regions-announcements]
sources:
  - https://download.nvaccess.org/documentation/keyCommands.html
  - https://download.nvaccess.org/documentation/userGuide.html
updatedAt: 2026-11-19
---

절차·기록 양식은 [차트·그리드 낭독기 수동 테스트 스크립트](/develop-wiki/knowledge/ui-ux/screen-reader-manual-test-script-chart-grid/), macOS·iOS 는 [VoiceOver 키·제스처](/develop-wiki/knowledge/ui-ux/voiceover-manual-testing-keys/), Android 는 [TalkBack 제스처](/develop-wiki/knowledge/ui-ux/talkback-gestures-testing/)에 있다. 기준: 2026-11-19 에 열람한 NVDA 2026.3.1 Commands Quick Reference 와 User Guide.

## 문제

- NVDA 는 웹 페이지를 **브라우즈 모드**(읽기 전용 평면 표현, 화살표로 읽음)로 보여 주고, 입력 컨트롤에서는 **포커스 모드**(키를 페이지로 그대로 전달)로 바꾼다. 이 전환을 모르면 "화살표가 안 먹는다", "단축키가 글자로 입력된다" 같은 현상을 앱 버그로 오인한다.
- 커스텀 위젯(콤보박스, 그리드, 메뉴)은 이 전환이 맞게 일어나는지가 핵심 점검 항목이다.

## 해법

### 1. 수식키와 기본

`NVDA` = NVDA 수식키. User Guide 는 Insert 와 숫자패드 Insert 가 기본 수식키라고 쓴다. 키보드 설정에서 Caps Lock 도 수식키로 체크할 수 있다. 키보드 배열은 데스크톱·랩톱 두 가지가 있고 일부 명령이 다르다.

| 동작 | 데스크톱 | 랩톱 |
| --- | --- | --- |
| NVDA 시작 (설치 때 바로 가기를 켠 경우) | Ctrl+Alt+N | Ctrl+Alt+N |
| NVDA 종료 | NVDA+Q | NVDA+Q |
| 말하기 중지 / 일시정지 | Ctrl / Shift | Ctrl / Shift |
| 말하기 모드 순환 | NVDA+S | NVDA+S |
| NVDA 메뉴 | NVDA+N | NVDA+N |
| 입력 도움말(누른 키 이름만 읽기) 켜기/끄기 | NVDA+1 | NVDA+1 |
| 현재 포커스 읽기 | NVDA+Tab | NVDA+Tab |
| 창 제목 읽기 | NVDA+T | NVDA+T |
| 모두 읽기 | NVDA+↓ | NVDA+A |
| 수면 모드(현재 앱에서 NVDA 끄기) | NVDA+Shift+S | NVDA+Shift+Z |

### 2. 브라우즈 모드 ↔ 포커스 모드

| 동작 | 키 |
| --- | --- |
| 브라우즈/포커스 모드 전환 | NVDA+Space |
| 포커스 모드 → 브라우즈 모드 | Escape (NVDA 가 **자동으로** 포커스 모드로 바꾼 경우에만) |
| 다음 키를 NVDA 를 거치지 않고 전달 | NVDA+F2 |
| 브라우즈 모드 문서 새로 고침 | NVDA+F5 |
| 컨테이너(목록·표) 시작으로 / 끝 뒤로 | Shift+, / , |

- 자동 전환(User Guide): 편집 필드·목록처럼 포커스 모드가 필요한 컨트롤에 Tab 하거나 클릭하면 포커스 모드로 바뀌고, 필요 없는 컨트롤로 가면 브라우즈 모드로 돌아온다. 그런 컨트롤에서 Enter·Space 를 눌러도 포커스 모드가 된다.
- 관련 설정(브라우즈 모드 설정): "Automatic focus mode for focus changes", "Automatic focus mode for caret movement", "Audio indication of Focus and Browse modes". 기본값은 읽은 범위에서 확인하지 못했다. 테스트 기기 설정값을 기록한다.
- 같은 설정 화면에서 기본값이 문서에 적힌 것: 페이지 로드 때 브라우즈 모드 사용(켜짐), 페이지 로드 때 자동 모두 읽기(켜짐), 레이아웃 표 포함(꺼짐), 명령이 아닌 키를 문서로 보내지 않음(켜짐).

### 3. 한 글자 빠른 탐색 (브라우즈 모드, Shift 를 함께 누르면 이전)

| 키 | 대상 | 키 | 대상 |
| --- | --- | --- | --- |
| H | 제목 | 1~9 | 해당 수준 제목 |
| L / I | 목록 / 목록 항목 | T | 표 |
| K / U / V | 링크 / 방문 안 한 링크 / 방문한 링크 | N | 링크 아닌 텍스트 |
| P | 문단 | Q | 인용 블록 |
| F | 폼 필드 | E | 편집 필드 |
| B | 버튼 | X | 체크박스 |
| C | 콤보박스 | R | 라디오 버튼 |
| D | 랜드마크 | G | 그래픽 |
| M | 프레임 | S | 구분선 |
| O | 삽입 객체(미디어 플레이어, 애플리케이션, 대화상자 등) | A / W | 주석 / 맞춤법 오류 |

- 문서는 제목 수준을 1~9 까지 적는다(HTML 은 6까지).

### 4. 찾기·요소 목록

| 동작 | 키 |
| --- | --- |
| 요소 목록(링크·제목·폼 필드·버튼·랜드마크 등) | NVDA+F7 |
| 찾기 / 다음 / 이전 | NVDA+Ctrl+F / NVDA+F3 / NVDA+Shift+F3 |
| 화면 배치 사용 전환 | NVDA+V |

- 요소 목록은 제목 구조·이름 없는 링크·중복 랜드마크를 한 번에 확인하는 데 쓴다([접근 가능한 이름](/develop-wiki/knowledge/ui-ux/screen-reader-accessible-name/)).

### 5. 표 탐색 (표 안에서)

| 동작 | 키 |
| --- | --- |
| 이전/다음 열 | Ctrl+Alt+← / → |
| 이전/다음 행 | Ctrl+Alt+↑ / ↓ |
| 첫/마지막 열 | Ctrl+Alt+Home / End |
| 첫/마지막 행 | Ctrl+Alt+PageUp / PageDown |

- [표와 그리드](/develop-wiki/knowledge/ui-ux/accessible-table-vs-grid/) 점검: 브라우즈 모드 표 탐색으로 머리글이 셀과 함께 읽히는지, `role="grid"` 에서는 포커스 모드로 바뀌어 앱의 화살표 처리가 동작하는지 각각 본다.
- NVDA+Shift+C / NVDA+Shift+R(열·행 머리글 지정)은 User Guide 에서 Word·Excel 용으로 설명된다. 웹 표에 쓰지 않는다.

### 6. 점검 순서 예 (필자 제안)

1. 페이지 진입 → H 로 제목 순회, D 로 랜드마크 순회, NVDA+F7 로 목록 확인.
2. 폼: F/E 로 필드 이동 → Tab 으로 들어갔을 때 포커스 모드 전환음·안내 확인 → Escape 로 빠져나오기.
3. 콤보박스·그리드: 포커스 모드에서 화살표가 앱에 전달되는지, 선택 변화가 읽히는지([콤보박스](/develop-wiki/knowledge/ui-ux/combobox-autocomplete/)).
4. 동적 알림: 저장 후 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/) 문구가 읽히는지.

## 언제 쓰나

- Windows 데스크톱 사용자가 있는 서비스의 출시 전 핵심 흐름 점검(NVDA + Chrome·Firefox·Edge).
- 커스텀 위젯이 브라우즈/포커스 모드 전환과 충돌하지 않는지 확인할 때.

## 주의·비용

- 키는 NVDA 버전·키보드 배열(데스크톱/랩톱)·사용자 설정(입력 제스처 변경)에 따라 다르다. 기록에 NVDA 버전·배열·브라우저를 남긴다.
- 한 글자 빠른 탐색은 브라우즈 모드에서만 동작한다. 포커스 모드에서 누르면 페이지에 글자가 입력된다.
- 앱이 `role="application"` 이나 전역 단축키로 키를 가로채면 브라우즈 모드 탐색이 망가진다. 단축키를 넣을 때 NVDA 로 같이 확인한다.
- 개발자의 점검은 숙련 사용자 사용을 대체하지 않는다([접근성 테스트 전략](/develop-wiki/knowledge/ui-ux/a11y-testing-strategy/)).

## 검증 범위

- 확인함: 표의 키는 NVDA 2026.3.1 Commands Quick Reference 원문(데스크톱·랩톱 열). 수식키 기본값, 자동 전환 조건, Escape 조건, 수면 모드 키, 브라우즈 모드 설정 중 기본값이 적힌 항목은 같은 판 User Guide(2026-11-19 열람).
- 확인 못 함: 자동 포커스 모드 두 설정과 소리 안내 설정의 기본값, 음성 뷰어(Speech Viewer)의 위치·단축키, 브라우저별 차이. 이 노트는 NVDA 를 실제로 실행해 듣고 확인하지 않았다(작성 환경이 macOS).
