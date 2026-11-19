---
title: Android TalkBack 수동 테스트 제스처
aka: [TalkBack Gestures, TalkBack Reading Controls, TalkBack Menu, Explore by Touch, 톡백 제스처, 읽기 컨트롤]
category: ui-ux
group: accessibility
level: intermediate
summary: 앱·모바일 웹을 Android TalkBack 으로 수동 점검할 때 필요한 제스처(항목 이동, 실행, 스크롤, 읽기 컨트롤, TalkBack 메뉴, 시스템 동작)를 Android 접근성 도움말 공식 문서 기준으로 정리하고, 기기·버전별 차이와 문서 간 불일치를 표시한 참조표.
tags: [accessibility, screen-reader, talkback, android, mobile, testing, manual-testing, gestures]
related: [ui-ux/voiceover-manual-testing-keys, ui-ux/nvda-browse-focus-mode-keys, ui-ux/screen-reader-manual-test-script-chart-grid, ui-ux/a11y-testing-strategy, ui-ux/touch-target-size, ui-ux/screen-reader-accessible-name, mobile-dev/mobile-accessibility-basics]
sources:
  - https://support.google.com/accessibility/android/answer/6151827?hl=en
  - https://support.google.com/accessibility/android/answer/6006598?hl=en
updatedAt: 2026-11-19
---

macOS·iOS 는 [VoiceOver 키·제스처](/develop-wiki/knowledge/ui-ux/voiceover-manual-testing-keys/), Windows 는 [NVDA 키](/develop-wiki/knowledge/ui-ux/nvda-browse-focus-mode-keys/)에 있다. 모바일 접근성 구현 기본은 [모바일 접근성 기본](/develop-wiki/knowledge/mobile-dev/mobile-accessibility-basics/). 기준: 2026-11-19 에 열람한 Android 접근성 도움말 "Use TalkBack gestures", "Navigate your device with TalkBack"(영문판).

## 문제

- TalkBack 이 켜지면 한 손가락 제스처 의미가 바뀐다. 스크롤은 두 손가락이 되고, 탭은 "선택(읽기)", 두 번 탭이 "실행"이 된다. 평소대로 조작하면 테스트가 진행되지 않는다.
- 다중 손가락 제스처 지원 여부가 기기·Android 버전에 따라 다르다. 같은 스크립트가 기기마다 다르게 동작한다.

## 해법

### 1. 기기 확인

- 도움말 기준: 한 손가락 제스처는 모든 기기, 다중 손가락 제스처는 업데이트된 Android R(11) 기기·Pixel 3·일부 제조사 기기(Samsung Galaxy 등).
- 확인 방법: TalkBack 을 켠 채 **세 손가락 탭**. TalkBack 메뉴가 열리면 다중 손가락 제스처를 지원한다.
- 도움말 표는 "TalkBack 9.1 이상"과 "8.2 이하"로 나뉜다. 현재 배포 중인 TalkBack 최신 버전 번호는 이 페이지에서 확인하지 못했다. 테스트 기록에 기기·Android·TalkBack 버전을 적는다.

### 2. 이동과 실행

| 동작 | 제스처 |
| --- | --- |
| 다음 / 이전 항목 | 오른쪽 / 왼쪽으로 쓸기 |
| 손가락 아래 항목 읽기(터치 탐색) | 한 손가락으로 천천히 끌기 |
| 항목 선택(읽기) | 탭 |
| 선택한 항목 실행 | 두 번 탭 (화면 어디서나) |
| 길게 누르기 | 두 번 탭 후 누르고 있기 |
| 스크롤 | 두 손가락 쓸기 (상하좌우) |
| 슬라이더 올리기 / 내리기 | 위로(또는 오른쪽→왼쪽) / 아래로(또는 왼쪽→오른쪽) |
| 다음 항목부터 읽기 (9.1+) | 두 손가락 세 번 탭 |
| 화면 검색 | 왼쪽→아래 (한 동작) |

### 3. 읽기 컨트롤 (제목·링크·컨트롤 단위 이동)

