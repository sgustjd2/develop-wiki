---
name: Polypane
url: https://polypane.app
docs: https://polypane.app/docs/
domain: frontend
category: performance-a11y
description: 여러 뷰포트를 나란히 띄워 스크롤·클릭·입력을 동기화하는 Chromium 기반 개발용 브라우저. 반응형 레이아웃과 대비·포커스 순서 같은 접근성 점검을 한 화면에서 할 때 쓴다.
pricing: paid
tags: [responsive, accessibility, browser, devtools, emulation]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Polypane은 웹 개발·QA 용도로 만든 Chromium 기반 브라우저다. 한 창에 모바일·태블릿·데스크톱 등 여러 **패널(pane)** 을 띄우고, 한 패널에서 스크롤·클릭·호버·포커스·키 입력을 하면 다른 패널에도 같은 동작이 반영된다. 2026-11-18 공개된 Polypane 32는 Chromium 160 기반이며 Windows·macOS·Linux를 지원한다.

- **요금:** 14일 무료 체험(카드 불필요) 후 유료 구독(Individual, Business, Enterprise). 상시 무료 플랜은 없고, 학생은 GitHub Student Developer Pack으로 무료 이용이 가능하다([요금](https://polypane.app/pricing/)). 구체 금액은 요금 페이지에서 확인한다.

## 시작하기
1. 공식 사이트에서 운영체제별 설치 파일을 받아 체험 계정으로 로그인한다.
2. 주소창에 로컬 개발 서버(`http://localhost:5173` 등)를 열고, 패널 추가 메뉴에서 기기 프리셋이나 사용자 정의 너비를 고른다.
3. 레이아웃 메뉴에서 패널 배치를 가로(Horizontal)·세로(Vertical)·포커스(Focus)·전체(Full) 등으로 바꾼다.

## 핵심 사용법
| 기능 | 쓰임 |
| --- | --- |
| 동기화 패널 | 브레이크포인트별 레이아웃을 동시에 보면서 상호작용 결과를 비교 |
| 접근성 검사 | 대비 검사, 포커스 순서 시각화, 접근성 관련 경고를 사이드바에서 확인 |
| 미디어 기능 에뮬레이션 | `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, reduced data 등을 패널별로 켜고 확인 |
| 개발자 도구 | Chromium DevTools 와 레이아웃 디버깅·스크린샷·색 선택기 같은 자체 도구 |

- **브레이크포인트 점검.** 패널을 CSS 브레이크포인트 경계(예: 767px·768px)에 맞춰 두고 레이아웃이 끊기는 지점을 찾는다.
- **사용자 설정 대응 확인.** 모션 줄이기·고대비·강제 색 모드에서 포커스 링과 아이콘이 보이는지 패널별로 확인한다.

## 언제 쓰나
- 쓸 때: 반응형 화면을 자주 만들고, 여러 해상도와 접근성 설정을 매번 수동으로 바꿔 보는 시간이 부담될 때.
- 피할 때(대안): 비용을 들이기 어렵다면 Chrome DevTools의 기기 모드·렌더링 탭 에뮬레이션과 [Accessibility Insights for Web](/develop-wiki/frontend/performance-a11y/accessibility-insights/)을 조합한다.

## 공식 문서
- [문서](https://polypane.app/docs/) · [요금](https://polypane.app/pricing/)
