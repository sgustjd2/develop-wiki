---
name: Terraform MCP Server
url: https://developer.hashicorp.com/terraform/mcp-server
docs: https://developer.hashicorp.com/terraform/mcp-server
repo: https://github.com/hashicorp/terraform-mcp-server
stars: 1562
domain: oss
category: mcp-servers
description: HashiCorp 공식 Terraform MCP 서버. 레지스트리의 프로바이더·모듈·정책 문서를 조회하고 HCP Terraform·Terraform Enterprise 워크스페이스를 다룬다. IaC 코드를 최신 문서 기준으로 쓰게 할 때 쓴다.
pricing: oss
tags: [mcp, terraform, hashicorp, iac, hcp-terraform, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
[Terraform](/develop-wiki/backend/infra-devops/terraform/) 생태계용 MCP 서버로 Go 로 작성됐다. 기본은 공개 Terraform Registry 의 프로바이더·모듈·정책 정보를 에이전트에 주는 것이고, 토큰을 주면 HCP Terraform·Terraform Enterprise 의 조직·프로젝트·워크스페이스도 다룬다.
**2026-11 기준**: 별 1,562, 최신 릴리스 v1.4.1(2026-10-23), 마지막 푸시 2026-11-17. 라이선스 MPL-2.0. Docker 이미지 `hashicorp/terraform-mcp-server` 로 배포하고 `mcp.terraform.io/mcp` 원격 주소도 있다.

## 무엇이 들어 있나
- **레지스트리 도구 묶음**(기본 활성): 프로바이더 문서 검색·상세, 모듈 검색, 정책 조회.
- **`registry-private` · `terraform` 묶음**: 프라이빗 레지스트리, 워크스페이스 생성·수정·삭제, 변수·태그·실행(run) 관리(HCP Terraform·Enterprise 토큰 필요).
- 도구 목록은 [공식 레퍼런스](https://developer.hashicorp.com/terraform/docs/tools/mcp-server/reference#available-tools)에 정리돼 있다.
- 전송 방식은 stdio(기본)와 Streamable HTTP 둘 다 지원한다.

## 설치·사용법
Claude Code 에서 로컬(Docker)과 원격 두 방식이 문서에 있다.

```sh
# 로컬
claude mcp add terraform -s user -t stdio -- docker run -i --rm hashicorp/terraform-mcp-server

# 원격 (HCP Terraform 토큰)
claude mcp add terraform -s user -t http \
  --header "Authorization: Bearer <<TFE_TOKEN>>" \
  https://mcp.terraform.io/mcp
```

쓸 도구만 켜려면 `--toolsets=registry,terraform` 또는 `--tools=search_provider_docs,list_workspaces` 로 제한한다. 상태를 바꾸는 작업은 `ENABLE_TF_OPERATIONS`(기본 `false`)를 켜야 하며 명시적 승인이 필요한 도구들이다.

## 언제 쓰나 / 주의
- 쓸 때: 프로바이더 새 버전의 인자·리소스를 문서 기준으로 확인하며 HCL 을 쓸 때, 워크스페이스 상태와 변수를 에이전트가 점검하게 할 때.
- 보안: README 경고대로 질의에 따라 Terraform 데이터가 MCP 클라이언트와 LLM 에 노출된다. 신뢰할 수 없는 클라이언트·모델과 쓰지 않는다. 토큰은 최소 권한 팀 토큰으로 만들고, Streamable HTTP 로 중앙 배포할 때는 조직 허용 목록(`MCP_ORGANIZATION_ALLOWLIST`)을 쓴다.
- 서버 출력은 질의와 모델에 따라 달라지므로 `plan` 결과를 사람이 검토한 뒤 적용한다.

## 링크
- [공식 문서](https://developer.hashicorp.com/terraform/mcp-server) · [저장소](https://github.com/hashicorp/terraform-mcp-server)
- 이 사이트: [Terraform](/develop-wiki/backend/infra-devops/terraform/) · [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)
