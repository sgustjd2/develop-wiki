---
name: MCP Registry
url: https://registry.modelcontextprotocol.io
docs: https://modelcontextprotocol.io/registry/about
repo: https://github.com/modelcontextprotocol/registry
stars: 7483
domain: ai
category: mcp-tooling
description: 공개 MCP 서버의 메타데이터(server.json)를 모으는 공식 레지스트리와 REST API, 게시용 mcp-publisher CLI. 서버 배포와 마켓플레이스 구축에 쓴다.
pricing: oss
tags: [mcp, registry, discovery, publishing]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
MCP Registry 는 [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 프로젝트가 운영하는 공개 MCP 서버 목록이다. 패키지 자체(npm, PyPI, Docker 이미지 등)는 저장하지 않고, "어떤 패키지·원격 URL 을 어떻게 실행하는가"를 적은 메타데이터(`server.json`)만 보관한다. 이름은 `io.github.<사용자>/<서버>` 같은 역DNS 형식이며, GitHub 계정이나 도메인 소유를 증명해야 그 네임스페이스로 게시할 수 있다.
레지스트리는 호스트 앱이 직접 읽기보다 **다운스트림 애그리게이터**(마켓플레이스, 사내 레지스트리)가 주기적으로 긁어 가 큐레이션·보안 검사를 덧붙이는 구조를 의도한다. 같은 OpenAPI 명세를 구현하면 사내 레지스트리도 호환 클라이언트에서 쓸 수 있다.
**2026-11 기준**: 서비스는 아직 **preview**(GA 전, 데이터 초기화·호환성 변경 가능)이고, 읽기 API 는 `v0.1` 로 동결돼 있다. 서버·CLI 릴리스는 v1.8.9, `server.json` 스키마 버전은 `2025-12-11`.

## 설치
게시 도구 `mcp-publisher` 를 설치한다. 조회만 할 때는 설치가 필요 없다(`curl` 로 API 호출).

```bash
brew install mcp-publisher        # Homebrew
mcp-publisher --help              # init, login, publish, validate, status ...
```

Homebrew 가 없으면 GitHub Releases 의 `mcp-publisher_<os>_<arch>.tar.gz` 바이너리를 내려받는다. 레지스트리 서버 코드(Go)는 공개돼 있지만 공식적으로 자체 호스팅용은 아니다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `server.json` | 서버 이름·설명(100자 제한)·버전·`packages`/`remotes` 를 담은 메타데이터 파일 |
| `packages` | 실행 가능한 패키지 정보. `registryType`(npm, pypi, nuget, oci, mcpb, cargo 등)·`identifier`·`transport`·환경 변수 |
| `remotes` | 원격 서버 URL (`streamable-http` 등). 패키지 없이 원격 전용으로도 게시 가능 |
| 네임스페이스 인증 | `io.github.*` 는 GitHub 로그인, `com.example/*` 같은 도메인 이름은 DNS TXT 레코드나 HTTP 파일로 소유 증명 |
| 패키지 소유 확인 | npm 은 `package.json` 의 `mcpName`, PyPI·NuGet 은 README 의 `mcp-name: <서버 이름>` 문자열로 확인 |
| 버전 | 게시마다 고유해야 하고 수정 불가. semver 권장, `^1.0` 같은 범위 표기는 거부 |
| 애그리게이터 | 레지스트리를 주기적으로(예: 1시간마다) 가져가 자체 저장소에 두는 하위 서비스 |

## 기본 사용법
npm 패키지로 배포한 서버를 게시하는 흐름:

```bash
# 1) package.json 에 소유 확인 필드 추가: "mcpName": "io.github.my-user/weather"
npm publish --access public          # 패키지를 먼저 npm 에 게시

# 2) server.json 생성 후 내용 확인·수정
mcp-publisher init

# 3) 네임스페이스 인증 후 게시
mcp-publisher login github
mcp-publisher publish
```

게시 결과와 공개 목록 조회(인증 없는 읽기 API):

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.my-user/weather"
curl "https://registry.modelcontextprotocol.io/v0.1/servers?limit=100"
# 경로 파라미터는 URL 인코딩: io.modelcontextprotocol/everything → io.modelcontextprotocol%2Feverything
curl "https://registry.modelcontextprotocol.io/v0.1/servers/io.modelcontextprotocol%2Feverything/versions/latest"
```

## 자주 쓰는 패턴
- **페이지네이션·증분 동기화**: 응답의 `metadata.nextCursor` 를 `cursor=` 로 넘겨 다음 페이지를 받고, `updated_since=<RFC 3339 시각>` 으로 바뀐 항목만 가져온다.
- **원격 전용 서버 게시**: 패키지 없이 `remotes` 에 공개 HTTPS URL 만 적어 게시할 수 있다. 레지스트리는 네임스페이스만 검증하고 URL 소유는 검증하지 않는다.
- **CI 자동 게시**: 태그 푸시 시 GitHub Actions 에서 `mcp-publisher login github-oidc` 로 로그인해 `mcp-publisher publish` 를 실행한다(공식 GitHub Actions 가이드).
- **게시 전 검증**: `mcp-publisher validate` 로 스키마·설명 길이 오류를 미리 잡는다.
- **조직 네임스페이스**: `io.github.<조직>/*` 는 조직 Owner 만 게시할 수 있고, 대화형 `mcp-publisher login github` 로는 불가하다. GitHub Actions OIDC(`login github-oidc`)나 `read:org` 권한의 개인 토큰(`login github --token`)을 쓴다.
- **사내 레지스트리**: 공개 레지스트리가 비공개 서버를 받지 않으므로, 사내용은 같은 OpenAPI 명세를 구현한 별도 레지스트리나 [ContextForge](/develop-wiki/ai/mcp-tooling/contextforge/) 같은 게이트웨이의 카탈로그를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 직접 만든 MCP 서버를 공개 배포할 때, MCP 서버 마켓플레이스·검색 서비스를 만들 때, 어떤 서비스에 공식 MCP 서버가 있는지 찾아볼 때.
- 피할 때(대안): 사내망·비공개 패키지 레지스트리에만 있는 서버는 게시 대상이 아니다. 레지스트리는 보안 심사를 하지 않으므로 등록돼 있다는 사실만으로 서버를 신뢰하지 않는다. MCP 를 익히는 단계라면 [MCP Reference Servers](/develop-wiki/ai/mcp-tooling/mcp-reference-servers/) 부터 시작한다.

## 공식 문서
- [소개](https://modelcontextprotocol.io/registry/about) · [게시 Quickstart](https://modelcontextprotocol.io/registry/quickstart) · [인증 방식](https://modelcontextprotocol.io/registry/authentication) · [패키지 유형](https://modelcontextprotocol.io/registry/package-types)
- [애그리게이터용 API 가이드](https://modelcontextprotocol.io/registry/registry-aggregators) · [Live API 문서](https://registry.modelcontextprotocol.io/docs) · [GitHub](https://github.com/modelcontextprotocol/registry)
