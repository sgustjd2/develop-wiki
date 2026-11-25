---
name: Buf
url: https://buf.build
docs: https://buf.build/docs/
repo: https://github.com/bufbuild/buf
stars: 11539
domain: backend
category: api
description: Protocol Buffers 스키마의 린트, 깨지는 변경 검사, 포맷, 코드 생성을 하나로 묶은 CLI. protoc 를 대신해 gRPC·Connect 스키마를 관리할 때 쓴다.
pricing: oss
tags: [protobuf, grpc, schema, lint, codegen]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Buf CLI 는 `.proto` 파일을 다루는 도구 모음이다. 자체 컴파일러로 스키마를 빌드하고, 스타일 규칙 린트(`buf lint`), 이전 버전 대비 와이어·소스 호환성 검사(`buf breaking`), 포맷(`buf format`), 플러그인 기반 코드 생성(`buf generate`)을 제공한다. `protoc` 와 플러그인 경로·include 관리를 YAML 설정으로 대체해 [gRPC](/develop-wiki/backend/api/grpc/) 스키마 운영을 단순하게 만든다.

CLI 는 Apache-2.0 오픈소스이고, 원격 플러그인·스키마 레지스트리(BSR)는 Buf 사가 운영하는 서비스(무료 등급 있음)다. 2026-11 기준 최신 CLI 는 **1.75.0**, 설정 형식은 `version: v2`. 같은 회사가 브라우저·HTTP 친화적인 RPC 프로토콜 **Connect**(connect-go, connect-es 등)와 TS 런타임 `@bufbuild/protobuf`(2.x)도 만든다.

## 설치
```bash
brew install bufbuild/buf/buf
# 또는 npm 프로젝트에서
npm install -D @bufbuild/buf
buf --version
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 워크스페이스 | `buf.yaml`(v2)이 있는 루트. `modules` 로 여러 proto 디렉터리 관리 |
| 모듈 | 함께 버전 관리되는 proto 파일 묶음. BSR 에 게시 가능 |
| lint 규칙 | `STANDARD` 등 규칙 묶음. 패키지 버전 접미사(`.v1`), 이름 규칙 검사 |
| breaking 규칙 | `FILE`, `PACKAGE`, `WIRE_JSON`, `WIRE` 수준으로 호환성 검사 |
| `buf.gen.yaml` | 생성 플러그인(로컬 또는 `remote:`)과 출력 경로 지정 |
| 관리 모드 | `managed.enabled` 로 `go_package` 같은 언어별 옵션을 proto 에 쓰지 않고 자동 주입 |

## 기본 사용법
```yaml
# buf.yaml
version: v2
modules:
  - path: proto
lint:
  use: [STANDARD]
breaking:
  use: [FILE]
```
```yaml
# buf.gen.yaml — Go + Connect 코드 생성 (원격 플러그인)
version: v2
managed:
  enabled: true
  override:
    - file_option: go_package_prefix
      value: example.com/myapp/gen
plugins:
  - remote: buf.build/protocolbuffers/go
    out: gen
    opt: paths=source_relative
  - remote: buf.build/connectrpc/go
    out: gen
    opt: paths=source_relative
inputs:
  - directory: proto
```
```bash
buf lint
buf format -w
buf breaking --against '.git#branch=main'
buf generate
```

## 자주 쓰는 패턴
- **PR 게이트**: CI 에서 `buf lint` 와 `buf breaking --against` 로 메인 브랜치 대비 깨지는 변경을 막는다. GitHub Actions 는 `bufbuild/buf-action` 을 쓴다.
- **로컬 플러그인**: 네트워크 없이 생성하려면 `remote:` 대신 `local: protoc-gen-go` 로 설치된 플러그인을 지정한다.
- **의존성**: `buf.yaml` 의 `deps` 에 `buf.build/googleapis/googleapis` 등을 넣고 `buf dep update` 로 `buf.lock` 을 갱신한다.
- **Connect 사용**: 같은 proto 로 gRPC·gRPC-Web·Connect(HTTP/1.1 JSON 가능)를 모두 서비스해 브라우저 클라이언트를 지원한다.

## 언제 쓰나 / 피할 때
- 쓸 때: proto 파일이 여러 서비스·팀에 걸쳐 있을 때, 스키마 호환성 규칙을 자동으로 강제하고 싶을 때, protoc 설치·플러그인 버전 관리가 번거로울 때.
- 피할 때(대안): proto 파일이 몇 개뿐이고 단일 언어만 생성하면 `protoc` 또는 언어별 빌드 플러그인(Gradle protobuf 플러그인, `tonic-build`)으로 충분하다.

## 공식 문서
- [문서](https://buf.build/docs/) · [CLI 퀵스타트](https://buf.build/docs/cli/quickstart/) · [buf.yaml 레퍼런스](https://buf.build/docs/configuration/v2/buf-yaml/) · [Connect](https://connectrpc.com/docs/introduction)
