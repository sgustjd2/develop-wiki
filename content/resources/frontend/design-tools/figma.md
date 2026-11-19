---
name: Figma
url: https://www.figma.com
docs: https://help.figma.com/hc/en-us
domain: frontend
category: design-tools
description: 브라우저와 데스크톱에서 쓰는 협업형 UI 디자인·프로토타이핑 도구. Dev Mode 로 간격·색·변수를 검사하고 코드 스니펫을 받아 디자인을 구현하는 핸드오프에 쓴다.
pricing: freemium
tags: [design, prototyping, handoff, dev-mode, variables, design-tokens]
languages: []
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Figma는 웹 브라우저(및 데스크톱 클라이언트)에서 여러 사람이 같은 파일을 동시에 편집하는 UI 디자인 도구다. 디자이너는 컴포넌트·Auto layout·Variables로 화면과 디자인 시스템을 만들고, 개발자는 **Dev Mode** 에서 레이어 속성과 코드 스니펫을 확인해 구현한다. 소스 비공개 SaaS이며 릴리스 노트 기준으로 2026-11에도 기능 업데이트가 이어지고 있다. 도움말 센터는 [한국어판](https://help.figma.com/hc/ko)을 제공한다.

- 오픈소스 대안은 [Penpot](/develop-wiki/oss/self-hosted/penpot/), 에이전트에 디자인 컨텍스트를 주는 공식 MCP 서버는 [Figma MCP Server](/develop-wiki/oss/mcp-servers/figma-mcp-server/) 항목을 본다.

## 요금과 플랜별 기능 (2026-11 확인)
| 플랜 | 좌석 가격(월, USD) |
| --- | --- |
| Starter | 무료 (제한된 접근) |
| Professional | Full $16 · Dev $12 · Collab $3 (연간 결제 기준, 월 결제는 더 비쌈) |
| Organization | Full $55 · Dev $25 · Collab $5 (연간 결제) |
| Enterprise | Full $90 · Dev $35 · Collab $5 (연간 결제) |

- **Dev Mode:** 도움말 문서상 제공 플랜은 Professional, Education, Organization, Government, Enterprise 다. **Starter(무료)는 목록에 없다.** 요금 페이지는 Dev 좌석이 Dev Mode 전체 접근을 포함한다고 적는다. 플랜 안에서 어떤 좌석 유형까지 Dev Mode 를 쓸 수 있는지는 확인하지 못했다(미확인). Code Connect 는 Professional·Organization·Enterprise 에서 제공한다.
- **Variables:** 도움말 문서의 기능 요약은 "All plans"(모든 플랜)다. 다만 팀 라이브러리로 변수 게시와 프로토타입에서 변수 사용은 Professional 이상(Education·Government 포함)에서만 된다. 컬렉션당 모드 수는 플랜별로 다르다고만 나와 있고, 플랜별 개수는 공식 문서에서 확정하지 못했다(미확인).

## 시작하기
1. figma.com 에서 계정을 만들고 브라우저에서 바로 쓰거나, [다운로드](https://www.figma.com/downloads/) 페이지에서 데스크톱 앱을 설치한다.
2. 공유받은 디자인 파일을 열고, 개발자는 툴바의 Dev Mode 토글(단축키 `Shift+D`)로 전환한다.
3. VS Code 에서 보려면 Figma for VS Code 확장으로 같은 파일을 연다.

## 핵심 사용법 (개발자 관점)
| 기능 | 쓰임 |
| --- | --- |
| Inspect | 선택한 레이어의 크기·간격·타이포그래피, 적용된 스타일·변수, 내보내기 설정과 에셋 다운로드 |
| 코드 스니펫 | 언어·단위를 고르거나 codegen 플러그인으로 CSS·iOS·Android 등 코드 표시 |
| Ready for dev | 디자이너가 개발 준비 완료로 표시한 프레임·섹션만 모아 보고, 변경 사항 비교 |
| Variables | 색·숫자 등 값을 변수로 정의하고 모드(라이트/다크, 브랜드)로 전환. 코드 쪽 디자인 토큰과 이름을 맞춘다 |
| Code Connect | 디자인 시스템 컴포넌트에 실제 코드 컴포넌트 사용 예를 연결해 자동 생성 코드 대신 보여 준다 |

- **토큰 파이프라인.** 변수를 코드로 옮길 때는 [Tokens Studio](/develop-wiki/frontend/styling/tokens-studio/) 플러그인이나 REST API 로 JSON 을 뽑아 [Style Dictionary](/develop-wiki/frontend/styling/style-dictionary/)로 빌드하는 방식이 흔하다.
- **간격은 Auto layout 기준으로.** Auto layout 의 gap·padding 은 CSS Flexbox 의 `gap`·`padding` 과 거의 그대로 대응하므로 픽셀 측정보다 이 값을 우선 읽는다.

## 언제 쓰나
- 쓸 때: 디자이너·기획자·개발자가 한 파일에서 협업하고, 디자인 시스템 컴포넌트와 토큰을 코드와 맞춰야 할 때.
- 피할 때(대안): 셀프 호스팅·오픈소스가 필요하면 [Penpot](/develop-wiki/oss/self-hosted/penpot/), 오프라인 macOS 네이티브 작업이 중심이면 [Sketch](/develop-wiki/frontend/design-tools/sketch/).

## 공식 문서
- [도움말 센터](https://help.figma.com/hc/en-us) · [Dev Mode 가이드](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode) · [Variables 가이드](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma) · [요금](https://www.figma.com/pricing/)
