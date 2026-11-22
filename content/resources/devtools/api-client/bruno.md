---
name: Bruno
url: https://www.usebruno.com/
docs: https://docs.usebruno.com/
repo: https://github.com/usebruno/bruno
stars: 48502
domain: devtools
category: api-client
description: 요청 컬렉션을 저장소 안 일반 텍스트 파일로 저장하는 오프라인 API 클라이언트. 계정·클라우드 동기화 없이 API 요청을 Git으로 공유할 때 쓴다.
pricing: oss
tags: [api-client, http, graphql, git, postman-alternative]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Bruno는 REST·GraphQL·gRPC 요청을 GUI로 보내고 테스트하는 API 클라이언트로, 컬렉션을 계정 없이 로컬 폴더에 텍스트 파일(현재 OpenCollection YAML, 기존 `.bru` 형식도 지원)로 저장한다. 그래서 PR로 요청 변경을 리뷰하고 브랜치별로 다르게 관리할 수 있다. 코어는 MIT 오픈소스이고, 팀·기업 기능은 유료 에디션으로 제공된다. 2026-11 기준 **v4.3.0**, CLI `@usebruno/cli` 4.3.0.

- **Postman**은 클라우드 워크스페이스 중심의 대표 API 플랫폼(Mock·모니터링·문서 공유 포함, 부분 무료)이다. 클라우드 공유가 필요하면 Postman, 저장소 중심이면 Bruno가 맞다.

## 설치
```bash
brew install --cask bruno
npm install -g @usebruno/cli     # 명령줄 실행기 (bru)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Collection | 요청 묶음 = 폴더. 저장소에 함께 커밋 |
| Environment | `local`, `staging` 등 변수 세트. `{{baseUrl}}`로 참조 |
| Secrets | 비밀 값은 커밋하지 않고 `.env` 또는 비밀 관리 연동 |
| Scripts | 요청 전·후 JavaScript (`bru.setVar`, `res.getBody()` 등) |
| Tests / Assertions | 응답 검사. CLI로 CI에서 실행 |
| Import | Postman·Insomnia 컬렉션, OpenAPI 명세 가져오기 |

## 기본 사용법
요청 후 테스트 스크립트 예:

```javascript
// Tests 탭
test("status 200", function () {
  expect(res.getStatus()).to.equal(200);
});

test("returns items", function () {
  const body = res.getBody();
  expect(body.items).to.be.an("array");
  bru.setVar("firstId", body.items[0].id);  // 다음 요청에서 {{firstId}}
});
```

CLI 실행 (컬렉션 폴더에서):

```bash
bru run --env local                     # 전체 컬렉션
bru run users --env staging             # 특정 폴더만
bru run --env ci --reporter-junit results.xml
```

## 자주 쓰는 패턴
- **API 코드와 같은 저장소.** `api-collection/` 폴더를 서비스 저장소에 두고 엔드포인트 변경과 함께 커밋.
- **OpenAPI에서 시작.** [OpenAPI](/develop-wiki/backend/api/openapi/) 명세를 가져와 요청을 자동 생성.
- **CI 회귀 검사.** 배포 후 `bru run`으로 스모크 테스트.
- **비밀 분리.** 토큰은 환경의 secret 값이나 `process.env`로 참조하고 `.env`는 `.gitignore`.

## 언제 쓰나 / 피할 때
- 쓸 때: Postman의 클라우드 동기화·계정 요구가 부담될 때, 요청을 코드처럼 리뷰하고 싶을 때.
- 피할 때(대안): 공개 API 문서·Mock 서버·모니터링까지 한 서비스에서 원하면 Postman. 터미널 한두 번 호출이면 [curl](/develop-wiki/devtools/api-client/curl/)·[HTTPie](/develop-wiki/devtools/api-client/httpie/).

## 공식 문서
- [문서](https://docs.usebruno.com/) · [CLI](https://docs.usebruno.com/bru-cli/overview) · [릴리스](https://github.com/usebruno/bruno/releases)
- [Postman 문서](https://learning.postman.com/docs/introduction/overview/)
