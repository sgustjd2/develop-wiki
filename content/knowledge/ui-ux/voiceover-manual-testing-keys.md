---
title: VoiceOver 수동 테스트 키·제스처 (macOS·iOS)
aka: [VoiceOver Testing Commands, VO keys, VoiceOver Rotor, VoiceOver Gestures, 보이스오버 단축키, 로터]
category: ui-ux
group: accessibility
level: intermediate
summary: 웹·앱을 VoiceOver 로 수동 점검할 때 필요한 macOS 키 명령(VO 수식키, 이동, 상호작용, 로터, 표·제목 탐색)과 iOS 제스처를 Apple 공식 사용 설명서 기준으로 정리한 테스트용 참조표.
tags: [accessibility, screen-reader, voiceover, macos, ios, testing, manual-testing, rotor]
related: [ui-ux/screen-reader-manual-test-script-chart-grid, ui-ux/a11y-testing-strategy, ui-ux/accessible-table-vs-grid, ui-ux/screen-reader-accessible-name, ui-ux/live-regions-announcements, ui-ux/virtualized-list-accessibility, mobile-dev/mobile-accessibility-basics]
sources:
  - https://support.apple.com/guide/voiceover/general-commands-cpvokys01/mac
  - https://support.apple.com/guide/voiceover/navigation-commands-cpvokys04/mac
  - https://support.apple.com/guide/voiceover/interaction-commands-cpvokys07/mac
  - https://support.apple.com/guide/voiceover/search-commands-cpvokys08/mac
  - https://support.apple.com/guide/voiceover/web-commands-vo27972/mac
  - https://support.apple.com/guide/voiceover/voiceover-rotor-mchlp2719/mac
  - https://support.apple.com/guide/voiceover/quick-nav-vo27943/mac
  - https://support.apple.com/guide/iphone/use-voiceover-gestures-iph3e2e2281/ios
  - https://support.apple.com/guide/iphone/control-voiceover-using-the-rotor-iph3e2e3a6d/ios
updatedAt: 2026-11-19
---

테스트 절차·기록 양식은 [차트·그리드 낭독기 수동 테스트 스크립트](/develop-wiki/knowledge/ui-ux/screen-reader-manual-test-script-chart-grid/)에 있다. 이 노트는 그 스크립트를 VoiceOver 로 돌릴 때 필요한 **키와 제스처**만 모은다. 기준: 2026-11-19 에 열람한 Apple VoiceOver 사용 설명서(macOS 27 판)와 iPhone 사용 설명서(iOS 27 판).

## 문제

- VoiceOver 는 NVDA 와 조작 모델이 다르다(가상 버퍼 대신 VoiceOver 커서와 "상호작용" 단계). NVDA 습관대로 화살표만 누르면 아무것도 읽히지 않거나 페이지를 건너뛴다.
- 키 조합이 macOS 버전마다 조금씩 바뀐다. 기억에 의존해 스크립트에 적으면 틀린다.

## 해법

### 1. macOS: 기본

`VO` = VoiceOver 수식키. 기본값은 **Control+Option** 또는 **Caps Lock**. F1~F12 가 들어간 명령은 기본적으로 Fn 도 함께 누른다.

| 동작 | 키 |
| --- | --- |
| VoiceOver 켜기/끄기 | Command-F5 (Touch ID 가 있으면 Command 를 누른 채 Touch ID 세 번) |
| 수식키 잠금/해제 | VO-; |
| 키보드 도움말 시작 | VO-K |
| 명령 메뉴 | VO-H-H |
| 메뉴·로터 닫기, 동작 중지 | Escape 또는 Fn-Tab |
| VoiceOver 유틸리티 | VO-Fn-F8 |

### 2. macOS: 이동과 상호작용

| 동작 | 키 |
| --- | --- |
| 다음/이전 항목 | VO-→ / VO-← |
| 그룹 안으로 들어가기 / 나오기 | VO-Shift-↓ / VO-Shift-↑ |
| 앱 최상위로 | VO-Shift-Escape |
| 웹에서 그룹에 자동으로 들어가지 않고 이동 | VO-Shift-← / → |
| 기본 동작(클릭) | VO-Space |
| 현재 위치부터 끝까지 읽기 / 처음부터 현재까지 | VO-A / VO-B |
| VoiceOver 커서 → 키보드 포커스 위치로 | VO-Shift-Fn-F4 |
| 키보드 포커스 → VoiceOver 커서 위치로 | VO-Fn-Command-F4 |

- 마지막 두 명령은 포커스 관리 버그를 찾을 때 쓴다. 키보드 포커스와 VoiceOver 커서는 다를 수 있다(커서 추적 설정에 따름). 모달을 연 뒤 두 위치가 어디인지 각각 확인한다.

### 3. macOS: 구조 탐색 (제목·표·로터)

