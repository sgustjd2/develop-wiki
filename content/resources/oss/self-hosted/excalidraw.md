---
name: Excalidraw
url: https://excalidraw.com
docs: https://docs.excalidraw.com
repo: https://github.com/excalidraw/excalidraw
stars: 136185
domain: oss
category: self-hosted
description: 손그림 느낌의 다이어그램을 그리는 웹 화이트보드. 아키텍처 스케치에 많이 쓰고 React 컴포넌트(@excalidraw/excalidraw)로 앱에 넣을 수 있다. MIT 라이선스.
pricing: oss
tags: [whiteboard, diagram, react, sketch, self-hosted]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Excalidraw 는 브라우저에서 바로 쓰는 화이트보드로, 손으로 그린 듯한 도형·화살표·텍스트로 아키텍처 다이어그램이나 흐름도를 빠르게 그린다. 그림은 JSON(`.excalidraw`)으로 저장되고 PNG·SVG 로 내보낼 수 있다. 같은 편집기가 npm 패키지 `@excalidraw/excalidraw` 로 배포돼 자기 앱에 임베드할 수 있다. 패키지 최신 릴리스는 `v0.18.1`(2026-04). MIT 라이선스, 유료 협업판 Excalidraw+ 가 있다.

## Docker Compose 빠른 시작
공식 이미지 `excalidraw/excalidraw` 는 정적 웹 앱(nginx)이다.
```yaml
# compose.yaml
services:
  excalidraw:
    image: excalidraw/excalidraw:latest
    ports:
      - "5000:80"
    restart: unless-stopped
```
```bash
docker compose up -d     # http://localhost:5000
```
공식 문서에 따르면 셀프 호스팅 이미지는 **공유 링크·실시간 협업 기능을 지원하지 않는다**(완전한 셀프 호스팅 방안은 준비 중). 이미지에는 분석·추적 라이브러리가 들어 있지 않다. 그림은 브라우저 로컬 저장소에 남으므로 파일로 저장해 관리한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Scene | 요소(element) 배열 + appState. `.excalidraw` JSON 으로 저장 |
| Element | 사각형, 타원, 화살표, 선, 텍스트, 이미지, 프레임 |
| Library | 재사용 도형 묶음(`.excalidrawlib`). 공개 라이브러리에서 가져오기 |
| Export | PNG·SVG 내보내기, "장면 포함" 옵션으로 다시 편집 가능한 이미지 |
| Mermaid 변환 | Mermaid 문법을 Excalidraw 도형으로 변환 |
| Excalidraw API | 임베드 시 `excalidrawAPI` 로 장면 읽기·갱신 |

## 개발에서 쓰는 방법
- **설계 리뷰 스케치:** 시스템 구성도·시퀀스를 빠르게 그려 PR·문서에 SVG 로 첨부. 장면 포함 PNG/SVG 는 저장소에 넣어 두고 나중에 다시 편집.
- **텍스트 다이어그램과 병행:** 정형 다이어그램은 [Mermaid](/develop-wiki/devtools/docs/mermaid/) 로 쓰고 Excalidraw 로 변환해 손으로 다듬기.
- **앱에 화이트보드 임베드:** React 앱에 편집기 컴포넌트를 넣는다(브라우저 전용이라 SSR 프레임워크에서는 클라이언트 전용 로딩 필요).
```bash
npm install @excalidraw/excalidraw
```
```tsx
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

export default function Board() {
  return (
    <div style={{ height: 600 }}>
      <Excalidraw onChange={(elements) => console.log(elements.length)} />
    </div>
  );
}
```

## 운영 주의: 백업·업데이트·보안
- **백업:** 기본 셀프 호스팅 이미지는 서버에 데이터를 저장하지 않는다. 브라우저 로컬 저장소는 쉽게 지워지므로 `.excalidraw` 파일을 Git·공유 드라이브에 저장하는 습관이 백업이다.
- **업데이트:** 정적 이미지라 `docker compose pull && up -d` 로 끝난다. npm 패키지는 0.x 버전이라 마이너 업데이트에도 API·CSS import 방식이 바뀔 수 있으니 변경 기록을 확인한다.
- **보안:** 서버 측 저장이 없어 공격 면은 작지만, 사내 전용이라면 리버스 프록시 인증 뒤에 둔다. 공개 excalidraw.com 의 공유 링크는 종단 간 암호화되지만 민감 도면은 사내 인스턴스·로컬 파일을 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 빠른 손그림 다이어그램, 앱 내 화이트보드 기능.
- 피할 때(대안): 코드와 함께 버전 관리하는 정형 다이어그램은 [Mermaid](/develop-wiki/devtools/docs/mermaid/), UI 디자인·프로토타입은 [Penpot](/develop-wiki/oss/self-hosted/penpot/).

## 공식 문서
- [개발·셀프 호스팅](https://docs.excalidraw.com/docs/introduction/development) · [패키지 통합 가이드](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration) · [릴리스](https://github.com/excalidraw/excalidraw/releases)
