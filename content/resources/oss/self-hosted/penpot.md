---
name: Penpot
url: https://penpot.app
docs: https://help.penpot.app
repo: https://github.com/penpot/penpot
stars: 62519
domain: oss
category: self-hosted
description: 웹 기반 UI 디자인·프로토타이핑 도구. SVG·CSS 표준을 쓰고 Flex·Grid 레이아웃, 디자인 토큰, 코드 Inspect 를 지원해 디자이너·개발자 협업에 쓴다. MPL-2.0 라이선스.
pricing: oss
tags: [design, prototyping, design-tokens, svg, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Penpot 은 Figma 와 비슷한 브라우저 기반 디자인 도구지만, 디자인을 SVG 로 표현하고 레이아웃을 CSS Flexbox·Grid 개념 그대로 다뤄 개발자가 결과물을 코드로 옮기기 쉽다. 컴포넌트, 디자인 토큰, 프로토타입, 코멘트, 플러그인 API 를 지원한다. 2026-11 기준 최신 릴리스는 `2.19.2`. MPL-2.0 라이선스, 운영사 Kaleidos 가 클라우드(penpot.app)도 제공한다.

## Docker Compose 빠른 시작
여러 서비스(frontend, backend, exporter, PostgreSQL, Valkey 등)로 구성되므로 공식 compose 파일을 받아 쓴다.
```bash
curl -o docker-compose.yaml \
  https://raw.githubusercontent.com/penpot/penpot/main/docker/images/docker-compose.yaml
# 버전 고정 (compose 파일 기본값은 이보다 낮을 수 있음)
echo "PENPOT_VERSION=2.19.2" > .env
docker compose -p penpot -f docker-compose.yaml up -d     # http://localhost:9001
```
기능은 `PENPOT_FLAGS` 로 켜고 끈다. 기본 파일에는 `disable-email-verification enable-smtp enable-prepl-server disable-secure-session-cookies enable-mcp` 가 들어 있다. `disable-secure-session-cookies` 는 HTTP 로컬 테스트용이므로 HTTPS 운영에서는 빼고, `PENPOT_PUBLIC_URI` 를 실제 주소로 바꾼다. 가입을 막은 경우 계정은 CLI 로 만든다.
```bash
docker exec -ti penpot-penpot-backend-1 python3 manage.py create-profile
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Project / File / Page / Board | 프로젝트 안의 디자인 파일, 페이지, 보드(아트보드) |
| Flex / Grid Layout | CSS Flexbox·Grid 와 같은 속성의 자동 레이아웃 |
| Component / Library | 재사용 컴포넌트와 팀 공유 라이브러리 |
| Design Tokens | 색·간격·타이포 등을 토큰으로 정의하고 JSON 으로 내보내기 |
| Inspect | 선택한 요소의 CSS·SVG·HTML 코드와 치수 확인 |
| Prototype | 보드 간 인터랙션 연결과 미리보기 |
| Plugins / MCP | 플러그인 API, AI 에이전트 연동용 MCP 서버(`enable-mcp` 플래그) |

## 개발에서 쓰는 방법
- **핸드오프:** Inspect 탭에서 CSS 를 복사하고, Flex/Grid 레이아웃 값이 코드와 1:1 로 맞는지 확인.
- **디자인 토큰 파이프라인:** 토큰을 JSON 으로 내보내 Style Dictionary 등으로 CSS 변수·[Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/) 테마로 변환.
- **에셋 내보내기:** 아이콘·일러스트를 SVG 로 내보내 컴포넌트 라이브러리에 추가.
- **사내 디자인 도구:** 외부 SaaS 에 디자인 파일을 둘 수 없는 조직의 디자인 협업.

## 운영 주의: 백업·업데이트·보안
- **백업:** 기본 compose 는 볼륨 두 개를 쓴다 — PostgreSQL(`penpot_postgres_v15`)과 업로드 에셋(`penpot_assets`). 둘 다 임시 컨테이너로 아카이브하는 Docker 볼륨 백업 절차로 보관한다.
- **업데이트:** `docker compose -f docker-compose.yaml pull` 후 다시 `up -d`. 공식 문서는 먼 버전으로 한 번에 건너뛰지 말고 작은 단위로 올리라고 권한다. 버전은 `PENPOT_VERSION` 으로 고정.
- **보안:** 운영에서는 HTTPS 리버스 프록시 뒤에 두고 secure 쿠키를 켠다. 이메일 인증을 끈 상태에서 공개 가입을 열어 두지 않는다. SMTP 를 설정해야 초대·비밀번호 재설정 메일이 동작한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 오픈소스·셀프 호스팅 디자인 도구가 필요할 때, 웹 표준(CSS 레이아웃)에 가까운 디자인 산출물을 원할 때.
- 피할 때(대안): 빠른 손그림 다이어그램은 [Excalidraw](/develop-wiki/oss/self-hosted/excalidraw/), 이미 Figma 플러그인·커뮤니티 자산에 깊이 의존하는 팀은 전환 비용을 따져 본다.

## 공식 문서
- [Docker 설치](https://help.penpot.app/technical-guide/getting-started/docker/) · [설정(flags)](https://help.penpot.app/technical-guide/configuration/) · [사용자 가이드](https://help.penpot.app/user-guide/)
