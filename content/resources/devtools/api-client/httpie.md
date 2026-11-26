---
name: HTTPie
url: https://httpie.io
docs: https://httpie.io/docs/cli
repo: https://github.com/httpie/cli
stars: 38743
domain: devtools
category: api-client
description: key=value 형태의 짧은 문법과 색상 출력으로 HTTP API를 호출하는 명령줄 클라이언트. 터미널에서 JSON API를 사람이 읽기 쉽게 테스트할 때 쓴다.
pricing: oss
tags: [http, cli, api, json]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
HTTPie CLI(`http`, `https` 명령)는 요청 항목을 `헤더:값`, `필드=문자열`, `필드:=JSON`, `파라미터==값`처럼 구분 기호로 적으면 JSON 본문을 자동으로 만들어 주고, 응답을 색상·들여쓰기로 보여 준다. Python으로 작성된 BSD-3-Clause 오픈소스다. 최신 CLI는 **3.2.4**(2024-11)로, 이후 CLI 릴리스는 없고 회사는 별도 GUI 앱(Web/Desktop)도 운영한다.

- 대안: 같은 문법을 Rust로 구현한 **xh**(빠른 시작, 단일 바이너리), 범용·스크립트용은 [curl](/develop-wiki/devtools/api-client/curl/).

## 설치
```bash
brew install httpie
# 또는 pipx install httpie / uv tool install httpie
http --version
```

## 핵심 개념 (요청 항목 문법)
| 문법 | 뜻 | 예 |
| --- | --- | --- |
| `Header:Value` | 요청 헤더 | `Authorization:"Bearer $TOKEN"` |
| `name==value` | 쿼리 파라미터 | `page==2` |
| `field=value` | JSON 문자열 필드 | `name=kim` |
| `field:=json` | JSON 원시 값(숫자·배열·불리언) | `age:=30 tags:='["a"]'` |
| `field=@file` | 파일 내용을 문자열로 | `bio=@bio.txt` |
| `field@file` | 파일 업로드 (`--form` 과 함께) | `avatar@./me.png` |

## 기본 사용법
```bash
http GET api.example.com/users page==2              # 메서드 생략 시 본문 없으면 GET
http POST api.example.com/users name=kim age:=30    # JSON 본문 자동
http --form POST api.example.com/upload file@./a.png
http -a user:pass api.example.com/private           # 기본 인증
http -v api.example.com/health                      # 요청·응답 모두 출력
http --offline POST api.example.com/x a=1           # 보내지 않고 요청만 출력
http --download https://example.com/file.zip
```

## 자주 쓰는 패턴
- **세션.** `--session=dev`로 쿠키·인증 헤더를 저장해 다음 요청에 재사용.
- **localhost 축약.** `http :3000/api/items`는 `http://localhost:3000/api/items`.
- **출력 선택.** `-b`(본문만), `-h`(헤더만), `--print=HhBb`로 원하는 부분만.
- **파이프 입력.** `cat body.json | http POST :3000/items`.

## 언제 쓰나 / 피할 때
- 쓸 때: 개발 중 로컬 API를 손으로 빠르게 두드려 볼 때, 문서에 읽기 쉬운 예시를 남길 때.
- 피할 때(대안): 최소 설치·스크립트 이식성이 중요하면 curl. 활발히 업데이트되는 CLI를 원하면 xh. 팀이 공유하는 요청 컬렉션은 [Bruno](/develop-wiki/devtools/api-client/bruno/).

## 공식 문서
- [CLI 문서](https://httpie.io/docs/cli) · [저장소](https://github.com/httpie/cli) · [xh](https://github.com/ducaale/xh)