- 읽기 컨트롤은 위/아래 쓸기가 무엇 단위로 움직일지 정한다. 기본 목록: 글자·단어·줄·문단, **제목, 컨트롤, 링크**, 말하기 속도·언어·화면 검색. 추가 가능: 랜드마크, 기본 탐색, 상세도 등(TalkBack 설정 > 메뉴 맞춤설정 > 읽기 컨트롤 맞춤설정).
- 컨트롤 바꾸기: 위→아래 또는 아래→위를 한 동작으로. 다중 손가락 기기는 세 손가락 쓸기도 쓸 수 있다.
- 선택한 단위로 이동: 한 손가락 아래로 쓸기(다음) / 위로 쓸기(이전).
- **문서 간 불일치:** 다중 손가락 기기에서 읽기 컨트롤을 바꾸는 세 손가락 쓸기 방향이 "Use TalkBack gestures" 표에는 아래/위로, "Navigate your device with TalkBack" 에는 오른쪽/왼쪽으로 적혀 있다. 실제 기기에서 확인해 기록한다.
- 웹 점검: 읽기 컨트롤을 "제목"으로 두고 위아래로 쓸어 제목 구조를, "컨트롤"로 두고 폼 요소를 순회한다(VoiceOver 로터·NVDA 빠른 탐색에 해당).

### 4. TalkBack 제어 (9.1 이상, 다중 손가락)

| 동작 | 제스처 |
| --- | --- |
| 말하기 일시정지·재개 | 두 손가락 탭 |
| 미디어 재생·정지 | 두 손가락 두 번 탭 |
| TalkBack 메뉴 | 세 손가락 탭, 또는 아래→오른쪽 |
| 제스처 연습 | 네 손가락 탭 |
| TalkBack 도움말 | 네 손가락 두 번 탭 |
| 다음 제스처를 TalkBack 없이 전달 | 네 손가락 두 번 탭 후 누르고 있기 |
| 포커스 항목 텍스트 복사 | 세 손가락 두 번 탭 |

### 5. 시스템 동작

| 동작 | 한 손가락 | 다중 손가락 (9.1+, 제스처 탐색 켜짐) |
| --- | --- | --- |
| 홈 | 위→왼쪽 | 아래 가장자리에서 두 손가락 위로 |
| 뒤로 | 아래→왼쪽 | 왼쪽·오른쪽 가장자리에서 두 손가락 쓸기 |
| 최근 앱 | 왼쪽→위 | 아래에서 두 손가락 위로 쓸고 유지 |
| 알림 | 오른쪽→아래 | 위에서 두 손가락 아래로 |

- 두 손가락 쓸기 제스처는 다시 지정할 수 없고, 나머지는 TalkBack 설정에서 바꿀 수 있다(도움말 기준).
- 물리 키보드: 화면 검색 Alt+Ctrl+/, 연속 읽기 중 건너뛰기 Alt+→/←. 전체 키보드 단축키 목록은 별도 페이지이며 이 노트에서는 읽지 않았다.

## 언제 쓰나

- Android 사용자 비중이 있는 앱·모바일 웹의 출시 전 핵심 흐름(가입·결제·설정) 점검.
- 아이콘 버튼 이름, 읽기 순서, 커스텀 컨트롤의 실행 가능 여부, 두 손가락 스크롤 영역(가로 캐러셀) 확인.

## 주의·비용

- 사용자가 제스처를 재지정할 수 있다. 공용 테스트 기기는 기본값으로 두고 시작 전 상태를 기록한다.
- 제조사 기기(Samsung 등)는 자체 설정 메뉴 구조가 다를 수 있다. 이 노트는 Google 도움말 기준이다.
- 화면 어디서나 두 번 탭이 "실행"이므로, 앱이 터치 좌표에 의존하는 제스처(드래그 정렬, 서명 패드)를 쓰면 TalkBack 사용자 대안이 필요하다. 패스스루 제스처는 사용자가 쓰기 어려운 수단이다(필자 의견).
- 개발자의 점검은 숙련 사용자 사용과 다르다. 실제 사용자 테스트를 대체하지 않는다.

## 검증 범위

- 확인함: 표의 제스처·버전 구분·설정 경로·키보드 2개는 위 두 Google 도움말 페이지 원문(2026-11-19 열람, 영문).
- 확인 못 함: 현재 TalkBack 최신 버전 번호와 그 버전의 변경, 한국어 도움말과의 차이, 세 손가락 쓸기 방향 불일치의 정답, 키보드 단축키 전체 목록, 브라우저(Chrome)에서 웹 콘텐츠 읽기 컨트롤 동작. 실제 기기에서 TalkBack 을 켜고 확인하지 않았다.
