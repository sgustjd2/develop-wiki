---
name: OpenAPI Specification
url: https://www.openapis.org
docs: https://spec.openapis.org/oas/latest.html
repo: https://github.com/OAI/OpenAPI-Specification
stars: 31327
domain: backend
category: api
description: HTTP API 의 경로, 요청·응답 스키마, 인증 방식을 YAML/JSON 으로 기술하는 표준 명세. API 문서 생성, 클라이언트·서버 코드 생성, 계약 검증에 쓴다.
pricing: oss
tags: [rest, openapi, swagger, json-schema, api-spec]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OpenAPI Specification(OAS)은 Linux Foundation 산하 OpenAPI Initiative 가 관리하는 HTTP API 기술 표준이다(옛 이름 Swagger). 하나의 문서에 엔드포인트, 파라미터, 요청·응답 본문 스키마, 보안 스킴을 적어 두면 사람이 읽는 문서, SDK 생성, 목 서버, 요청 검증, 계약 테스트를 모두 같은 원천에서 만든다.

**버전(2026-11)**: 최신은 **3.2.1**(2026-09 패치). 3.2.0(2025-09)은 3.1 과 하위 호환되는 마이너 버전으로 계층형 태그(`parent`, `kind`), `QUERY` 메서드와 `additionalOperations`, 스트리밍·순차 미디어 타입(`itemSchema`), `querystring` 파라미터 위치, OAuth 2.0 Device Authorization 흐름을 추가했다. 3.1 부터 스키마가 JSON Schema 2020-12 와 정렬됐다. 도구 지원은 아직 3.1 까지가 가장 넓다.

## 설치
명세 자체는 설치할 것이 없다. 자주 쓰는 도구:
```bash
npx @redocly/cli lint openapi.yaml              # 린트·번들
npx openapi-typescript openapi.yaml -o api.d.ts # TS 타입 생성
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `paths` | 경로 → 메서드(get/post/...) → Operation(파라미터, `requestBody`, `responses`) |
| `components` | 재사용 정의: `schemas`, `parameters`, `responses`, `securitySchemes` |
| `$ref` | 다른 위치·파일의 정의 참조 |
| Schema Object | JSON Schema 기반 데이터 모델(`type`, `properties`, `required`, `oneOf`) |
| `operationId` | 작업 고유 이름. 코드 생성 시 함수 이름이 된다 |
| `security` | API 키, HTTP Bearer, OAuth2, OpenID Connect 스킴 지정 |
| 디자인 우선 / 코드 우선 | 명세를 먼저 쓰고 코드를 맞추거나, 코드 주석·타입에서 명세를 생성 |

## 기본 사용법
```yaml
openapi: 3.1.0
info: { title: Todo API, version: 1.0.0 }
paths:
  /todos/{id}:
    get:
      operationId: getTodo
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Todo' }
        '404': { description: Not found }
components:
  schemas:
    Todo:
      type: object
      required: [id, title]
      properties:
        id: { type: integer }
        title: { type: string }
        done: { type: boolean, default: false }
```

## 자주 쓰는 패턴
- **코드 우선 생성**: [FastAPI](/develop-wiki/backend/web-framework/fastapi/)(타입 힌트), [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/)(`AddOpenApi`), Spring(springdoc-openapi), Go(huma, swaggo)처럼 프레임워크가 명세를 만들어 주는 방식을 먼저 검토한다.
- **클라이언트 생성**: TS 는 `openapi-typescript` + `openapi-fetch`, 다국어 SDK 는 OpenAPI Generator 로 만든다.
- **CI 검증**: 린트(Redocly CLI, Spectral)와 이전 버전 대비 깨지는 변경 검사(oasdiff 등)를 PR 단계에 넣는다.
- **문서 UI**: Swagger UI, Redoc, Scalar 로 명세를 렌더링해 배포한다.
- **이벤트 API 는 별도 명세**: 메시지 브로커 기반 API 는 [AsyncAPI](/develop-wiki/backend/api/asyncapi/) 로 기술한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 외부·다른 팀에 공개하는 REST API, 여러 언어 SDK 가 필요할 때, 프론트·백엔드 계약을 먼저 합의하는 개발 방식.
- 피할 때(대안): 서버와 클라이언트가 같은 TS 저장소에 있으면 [tRPC](/develop-wiki/backend/api/trpc/), 내부 서비스 간 고성능 RPC 는 [gRPC](/develop-wiki/backend/api/grpc/), 클라이언트가 필요한 필드를 고르는 API 는 [GraphQL](/develop-wiki/backend/api/graphql/).

## 공식 문서
- [최신 명세](https://spec.openapis.org/oas/latest.html) · [OpenAPI 학습 사이트](https://learn.openapis.org) · [3.1 → 3.2 업그레이드](https://learn.openapis.org/upgrading/v3.1-to-v3.2) · [도구 목록](https://tools.openapis.org)
