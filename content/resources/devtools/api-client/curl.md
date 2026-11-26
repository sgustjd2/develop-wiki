---
name: curl
url: https://curl.se/
docs: https://curl.se/docs/manpage.html
repo: https://github.com/curl/curl
stars: 43693
domain: devtools
category: api-client
description: 명령줄에서 HTTP를 비롯한 여러 프로토콜로 데이터를 주고받는 도구이자 libcurl 라이브러리. API 호출 확인, 스크립트 다운로드, 연결 문제 진단에 쓴다.
pricing: oss
tags: [http, cli, api, debugging, libcurl]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
curl은 HTTP(S)·HTTP/2·HTTP/3·FTP·WebSocket 등 수십 개 프로토콜을 지원하는 전송 도구다. 대부분 운영체제에 기본 설치되어 있어 문서·이슈에서 API 예제를 공유하는 사실상 공통 형식이 되었다(브라우저 개발자 도구의 "Copy as cURL"). 이 문서는 **8.23** 기준(2026-10 릴리스, curl 라이선스(MIT 계열)).

- 사람이 읽기 쉬운 출력과 짧은 문법이 필요하면 [HTTPie](/develop-wiki/devtools/api-client/httpie/), GUI 컬렉션 관리는 [Bruno](/develop-wiki/devtools/api-client/bruno/).

## 설치
```bash
curl --version        # macOS·Windows 10+·대부분 Linux 에 기본 포함
brew install curl     # 최신 버전이 필요할 때
```

## 핵심 옵션
| 옵션 | 뜻 |
| --- | --- |
| `-X METHOD` | 메서드 지정 (본문이 있으면 기본 POST) |
| `-H 'K: V'` | 요청 헤더 |
| `-d` / `--data-urlencode` | 본문 (form 인코딩) |
| `--json '<json>'` | JSON 본문 + Content-Type/Accept 헤더 자동 (7.82+) |
| `-F 'f=@file'` | multipart 업로드 |
| `-i` / `-I` | 응답 헤더 포함 / HEAD 요청 |
| `-L` | 리다이렉트 따라가기 |
| `-o 파일` / `-O` | 파일로 저장 / 원격 이름으로 저장 |
| `-s -S` | 진행률 숨김, 오류는 표시 |
| `--fail-with-body` | 4xx/5xx 면 종료 코드 22 (본문은 출력) |
| `-u user:pass` / `--oauth2-bearer` | 기본 인증 / Bearer 토큰 |
| `-v` / `--trace-ascii -` | 상세 / 바이트 단위 로그 |
| `-w '%{http_code}'` | 응답 정보 출력 형식 |
| `--resolve host:443:IP` | DNS 대신 지정 IP로 접속 |

## 기본 사용법
```bash
# GET + 헤더 확인
curl -i https://api.example.com/health

# JSON POST (토큰은 환경 변수로)
curl -sS --fail-with-body \
  --oauth2-bearer "$API_TOKEN" \
  --json '{"name":"dev.hub","tags":["wiki"]}' \
  https://api.example.com/items

# 파일 업로드
curl -F 'file=@./report.pdf' https://api.example.com/upload

# 응답 시간 측정
curl -o /dev/null -s -w 'dns=%{time_namelookup} connect=%{time_connect} total=%{time_total}\n' https://example.com
```

## 자주 쓰는 패턴
- **스크립트에서는 실패를 잡는다.** `-sS --fail-with-body`(또는 `-f`)로 HTTP 오류를 종료 코드로 바꾼다.
- **jq와 함께.** `curl -s ... | jq '.items[] | .id'`로 JSON 필드 추출.
- **브라우저 요청 재현.** 개발자 도구 Network → Copy as cURL로 그대로 터미널에서 재현.
- **재시도.** `--retry 3 --retry-all-errors`로 일시적 오류 대응.
- **TLS 문제 진단.** `-v`로 인증서 체인·SNI·ALPN 협상 확인. `-k`(검증 끄기)는 로컬 테스트에만.

## 언제 쓰나 / 피할 때
- 쓸 때: 어디서나 바로 쓰는 HTTP 요청, CI·셸 스크립트, 네트워크 문제 진단.
- 피할 때(대안): 요청이 많아 컬렉션·환경 변수·테스트를 관리해야 하면 Bruno·Postman. 트래픽을 가로채 보려면 [mitmproxy](/develop-wiki/devtools/api-client/mitmproxy/).

## 공식 문서
- [매뉴얼](https://curl.se/docs/manpage.html) · [Everything curl (책)](https://everything.curl.dev/) · [변경 이력](https://curl.se/changes.html)
