---
name: Sketch
url: https://www.sketch.com
docs: https://www.sketch.com/docs/
domain: frontend
category: design-tools
description: macOS 네이티브 UI 디자인·프로토타이핑 도구. 오프라인 Mac 앱으로 디자인하고, 웹 앱에서 개발자가 무료 뷰어로 문서를 검사(Inspect)해 구현하는 흐름에 쓴다.
pricing: paid
tags: [design, prototyping, handoff, macos]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Sketch는 Mac 전용 네이티브 앱으로 시작한 UI 디자인 도구다. 디자인 편집은 Mac 앱에서만 가능하고, 웹 앱에서는 문서 열람·코멘트·Inspect(핸드오프)를 하며 iPhone·iPad 앱으로 디자인과 프로토타입을 확인한다. 2026-11 기준 최신 버전은 Sketch 2026.4 이고 macOS Sequoia(15.0) 이상이 필요하다.

## 요금 (2026-11 확인)
| 플랜 | 가격 | 내용 |
| --- | --- | --- |
| Standard 구독 | Editor 1인당 $12/월(연간 결제) | 실시간 협업, 무제한 문서, 개발자 핸드오프, 버전 기록, MCP 서버 포함 |
| Mac-only 라이선스 | 좌석당 $120 일회성(1년 업데이트 포함) | 오프라인 Mac 앱만. 협업·온라인 공유·iOS 미리보기 제외 |

- 30일 무료 체험(카드 불필요, Mac-only 라이선스는 체험 없음). 상시 무료 플랜은 없고, 문서를 보기·코멘트·Inspect 하는 **Viewer 는 무료**다. 학생·교사·교육기관용 무료 Education 프로그램이 있다([요금](https://www.sketch.com/pricing/)).

## 시작하기
1. Mac 에서 체험판을 설치하고 Workspace 를 만든다.
2. 개발자는 Workspace 멤버(무료 Viewer)로 초대받거나, 문서 공유 설정의 "Can download and inspect" 가 켜진 Guest 로 초대받아 브라우저에서 문서를 연다. Mac 이 없어도 된다.
3. 레이어를 선택해 Inspect 에서 속성을 확인하고 Export 로 에셋을 내려받는다.

## 핵심 사용법
- **Components·Libraries.** 반복 요소를 Component 로 만들고(예전 이름 Symbols) Library 로 여러 문서에 공유해 디자인 시스템을 관리한다.
- **Color Variables·스타일.** 색과 텍스트·레이어 스타일에 이름을 붙여 재사용한다. 코드의 디자인 토큰과 이름을 맞춰 두면 핸드오프 때 대응시키기 쉽다.
- **Prototyping.** 아트보드 간 링크와 전환으로 클릭형 프로토타입을 만들고 웹·iPhone 에서 재생한다.

## 언제 쓰나
- 쓸 때: 디자인 팀이 이미 Sketch 를 쓰고 있거나, 오프라인·Mac 네이티브 환경이 중요한 경우. 개발자는 무료 Viewer 로 핸드오프만 받으면 된다.
- 피할 때(대안): Windows·Linux 사용자가 편집해야 하거나 브라우저 기반 실시간 협업이 중심이면 [Figma](/develop-wiki/frontend/design-tools/figma/), 오픈소스가 필요하면 [Penpot](/develop-wiki/oss/self-hosted/penpot/).

## 공식 문서
- [문서](https://www.sketch.com/docs/) · [요금](https://www.sketch.com/pricing/) · [업데이트 기록](https://www.sketch.com/updates/)