| 동작 | 키 |
| --- | --- |
| 다음/이전 제목 | VO-Command-H / VO-Command-Shift-H |
| 같은 수준의 다음 제목 | VO-Command-M |
| 다음 링크 / 표 / 컨트롤 | VO-Command-L / VO-Command-T / VO-Command-J |
| 행 머리글 / 열 머리글 읽기 | VO-R / VO-C |
| 현재 셀의 행·열 번호 | VO-Shift-T |
| 표의 행·열 개수 | VO-Shift-T-T |
| 로터 메뉴 열기 | VO-U (←/→ 로 목록 전환, ↑/↓ 로 항목, 글자 입력으로 필터, Return 으로 이동) |
| 로터 바로 쓰기 | VO-Command-←/→ 로 모드 선택, VO-Command-↑/↓ 로 이동 (macOS 26·27 문서에 있음, 15 문서에는 없음) |
| 항목 선택기(Item Chooser) | VO-I |
| 표 안 항목 묶어 읽기 켜기/끄기 | VO-Command-= |

- 표 점검: [그리드](/develop-wiki/knowledge/ui-ux/accessible-table-vs-grid/)·[가상화 목록](/develop-wiki/knowledge/ui-ux/virtualized-list-accessibility/)에서 VO-Shift-T-T 로 들리는 행 수가 `aria-rowcount` 와 맞는지, VO-Shift-T 의 행 번호가 `aria-rowindex` 와 맞는지 기록한다.
- 로터의 제목·랜드마크·링크 목록은 페이지 구조를 한 번에 훑어볼 수 있다. 이름 없는 링크·중복 제목이 여기서 드러난다([접근 가능한 이름](/develop-wiki/knowledge/ui-ux/screen-reader-accessible-name/)).
- Quick Nav: VO-Shift-Q(화살표 키 Quick Nav), VO-Q(단일 키 Quick Nav, 예: B 다음 버튼, 1 다음 제목 1). 테스트 중 켜져 있으면 일반 화살표 키 동작이 바뀌므로 시작 전에 상태를 기록한다.

### 4. iOS 제스처

| 동작 | 제스처 |
| --- | --- |
| 다음/이전 항목 | 오른쪽/왼쪽으로 쓸기 |
| 선택 항목 실행 | 두 번 탭 |
| 그룹 안으로 / 밖으로 | 두 손가락 오른쪽/왼쪽 쓸기 |
| 화면 처음부터 읽기 / 선택 항목부터 읽기 | 두 손가락 위로 / 아래로 쓸기 |
| 말하기 일시정지·재개 | 두 손가락 탭 |
| 추가 정보(목록 내 위치 등) | 세 손가락 탭 |
| 한 페이지 스크롤 | 세 손가락 쓸기 (위로 쓸면 아래로 스크롤) |
| 닫기·뒤로 | 두 손가락 문지르기(“z” 모양) |
| 항목 선택기 | 두 손가락 세 번 탭 |
| 화면 커튼 | 세 손가락 세 번 탭 |
| 로터 | 두 손가락으로 다이얼 돌리듯 회전 → 위/아래로 쓸어 해당 단위로 이동 |

- 켜기·끄기: 설정 > 손쉬운 사용 > VoiceOver, 손쉬운 사용 단축키, 제어 센터, Siri.
- 로터 항목은 맥락에 따라 달라지고 설정 > 손쉬운 사용 > VoiceOver > 로터에서 추가·정렬한다. 테스트 기기마다 로터 구성이 다를 수 있으니 기록에 남긴다.
- 세 손가락 탭의 "목록 내 위치" 정보는 `aria-setsize`/`aria-posinset` 확인에 쓸 수 있다. 실제로 어떻게 읽히는지는 관찰해서 적는다.

## 언제 쓰나

- 출시 전 핵심 흐름(가입·결제·주요 표·모달)의 macOS Safari + VoiceOver, iOS Safari + VoiceOver 점검.
- 자동 검사로 못 잡는 포커스 이동·읽기 순서·라이브 영역 알림 확인([접근성 테스트 전략](/develop-wiki/knowledge/ui-ux/a11y-testing-strategy/)).

## 주의·비용

- 위 키는 확인 시점 macOS 27·iOS 27 문서 기준이다. 사용 설명서는 버전 선택이 가능하니 **테스트 기기의 OS 버전 문서**를 본다(예: 로터 바로 쓰기 키는 macOS 15 문서에 없다).
- 사용자가 수식키·제스처를 바꿀 수 있다(VoiceOver 유틸리티 > 명령). 공용 테스트 기기는 기본값으로 초기화해 둔다.
- 개발자의 VoiceOver 점검은 숙련 사용자의 사용과 다르다. 탐색 전략이 달라 문제를 놓치거나 과장할 수 있다. 실제 사용자 테스트를 대체하지 않는다.
- 낭독 문구는 버전·음성·상세도(Verbosity, VO-V) 설정에 따라 달라진다. 기록에 OS·브라우저·상세도를 함께 남긴다.

## 검증 범위

- 확인함: 표의 모든 키·제스처는 위 Apple 사용 설명서 페이지 원문(2026-11-19 열람, macOS 27·iOS 27 판). 로터 바로 쓰기 키의 판 간 차이는 macOS 15·26 판 같은 페이지를 비교해 확인.
- 확인 못 함: 각 명령이 Safari 외 브라우저(Chrome·Firefox)에서 같은 결과를 내는지, 외부 키보드를 연결한 iPad·iPhone 의 키 명령, Mac 트랙패드 제스처. 이 노트는 실제 VoiceOver 를 켜고 확인하지 않았다.
