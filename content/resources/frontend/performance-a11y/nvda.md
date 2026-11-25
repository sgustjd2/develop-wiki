---
name: NVDA
url: https://www.nvaccess.org/about-nvda/
docs: https://download.nvaccess.org/documentation/userGuide.html
repo: https://github.com/nvaccess/nvda
stars: 2696
domain: frontend
category: performance-a11y
description: Windows 용 무료·오픈소스 스크린 리더. 자동 검사로는 알 수 없는 읽기 순서, 접근 가능한 이름, 라이브 영역 안내를 실제 보조기술로 확인하는 수동 접근성 테스트에 쓴다.
pricing: oss
tags: [accessibility, screen-reader, manual-testing, windows]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
NVDA(NonVisual Desktop Access)는 호주 비영리단체 NV Access가 만드는 Windows 스크린 리더다. 시각장애 사용자가 실제로 많이 쓰며, 무료라서 웹 개발자가 Chrome·Firefox·Edge 에서 화면 낭독 동작을 확인하는 기본 도구로 쓰인다. GPL-2.0 이상(예외 조항 포함) 라이선스. 최신 버전 2026.3.1(GitHub 릴리스 2026-11-09)이며 Windows 10 이상(64비트)을 지원한다. 다운로드는 무료이고 기부는 선택이다.

- 사용자 가이드 기준으로 인터페이스 언어와 입력기(IME) 지원 목록에 한국어가 포함된다.

## 설치
1. [nvaccess.org/download](https://www.nvaccess.org/download/)에서 설치 파일을 받는다(기부 금액 선택 화면에서 기부 없이 진행 가능).
2. 설치 중 바탕화면 바로 가기를 만들면 `Ctrl+Alt+N` 으로 NVDA를 켤 수 있다.
3. 테스트 PC에 설치하지 않고 휴대용(portable) 버전을 만들어 쓸 수도 있다.

## 핵심 사용법
NVDA 키는 기본적으로 `Insert` 다. 웹 페이지에서는 **browse 모드**(가상 커서로 문서를 탐색)와 **focus 모드**(입력 컨트롤에 키 입력 전달)를 오간다.

| 키 | 동작 |
| --- | --- |
| `NVDA+Space` | browse ↔ focus 모드 전환 |
| `H` / `D` / `K` / `F` / `T` | 다음 제목 / 랜드마크 / 링크 / 폼 필드 / 표 (browse 모드) |
| `NVDA+F7` | 요소 목록(링크·제목·랜드마크 등) |
| `Ctrl` | 읽기 중지 |
| `NVDA+Q` | NVDA 종료 |

- **Speech Viewer.** 도구 메뉴의 Speech Viewer를 켜면 낭독 내용이 창에 텍스트로 표시돼 소리 없이도 확인하고 기록할 수 있다.
- **점검 순서 예.** 제목 목록(`NVDA+F7`)으로 구조 확인 → `Tab` 으로 포커스 이동하며 버튼·링크 이름 확인 → 폼 오류·토스트가 라이브 영역으로 안내되는지 확인.

## 언제 쓰나
- 커스텀 컴포넌트(콤보박스, 모달, 탭)를 만든 뒤 ARIA 속성이 의도대로 읽히는지 확인할 때. 패턴별 기대 동작은 [WAI-ARIA APG](/develop-wiki/frontend/learning/wai-aria-apg/)를 기준으로 삼는다.
- 자동 검사([axe-core](/develop-wiki/frontend/performance-a11y/axe-core/))로 잡히지 않는 문제를 찾는 수동 테스트 단계에서.
- macOS·iOS 에서는 [VoiceOver](/develop-wiki/frontend/performance-a11y/voiceover/)로 같은 시나리오를 확인한다.

## 공식 문서
- [사용자 가이드](https://download.nvaccess.org/documentation/userGuide.html) · [키 명령 요약](https://download.nvaccess.org/documentation/keyCommands.html) · [다운로드](https://www.nvaccess.org/download/)
